import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RotateCcw, Upload } from "lucide-react";
import { Person } from "@/data/persons";

export interface FaceResult {
  person: Person | null;
  distance: number | null;
  box: { x: number; y: number; width: number; height: number };
}

const ACCEPTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function isAllowedImageFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime && ACCEPTED_MIME_TYPES.has(mime)) return true;
  const name = file.name.toLowerCase();
  return /\.(jpe?g|png|webp)$/.test(name);
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
  faceResults = [],
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const [streaming, setStreaming] = useState(false);
  /** Falha que impede vídeo (ex.: permissão negada na câmera ativa). */
  const [streamError, setStreamError] = useState("");
  /** Aviso informativo: uma só câmera ou troca para traseira indisponível. */
  const [cameraNotice, setCameraNotice] = useState<{
    variant: "info" | "error";
    text: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  /** Mostra a imagem do arquivo no quadro (em vez só do vídeo ao vivo). */
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [previewLayoutNonce, setPreviewLayoutNonce] = useState(0);

  const stopTracks = useCallback(() => {
    const video = videoRef.current;
    if (video?.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    }
    setStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopTracks();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
        setStreamError("");
      }
    } catch {
      if (facingMode === "environment") {
        setFacingMode("user");
        setCameraNotice({
          variant: "error",
          text: "Não foi possível alternar para essa câmera neste dispositivo.",
        });
      } else {
        setStreamError("Não foi possível acessar a câmera. Verifique as permissões.");
      }
    }
  }, [facingMode, stopTracks]);

  useEffect(() => {
    void startCamera();
    return () => {
      stopTracks();
    };
  }, [startCamera, stopTracks]);

  useEffect(() => {
    setUploadPreviewUrl(null);
  }, [facingMode]);

  // Nova consulta no pai zera faceResults: volta ao vídeo ao vivo no quadro.
  useEffect(() => {
    if (faceResults.length === 0 && !scanning && uploadPreviewUrl) {
      setUploadPreviewUrl(null);
    }
  }, [faceResults, scanning, uploadPreviewUrl]);

  // Draw bounding boxes on overlay (vídeo ou imagem enviada)
  useEffect(() => {
    if (!overlayRef.current) return;
    const overlay = overlayRef.current;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    const imgEl = previewImgRef.current;
    const useStatic =
      uploadPreviewUrl &&
      imgEl?.complete &&
      imgEl.naturalWidth > 0;

    let vw = 640;
    let vh = 480;
    if (useStatic && imgEl) {
      vw = imgEl.naturalWidth;
      vh = imgEl.naturalHeight;
    } else if (videoRef.current) {
      vw = videoRef.current.videoWidth || 640;
      vh = videoRef.current.videoHeight || 480;
    }

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
  }, [faceResults, uploadPreviewUrl, previewLayoutNonce]);

  const handleSelectFrontal = useCallback(() => {
    if (scanning) return;
    setCameraNotice(null);
    setFacingMode("user");
  }, [scanning]);

  const handleSelectTraseira = useCallback(async () => {
    if (scanning) return;
    setCameraNotice(null);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      if (videoInputs.length === 1) {
        setCameraNotice({
          variant: "info",
          text: "Este dispositivo possui apenas uma câmera disponível.",
        });
        return;
      }
      setFacingMode("environment");
    } catch {
      setFacingMode("environment");
    }
  }, [scanning]);

  const dispatchImage = (dataUrl: string) => {
    if (onMultiCapture) {
      onMultiCapture(dataUrl);
    } else {
      onCapture(dataUrl);
    }
  };

  const capture = () => {
    setUploadPreviewUrl(null);
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
    dispatchImage(dataUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    setUploadError("");
    if (!file) return;

    if (!isAllowedImageFile(file)) {
      setUploadError("Formato inválido. Envie uma imagem JPG, JPEG, PNG ou WEBP.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl === "string") {
        setUploadPreviewUrl(dataUrl);
        dispatchImage(dataUrl);
      }
    };
    reader.onerror = () => {
      setUploadError("Não foi possível ler o arquivo. Tente outra imagem.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <fieldset className="w-full max-w-md flex flex-col gap-2 border-0 p-0 m-0">
        <legend className="sr-only">Câmera</legend>
        <p className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground text-center">
          Câmera
        </p>
        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={handleSelectFrontal}
            disabled={scanning}
            aria-pressed={facingMode === "user"}
            className={`flex-1 max-w-[9rem] px-3 py-2 rounded-lg font-heading font-semibold uppercase tracking-wider text-xs transition disabled:opacity-40 disabled:cursor-not-allowed ${
              facingMode === "user"
                ? "bg-primary text-primary-foreground glow-primary"
                : "bg-secondary text-secondary-foreground hover:brightness-110"
            }`}
          >
            Frontal
          </button>
          <button
            type="button"
            onClick={() => void handleSelectTraseira()}
            disabled={scanning}
            aria-pressed={facingMode === "environment"}
            className={`flex-1 max-w-[9rem] px-3 py-2 rounded-lg font-heading font-semibold uppercase tracking-wider text-xs transition disabled:opacity-40 disabled:cursor-not-allowed ${
              facingMode === "environment"
                ? "bg-primary text-primary-foreground glow-primary"
                : "bg-secondary text-secondary-foreground hover:brightness-110"
            }`}
          >
            Traseira
          </button>
        </div>
      </fieldset>

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

        {uploadPreviewUrl && (
          <div className="absolute top-2 left-1/2 z-[15] -translate-x-1/2 rounded-md bg-background/90 px-2 py-1 text-[10px] font-heading uppercase tracking-wider text-primary border border-primary/40">
            Imagem enviada
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full aspect-[4/3] object-cover bg-muted ${
            uploadPreviewUrl ? "invisible absolute inset-0 h-full w-full" : ""
          }`}
        />
        {uploadPreviewUrl && (
          <img
            ref={previewImgRef}
            src={uploadPreviewUrl}
            alt="Imagem selecionada para análise"
            className="relative z-[5] w-full aspect-[4/3] object-cover bg-muted"
            onLoad={() => setPreviewLayoutNonce((n) => n + 1)}
          />
        )}
        {/* Overlay canvas for bounding boxes */}
        <canvas
          ref={overlayRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />
        <canvas ref={canvasRef} className="hidden" />

        {streamError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 p-4">
            <p className="text-destructive text-center text-sm">{streamError}</p>
          </div>
        )}
      </div>

      {cameraNotice && (
        <p
          className={`text-center text-sm max-w-md px-2 ${
            cameraNotice.variant === "error"
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
          role={cameraNotice.variant === "error" ? "alert" : "status"}
        >
          {cameraNotice.text}
        </p>
      )}

      {uploadError && (
        <p className="text-destructive text-center text-sm max-w-md px-2" role="alert">
          {uploadError}
        </p>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={capture}
          disabled={!streaming || scanning}
          className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-heading font-semibold uppercase tracking-wider text-sm hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed glow-primary"
        >
          <Camera className="w-5 h-5" />
          {scanning ? "Analisando..." : "Capturar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setCameraNotice(null);
            void startCamera();
          }}
          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-heading font-semibold uppercase tracking-wider text-sm hover:brightness-110 transition"
          title="Reiniciar câmera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-heading font-semibold uppercase tracking-wider text-sm hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          Enviar imagem
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          aria-label="Enviar imagem do dispositivo"
        />
      </div>
    </div>
  );
}
