import { useState, useRef, useCallback, useEffect } from "react";
import * as faceapi from "face-api.js";
import { Person, initialPersons, getPersonPhotoSources, BodyMark } from "@/data/persons";
import {
  FACE_MATCH_DISTANCE_THRESHOLD,
  distanceToSimilarityPercent,
  logFaceMatchDebug,
} from "@/lib/faceDescriptorSimilarity";

interface LabeledPerson {
  person: Person;
  descriptor: Float32Array;
}

/** Pesos oficiais do face-api.js (CORS ok); usa se /models no site falhar. */
const REMOTE_MODEL_BASE =
  "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

async function descriptorFromImage(imageSrc: string): Promise<Float32Array | null> {
  const img = await faceapi.fetchImage(imageSrc);
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection?.descriptor ?? null;
}

async function addPersonDescriptors(person: Person, labeled: LabeledPerson[]) {
  for (const photoSrc of getPersonPhotoSources(person)) {
    try {
      const descriptor = await descriptorFromImage(photoSrc);
      if (descriptor) {
        labeled.push({ person, descriptor });
      }
    } catch (e) {
      console.warn(`Could not process photo for ${person.name}:`, e);
    }
  }
}
async function loadFaceModels(modelBaseUri: string) {
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(modelBaseUri),
    faceapi.nets.faceLandmark68Net.loadFromUri(modelBaseUri),
    faceapi.nets.faceRecognitionNet.loadFromUri(modelBaseUri),
  ]);
}

export function useFaceRecognition() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [persons, setPersons] = useState<Person[]>(initialPersons);
  const labeledRef = useRef<LabeledPerson[]>([]);
  const [dbReady, setDbReady] = useState(false);

  // Load models (pasta local em public/models no deploy; senão CDN do repositório oficial)
  useEffect(() => {
    const load = async () => {
      const base = import.meta.env.BASE_URL.endsWith("/")
        ? import.meta.env.BASE_URL
        : `${import.meta.env.BASE_URL}/`;
      const localModels = `${base}models`;
      try {
        await loadFaceModels(localModels);
      } catch (e) {
        console.warn("Modelos locais indisponíveis, usando CDN:", e);
        await loadFaceModels(REMOTE_MODEL_BASE);
      }
      setModelsLoaded(true);
      setLoading(false);
    };
    load().catch((e) => {
      console.error("Failed to load models:", e);
      const msg = e instanceof Error ? e.message : String(e);
      setLoadError(msg);
      setLoading(false);
    });
  }, []);

  // Build face descriptors from person images
  const buildDatabase = useCallback(async () => {
    if (!modelsLoaded) return;
    setLoading(true);
    const labeled: LabeledPerson[] = [];
    try {
      for (const person of persons) {
        await addPersonDescriptors(person, labeled);
      }
      labeledRef.current = labeled;
    } finally {
      setDbReady(true);
      setLoading(false);
    }
  }, [modelsLoaded, persons]);

  useEffect(() => {
    if (modelsLoaded) buildDatabase();
  }, [modelsLoaded, buildDatabase]);

  // Match a single face
  const matchFace = useCallback(
    async (
      imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
    ): Promise<{ person: Person; distance: number } | null> => {
      if (!dbReady || labeledRef.current.length === 0) return null;
      const detection = await faceapi
        .detectSingleFace(imageElement)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) return null;
      let bestMatch: { person: Person; distance: number } | null = null;
      for (const entry of labeledRef.current) {
        const distance = faceapi.euclideanDistance(detection.descriptor, entry.descriptor);
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = { person: entry.person, distance };
        }
      }
      if (bestMatch && bestMatch.distance < FACE_MATCH_DISTANCE_THRESHOLD) {
        logFaceMatchDebug("matchFace", bestMatch.distance, distanceToSimilarityPercent(bestMatch.distance));
        return bestMatch;
      }
      return null;
    },
    [dbReady]
  );

  // Match ALL faces in an image
  const matchAllFaces = useCallback(
    async (
      imageElement: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
    ): Promise<
      Array<{
        person: Person | null;
        distance: number | null;
        box: { x: number; y: number; width: number; height: number };
      }>
    > => {
      if (!dbReady) return [];
      const detections = await faceapi
        .detectAllFaces(imageElement)
        .withFaceLandmarks()
        .withFaceDescriptors();
      if (!detections || detections.length === 0) return [];

      return detections.map((det, index) => {
        const { x, y, width, height } = det.detection.box;
        let bestMatch: { person: Person; distance: number } | null = null;
        for (const entry of labeledRef.current) {
          const distance = faceapi.euclideanDistance(det.descriptor, entry.descriptor);
          if (!bestMatch || distance < bestMatch.distance) {
            bestMatch = { person: entry.person, distance };
          }
        }
        if (bestMatch && bestMatch.distance < FACE_MATCH_DISTANCE_THRESHOLD) {
          const sim = distanceToSimilarityPercent(bestMatch.distance);
          logFaceMatchDebug(`matchAllFaces#${index} → ${bestMatch.person.name}`, bestMatch.distance, sim);
          return { person: bestMatch.person, distance: bestMatch.distance, box: { x, y, width, height } };
        }
        return { person: null, distance: null, box: { x, y, width, height } };
      });
    },
    [dbReady]
  );

  // Add a new person
  const addPerson = useCallback(
    async (
      name: string,
      imageSrc: string,
      options?: {
        notes?: string;
        bodyMarks?: Omit<BodyMark, "id">[];
        additionalPhotos?: string[];
      }
    ) => {
      const newPerson: Person = {
        id: crypto.randomUUID(),
        name,
        imageSrc,
        notes: options?.notes || "",
        bodyMarks: (options?.bodyMarks ?? []).map((mark) => ({
          ...mark,
          id: crypto.randomUUID(),
          observation: mark.observation?.trim() || "",
        })),
        additionalPhotos: options?.additionalPhotos ?? [],
        registeredAt: new Date().toISOString().split("T")[0],
      };
      setPersons((prev) => [...prev, newPerson]);

      await addPersonDescriptors(newPerson, labeledRef.current);

      return newPerson;
    },
    []
  );

  return { modelsLoaded, loading, loadError, dbReady, persons, matchFace, matchAllFaces, addPerson };
}
