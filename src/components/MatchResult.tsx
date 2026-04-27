import { Person } from "@/data/persons";
import { CheckCircle2, XCircle, UserPlus } from "lucide-react";
import { distanceToSimilarityPercent } from "@/lib/faceDescriptorSimilarity";

interface MatchResultProps {
  person: Person | null;
  distance: number | null;
  capturedImage: string | null;
  onRegister: () => void;
  onReset: () => void;
}

export default function MatchResult({
  person,
  distance,
  capturedImage,
  onRegister,
  onReset,
}: MatchResultProps) {
  const matched = person !== null;
  const similarityPercent = distance !== null ? distanceToSimilarityPercent(distance) : 0;

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`rounded-lg border-2 p-6 ${
          matched
            ? "border-success/50 glow-success"
            : "border-destructive/50 glow-destructive"
        } bg-card`}
      >
        {/* Status header */}
        <div className="flex items-center gap-3 mb-4">
          {matched ? (
            <CheckCircle2 className="w-8 h-8 text-success" />
          ) : (
            <XCircle className="w-8 h-8 text-destructive" />
          )}
          <h2 className="text-xl font-heading">
            {matched ? "Identificado" : "Não Identificado"}
          </h2>
        </div>

        {matched && person ? (
          <div className="flex gap-4">
            <img
              src={person.imageSrc}
              alt={person.name}
              className="w-24 h-24 rounded-lg object-cover border border-border"
            />
            <div className="flex-1 space-y-1">
              <p className="text-lg font-heading text-foreground">{person.name}</p>
              <p className="text-xs text-muted-foreground">
                ID: {person.id}
              </p>
              <p className="text-xs text-muted-foreground">
                Registrado: {person.registeredAt}
              </p>
              <div
                className="mt-2 flex items-center gap-2"
                title="Indicador derivado da distância euclidiana no limiar de 0,6; não é probabilidade calibrada."
              >
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{ width: `${similarityPercent}%` }}
                  />
                </div>
                <span className="text-xs font-heading text-success">
                  {similarityPercent}%
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Compatibilidade estimada (distância entre descritores, limiar 0,6)
              </p>
              {person.notes && (
                <p className="text-xs text-muted-foreground mt-1">
                  Obs: {person.notes}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captura"
                className="w-24 h-24 rounded-lg object-cover border border-border mx-auto"
              />
            )}
            <p className="text-sm text-muted-foreground text-center">
              Nenhuma correspondência encontrada no banco de dados.
            </p>
            <button
              onClick={onRegister}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-accent text-accent-foreground font-heading font-semibold uppercase tracking-wider text-sm hover:brightness-110 transition glow-accent"
            >
              <UserPlus className="w-5 h-5" />
              Cadastro Rápido
            </button>
          </div>
        )}

        <button
          onClick={onReset}
          className="mt-4 w-full px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-heading font-semibold uppercase tracking-wider text-xs hover:brightness-110 transition"
        >
          Nova Consulta
        </button>
      </div>
    </div>
  );
}
