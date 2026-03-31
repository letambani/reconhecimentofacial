import { useState, useCallback } from "react";
import { Shield, Loader2 } from "lucide-react";
import CameraCapture, { FaceResult } from "@/components/CameraCapture";
import MatchResult from "@/components/MatchResult";
import QuickRegister from "@/components/QuickRegister";
import { useFaceRecognition } from "@/hooks/useFaceRecognition";
import { Person } from "@/data/persons";

type AppState = "camera" | "result" | "register";

export default function Index() {
  const { loading, dbReady, persons, matchFace, matchAllFaces, addPerson } = useFaceRecognition();
  const [state, setState] = useState<AppState>("camera");
  const [scanning, setScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceResults, setFaceResults] = useState<FaceResult[]>([]);
  const [selectedUnknownIndex, setSelectedUnknownIndex] = useState<number | null>(null);

  const handleMultiCapture = useCallback(
    async (imageDataUrl: string) => {
      setCapturedImage(imageDataUrl);
      setScanning(true);

      const img = new Image();
      img.src = imageDataUrl;
      await new Promise((r) => (img.onload = r));

      const results = await matchAllFaces(img);
      setFaceResults(results);
      setScanning(false);

      if (results.length === 0) {
        // No faces detected at all - go to single result
        setState("result");
      }
      // Stay on camera view showing bounding boxes
    },
    [matchAllFaces]
  );

  const handleRegister = useCallback(
    async (name: string, notes: string) => {
      if (!capturedImage) return;
      await addPerson(name, capturedImage, notes);
      reset();
    },
    [addPerson, capturedImage]
  );

  const reset = () => {
    setState("camera");
    setCapturedImage(null);
    setFaceResults([]);
    setSelectedUnknownIndex(null);
  };

  if (loading || !dbReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="font-heading text-sm uppercase tracking-widest text-muted-foreground">
          Carregando modelos de reconhecimento...
        </p>
      </div>
    );
  }

  const unknownFaces = faceResults.filter((r) => r.person === null);
  const knownFaces = faceResults.filter((r) => r.person !== null);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-lg mx-auto flex items-center gap-3 py-3 px-4">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-base leading-tight">PMSC — São José</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
              Sistema de Reconhecimento Facial
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container max-w-lg mx-auto px-4 py-6 space-y-4">
        {state === "camera" && (
          <>
            <CameraCapture
              onCapture={() => {}}
              onMultiCapture={handleMultiCapture}
              scanning={scanning}
              faceResults={faceResults}
            />

            {/* Results summary below camera */}
            {faceResults.length > 0 && (
              <div className="space-y-3">
                {knownFaces.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border border-success/40 bg-success/5"
                  >
                    <img
                      src={r.person!.imageSrc}
                      alt={r.person!.name}
                      className="w-12 h-12 rounded-md object-cover border border-border"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-heading text-foreground">{r.person!.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Confiança: {Math.round((1 - r.distance!) * 100)}%
                      </p>
                      {r.person!.notes && (
                        <p className="text-xs text-muted-foreground">Obs: {r.person!.notes}</p>
                      )}
                    </div>
                    <span className="text-xs font-heading text-success uppercase">Identificado</span>
                  </div>
                ))}

                {unknownFaces.map((_, i) => (
                  <div
                    key={`unknown-${i}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-destructive/40 bg-destructive/5"
                  >
                    <div>
                      <p className="text-sm font-heading text-foreground">Pessoa Desconhecida</p>
                      <p className="text-xs text-muted-foreground">Sem correspondência no banco</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUnknownIndex(i);
                        setState("register");
                      }}
                      className="px-3 py-1.5 rounded-md bg-accent text-accent-foreground font-heading font-semibold uppercase tracking-wider text-xs hover:brightness-110 transition"
                    >
                      Cadastrar
                    </button>
                  </div>
                ))}

                <button
                  onClick={reset}
                  className="w-full px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-heading font-semibold uppercase tracking-wider text-xs hover:brightness-110 transition"
                >
                  Nova Consulta
                </button>
              </div>
            )}
          </>
        )}

        {state === "result" && (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Nenhum rosto detectado na imagem.
            </p>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-heading font-semibold uppercase tracking-wider text-xs hover:brightness-110 transition"
            >
              Nova Consulta
            </button>
          </div>
        )}

        {state === "register" && capturedImage && (
          <QuickRegister
            capturedImage={capturedImage}
            onRegister={handleRegister}
            onCancel={() => setState("camera")}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-2">
        <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest">
          Polícia Militar de Santa Catarina — Uso Restrito
        </p>
      </footer>
    </div>
  );
}
