import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RotateCcw, Upload } from "lucide-react";
import { Person } from "@/data/persons";
import { distanceToSimilarityPercent } from "@/lib/faceDescriptorSimilarity";

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
        ? `${result.person!.name} (${distanceToSimilarityPercent(result.distance)}%)`
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
    <div className="flex w-full min-w-0 max-w-full flex-col items-center gap-3 sm:gap-4">
      <fieldset className="m-0 flex w-full min-w-0 max-w-md flex-col gap-2 border-0 p-0">
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

      {/* Proporção 4:3; no mobile limita largura por altura (svh) para não ocupar a tela inteira. */}
      <div className="relative mx-auto aspect-[4/3] w-full min-w-0 max-w-[min(100%,28rem,calc(52svh*4/3))] overflow-hidden rounded-lg border-2 border-primary/50 glow-primary sm:max-w-md">
        {scanning && (
          <div className="absolute inset-0 z-10 pointer-events-none">
            <div className="absolute inset-x-0 h-1 bg-primary/60 animate-scan" />
          </div>
        )}
        {/* Corner brackets */}
        <div className="absolute top-2 left-2 z-10 h-6 w-6 border-l-2 border-t-2 border-primary" />
        <div className="absolute top-2 right-2 z-10 h-6 w-6 border-r-2 border-t-2 border-primary" />
        <div className="absolute bottom-2 left-2 z-10 h-6 w-6 border-b-2 border-l-2 border-primary" />
        <div className="absolute bottom-2 right-2 z-10 h-6 w-6 border-b-2 border-r-2 border-primary" />

        {uploadPreviewUrl && (
          <div className="absolute left-1/2 top-2 z-[15] -translate-x-1/2 rounded-md border border-primary/40 bg-background/90 px-2 py-1 text-[10px] font-heading uppercase tracking-wider text-primary">
            Imagem enviada
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 z-0 h-full w-full bg-muted object-cover ${
            uploadPreviewUrl ? "invisible" : ""
          }`}
        />
        {uploadPreviewUrl && (
          <img
            ref={previewImgRef}
            src={uploadPreviewUrl}
            alt="Imagem selecionada para análise"
            className="absolute inset-0 z-[5] h-full w-full bg-muted object-cover"
            onLoad={() => setPreviewLayoutNonce((n) => n + 1)}
          />
        )}
        {/* Overlay canvas for bounding boxes */}
        <canvas
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
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

      <div className="flex w-full min-w-0 max-w-md flex-wrap justify-center gap-2 sm:gap-3">
        <button
          onClick={capture}
          disabled={!streaming || scanning}
          className="flex flex-1 min-w-[8.5rem] items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 font-heading text-sm font-semibold uppercase tracking-wider text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 glow-primary sm:min-w-0 sm:flex-none sm:px-6 sm:py-3"
        >
          <Camera className="h-5 w-5 shrink-0" />
          {scanning ? "Analisando..." : "Capturar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setCameraNotice(null);
            void startCamera();
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2.5 font-heading text-sm font-semibold uppercase tracking-wider text-secondary-foreground transition hover:brightness-110 sm:px-4 sm:py-3"
          title="Reiniciar câmera"
        >
          <RotateCcw className="h-4 w-4 shrink-0" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
          className="flex min-w-0 flex-1 basis-full items-center justify-center gap-2 rounded-lg bg-secondary px-3 py-2.5 font-heading text-sm font-semibold uppercase tracking-wider text-secondary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:basis-auto sm:flex-none sm:px-4 sm:py-3"
        >
          <Upload className="h-4 w-4 shrink-0" />
          <span className="truncate">Enviar imagem</span>
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
