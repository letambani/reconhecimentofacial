import { Person } from "@/data/persons";
import { Database, User } from "lucide-react";

interface PersonsDatabaseProps {
  persons: Person[];
}

export default function PersonsDatabase({ persons }: PersonsDatabaseProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-heading text-foreground uppercase tracking-wider">
            Banco de Dados ({persons.length})
          </h3>
        </div>
        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
          {persons.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-1 group">
              <div className="relative w-12 h-12 rounded-md overflow-hidden border border-border group-hover:border-primary/50 transition">
                <img
                  src={p.imageSrc}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] text-muted-foreground text-center truncate w-full">
                {p.name.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
