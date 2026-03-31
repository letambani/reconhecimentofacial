import { useState, useRef, useCallback, useEffect } from "react";
import * as faceapi from "face-api.js";
import { Person, initialPersons } from "@/data/persons";

interface LabeledPerson {
  person: Person;
  descriptor: Float32Array;
}

export function useFaceRecognition() {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [persons, setPersons] = useState<Person[]>(initialPersons);
  const labeledRef = useRef<LabeledPerson[]>([]);
  const [dbReady, setDbReady] = useState(false);

  // Load models
  useEffect(() => {
    const load = async () => {
      const MODEL_URL = `${import.meta.env.BASE_URL}models`;
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setLoading(false);
    };
    load().catch((e) => {
      console.error("Failed to load models:", e);
      setLoading(false);
    });
  }, []);

  // Build face descriptors from person images
  const buildDatabase = useCallback(async () => {
    if (!modelsLoaded) return;
    setLoading(true);
    const labeled: LabeledPerson[] = [];

    for (const person of persons) {
      try {
        const img = await faceapi.fetchImage(person.imageSrc);
        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (detection) {
          labeled.push({ person, descriptor: detection.descriptor });
        }
      } catch (e) {
        console.warn(`Could not process ${person.name}:`, e);
      }
    }

    labeledRef.current = labeled;
    setDbReady(true);
    setLoading(false);
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
      if (bestMatch && bestMatch.distance < 0.6) return bestMatch;
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

      return detections.map((det) => {
        const { x, y, width, height } = det.detection.box;
        let bestMatch: { person: Person; distance: number } | null = null;
        for (const entry of labeledRef.current) {
          const distance = faceapi.euclideanDistance(det.descriptor, entry.descriptor);
          if (!bestMatch || distance < bestMatch.distance) {
            bestMatch = { person: entry.person, distance };
          }
        }
        if (bestMatch && bestMatch.distance < 0.6) {
          return { person: bestMatch.person, distance: bestMatch.distance, box: { x, y, width, height } };
        }
        return { person: null, distance: null, box: { x, y, width, height } };
      });
    },
    [dbReady]
  );

  // Add a new person
  const addPerson = useCallback(
    async (name: string, imageSrc: string, notes?: string) => {
      const newPerson: Person = {
        id: crypto.randomUUID(),
        name,
        imageSrc,
        notes: notes || "",
        registeredAt: new Date().toISOString().split("T")[0],
      };
      setPersons((prev) => [...prev, newPerson]);

      // Also add descriptor
      try {
        const img = await faceapi.fetchImage(imageSrc);
        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (detection) {
          labeledRef.current.push({
            person: newPerson,
            descriptor: detection.descriptor,
          });
        }
      } catch (e) {
        console.warn("Could not compute descriptor for new person:", e);
      }

      return newPerson;
    },
    []
  );

  return { modelsLoaded, loading, dbReady, persons, matchFace, matchAllFaces, addPerson };
}
