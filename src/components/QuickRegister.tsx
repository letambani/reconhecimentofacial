import { useState } from "react";
import { UserPlus, ArrowLeft } from "lucide-react";

interface QuickRegisterProps {
  capturedImage: string;
  onRegister: (name: string, notes: string) => void;
  onCancel: () => void;
}

export default function QuickRegister({
  capturedImage,
  onRegister,
  onCancel,
}: QuickRegisterProps) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onRegister(name.trim(), notes.trim());
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-lg border-2 border-accent/50 bg-card p-6 glow-accent">
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="w-7 h-7 text-accent" />
          <h2 className="text-xl font-heading text-foreground">
            Cadastro Rápido
          </h2>
        </div>

        <img
          src={capturedImage}
          alt="Captura"
          className="w-28 h-28 rounded-lg object-cover border border-border mx-auto mb-4"
        />

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
          <div>
            <label className="block text-xs font-heading uppercase tracking-wider text-muted-foreground mb-1">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-muted text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
              rows={2}
              placeholder="Observações opcionais..."
            />
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
