import { useRef, useState } from "react";
import { UserPlus, ArrowLeft, Upload, X, Plus } from "lucide-react";

import {
  MARK_TYPE_OPTIONS,
  MARK_LOCATION_OPTIONS,
  MarkType,
  MarkLocation,
  formatBodyMark,
} from "@/data/persons";

export interface BodyMarkInput {
  type: MarkType;
  location?: MarkLocation;
  observation?: string;
}

export interface RegisterPayload {
  name: string;
  notes: string;
  bodyMarks: BodyMarkInput[];
  additionalPhotos: string[];
}

interface QuickRegisterProps {
  capturedImage: string;
  onRegister: (payload: RegisterPayload) => void;
  onCancel: () => void;
}

const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isAllowedImageFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime && ACCEPTED_MIME_TYPES.has(mime)) return true;
  const name = file.name.toLowerCase();
  return /\.(jpe?g|png|webp)$/.test(name);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Formato inválido"));
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

const emptyMarkDraft = () => ({
  type: "" as MarkType | "",
  location: "" as MarkLocation | "",
  observation: "",
});

export default function QuickRegister({
  capturedImage,
  onRegister,
  onCancel,
}: QuickRegisterProps) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [bodyMarks, setBodyMarks] = useState<BodyMarkInput[]>([]);
  const [markDraft, setMarkDraft] = useState(emptyMarkDraft);
  const [markError, setMarkError] = useState("");
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildMarkFromDraft = (): BodyMarkInput | null => {
    if (!markDraft.type) return null;
    return {
      type: markDraft.type,
      location: markDraft.location || undefined,
      observation: markDraft.observation.trim() || undefined,
    };
  };

  const addMark = () => {
    const mark = buildMarkFromDraft();
    if (!mark) {
      setMarkError("Selecione o tipo da marca antes de adicionar.");
      return;
    }
    setMarkError("");
    setBodyMarks((prev) => [...prev, mark]);
    setMarkDraft(emptyMarkDraft());
  };

  const removeMark = (index: number) => {
    setBodyMarks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const pendingMark = buildMarkFromDraft();
    const allMarks = pendingMark ? [...bodyMarks, pendingMark] : bodyMarks;

    onRegister({
      name: name.trim(),
      notes: notes.trim(),
      bodyMarks: allMarks,
      additionalPhotos,
    });
  };

  const handleAdditionalPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    e.target.value = "";
    setUploadError("");
    if (!files?.length) return;

    const validFiles = Array.from(files).filter(isAllowedImageFile);
    if (validFiles.length !== files.length) {
      setUploadError("Alguns arquivos foram ignorados. Use JPG, PNG ou WEBP.");
    }

    try {
      const dataUrls = await Promise.all(validFiles.map(readFileAsDataUrl));
      setAdditionalPhotos((prev) => [...prev, ...dataUrls]);
    } catch {
      setUploadError("Não foi possível ler uma ou mais imagens.");
    }
  };

  const removePhoto = (index: number) => {
    setAdditionalPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-lg border-2 border-accent/50 bg-card p-6 glow-accent">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="w-7 h-7 text-accent" />
          <h2 className="text-xl font-heading text-foreground">Cadastro Rápido</h2>
        </div>

        <div className="mb-4">
          <p className="text-[10px] font-heading uppercase tracking-wider text-muted-foreground mb-2 text-center">
            Foto principal (captura)
          </p>
          <img
            src={capturedImage}
            alt="Captura principal"
            className="w-28 h-28 rounded-lg object-cover border border-border mx-auto"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-muted-foreground mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-muted text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              placeholder="Digite o nome..."
              autoFocus
            />
          </div>

          <fieldset className="space-y-3 rounded-md border border-border/60 p-3">
            <legend className="px-1 text-xs font-heading uppercase tracking-wider text-muted-foreground">
              Marcas corporais (opcional)
            </legend>

            {bodyMarks.length > 0 && (
              <ul className="space-y-2">
                {bodyMarks.map((mark, index) => (
                  <li
                    key={`${mark.type}-${mark.location ?? "sem-local"}-${index}`}
                    className="flex items-start justify-between gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2"
                  >
                    <span className="text-xs text-foreground">{formatBodyMark({ ...mark, id: String(index) })}</span>
                    <button
                      type="button"
                      onClick={() => removeMark(index)}
                      className="shrink-0 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                      aria-label={`Remover marca ${index + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-muted-foreground mb-1">
                Tipo
              </label>
              <select
                value={markDraft.type}
                onChange={(e) => {
                  const value = e.target.value as MarkType | "";
                  setMarkDraft((prev) => ({
                    ...prev,
                    type: value,
                    location: value ? prev.location : "",
                    observation: value ? prev.observation : "",
                  }));
                  setMarkError("");
                }}
                className="w-full px-3 py-2 rounded-md bg-muted text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              >
                <option value="">Selecione...</option>
                {MARK_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-muted-foreground mb-1">
                Local
              </label>
              <select
                value={markDraft.location}
                onChange={(e) =>
                  setMarkDraft((prev) => ({
                    ...prev,
                    location: e.target.value as MarkLocation | "",
                  }))
                }
                disabled={!markDraft.type}
                className="w-full px-3 py-2 rounded-md bg-muted text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Selecione...</option>
                {MARK_LOCATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-heading uppercase tracking-wider text-muted-foreground mb-1">
                Observação livre
              </label>
              <textarea
                value={markDraft.observation}
                onChange={(e) =>
                  setMarkDraft((prev) => ({ ...prev, observation: e.target.value }))
                }
                disabled={!markDraft.type}
                className="w-full px-3 py-2 rounded-md bg-muted text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                rows={2}
                placeholder="Descreva detalhes da tatuagem ou cicatriz..."
              />
            </div>

            <button
              type="button"
              onClick={addMark}
              disabled={!markDraft.type}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/50 px-3 py-2 text-xs font-heading uppercase tracking-wider text-muted-foreground transition hover:border-accent/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Adicionar marca
            </button>
            {markError && (
              <p className="text-xs text-destructive" role="alert">
                {markError}
              </p>
            )}
          </fieldset>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-muted-foreground mb-1">
              Observações gerais
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-muted text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
              rows={2}
              placeholder="Outras informações sobre a pessoa..."
            />
          </div>

          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-muted-foreground mb-1">
              Fotos Adicionais
            </label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Inclua outros ângulos ou registros para melhorar o reconhecimento.
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/50 px-3 py-2 text-xs font-heading uppercase tracking-wider text-muted-foreground transition hover:border-accent/50 hover:text-foreground"
            >
              <Upload className="h-4 w-4" />
              Adicionar fotos
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              multiple
              onChange={(e) => void handleAdditionalPhotos(e)}
              aria-label="Adicionar fotos extras"
            />
            {uploadError && (
              <p className="mt-1 text-xs text-destructive" role="alert">
                {uploadError}
              </p>
            )}
            {additionalPhotos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {additionalPhotos.map((photo, index) => (
                  <div key={`${index}-${photo.slice(0, 24)}`} className="relative">
                    <img
                      src={photo}
                      alt={`Foto adicional ${index + 1}`}
                      className="h-16 w-16 rounded-md border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                      aria-label={`Remover foto adicional ${index + 1}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-heading font-semibold uppercase tracking-wider text-xs hover:brightness-110 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-heading font-semibold uppercase tracking-wider text-xs hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-4 h-4" />
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
