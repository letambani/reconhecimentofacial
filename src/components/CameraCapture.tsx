import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { Person } from "@/data/persons";

export interface FaceResult {
  person: Person | null;
  distance: number | null;
  box: { x: number; y: number; width: number; height: number };
}

interface CameraCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  onMultiCapture?: (imageDataUrl: string) => void;
  scanning?: boolean;
  faceResults?: FaceResult[];
}

export default function CameraCapture({
  onCapture,
  onMultiCapture,
  scanning,
  faceResults,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
        setError("");
      }
    } catch {
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream)
          .getTracks()
          .forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  // Draw bounding boxes on overlay
  useEffect(() => {
    if (!overlayRef.current || !videoRef.current) return;
    const overlay = overlayRef.current;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    const vw = videoRef.current.videoWidth || 640;
    const vh = videoRef.current.videoHeight || 480;
    overlay.width = vw;
    overlay.height = vh;
    ctx.clearRect(0, 0, vw, vh);

    if (!faceResults || faceResults.length === 0) return;

    faceResults.forEach((result) => {
      const { x, y, width, height } = result.box;
      const isMatch = result.person !== null;

      // Box
      ctx.strokeStyle = isMatch ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);

      // Label background
      const label = isMatch
        ? `${result.person!.name} (${Math.round((1 - result.distance!) * 100)}%)`
        : "Desconhecido";
      ctx.font = "bold 16px sans-serif";
      const textWidth = ctx.measureText(label).width;
      const labelHeight = 24;
      ctx.fillStyle = isMatch ? "rgba(34,197,94,0.85)" : "rgba(239,68,68,0.85)";
      ctx.fillRect(x, y - labelHeight - 2, textWidth + 12, labelHeight);

      // Label text
      ctx.fillStyle = "#ffffff";
      ctx.fillText(label, x + 6, y - 8);
    });
  }, [faceResults]);

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
    if (onMultiCapture) {
      onMultiCapture(dataUrl);
    } else {
      onCapture(dataUrl);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-lg border-2 border-primary/50 glow-primary">
        {scanning && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute inset-x-0 h-1 bg-primary/60 animate-scan" />
          </div>
        )}
        {/* Corner brackets */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary z-10" />
        <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary z-10" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary z-10" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary z-10" />

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full aspect-[4/3] object-cover bg-muted"
        />
        {/* Overlay canvas for bounding boxes */}
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />
        <canvas ref={canvasRef} className="hidden" />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-4">
            <p className="text-destructive text-center text-sm">{error}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={capture}
          disabled={!streaming || scanning}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-heading font-semibold uppercase tracking-wider text-sm hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed glow-primary"
        >
          <Camera className="w-5 h-5" />
          {scanning ? "Analisando..." : "Capturar"}
        </button>
        <button
          onClick={startCamera}
          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-heading font-semibold uppercase tracking-wider text-sm hover:brightness-110 transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
