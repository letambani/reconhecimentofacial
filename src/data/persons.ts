import henriqueImg from "@/assets/persons/Henrique.jpeg";
import isabellaImg from "@/assets/persons/Isabella.jpeg";
import issagaImg from "@/assets/persons/Issaga.jpeg";
import leandroImg from "@/assets/persons/Leandro.jpeg";
import leonardoImg from "@/assets/persons/Leonardo.jpeg";
import leticiaImg from "@/assets/persons/Leticia.jpeg";
import lucianoImg from "@/assets/persons/Luciano.jpeg";
import marceloImg from "@/assets/persons/Marcelo.jpeg";
import mariaEduardaImg from "@/assets/persons/Maria_Eduarda.jpeg";
import rithielyImg from "@/assets/persons/Rithiely.jpeg";
import carlosAugustoBohnImg from "@/assets/persons/Carlos_Augusto_Bohn.png";
import rodrigoDelduqueImg from "@/assets/persons/Rodrigo_Delduque.png";

export type MarkType = "tatuagem" | "cicatriz";

export type MarkLocation = "braco" | "perna" | "costas" | "rosto" | "maos";

export const MARK_TYPE_OPTIONS: { value: MarkType; label: string }[] = [
  { value: "tatuagem", label: "Tatuagem" },
  { value: "cicatriz", label: "Cicatriz" },
];

export const MARK_LOCATION_OPTIONS: { value: MarkLocation; label: string }[] = [
  { value: "braco", label: "Braço" },
  { value: "perna", label: "Perna" },
  { value: "costas", label: "Costas" },
  { value: "rosto", label: "Rosto" },
  { value: "maos", label: "Mãos" },
];

export interface BodyMark {
  id: string;
  type: MarkType;
  location?: MarkLocation;
  observation?: string;
}

export interface Person {
  id: string;
  name: string;
  imageSrc: string;
  notes?: string;
  bodyMarks?: BodyMark[];
  registeredAt: string;
  additionalPhotos?: string[];
}

/** Resumo legível de uma marca corporal. */
export function formatBodyMark(mark: BodyMark): string {
  const parts: string[] = [];
  const typeLabel = MARK_TYPE_OPTIONS.find((o) => o.value === mark.type)?.label;
  if (typeLabel) parts.push(typeLabel);
  if (mark.location) {
    const locationLabel = MARK_LOCATION_OPTIONS.find((o) => o.value === mark.location)?.label;
    if (locationLabel) parts.push(locationLabel);
  }
  if (mark.observation?.trim()) {
    parts.push(mark.observation.trim());
  }
  return parts.join(" — ");
}

/** Todas as marcas formatadas de uma pessoa. */
export function formatPersonMarks(person: Person): string[] {
  return (person.bodyMarks ?? []).map(formatBodyMark).filter(Boolean);
}

/** Todas as fotos de referência de uma pessoa (principal + adicionais). */
export function getPersonPhotoSources(person: Person): string[] {
  return [person.imageSrc, ...(person.additionalPhotos ?? [])];
}

export const initialPersons: Person[] = [
  { id: "1", name: "Henrique", imageSrc: henriqueImg, registeredAt: "2025-01-15", notes: "" },
  { id: "2", name: "Isabella", imageSrc: isabellaImg, registeredAt: "2025-01-15", notes: "" },
  { id: "3", name: "Issaga", imageSrc: issagaImg, registeredAt: "2025-01-15", notes: "" },
  { id: "4", name: "Leandro", imageSrc: leandroImg, registeredAt: "2025-01-15", notes: "" },
  { id: "5", name: "Leonardo", imageSrc: leonardoImg, registeredAt: "2025-01-15", notes: "" },
  { id: "6", name: "Letícia", imageSrc: leticiaImg, registeredAt: "2025-01-15", notes: "" },
  { id: "7", name: "Luciano", imageSrc: lucianoImg, registeredAt: "2025-01-15", notes: "" },
  { id: "8", name: "Marcelo", imageSrc: marceloImg, registeredAt: "2025-01-15", notes: "" },
  { id: "9", name: "Maria Eduarda", imageSrc: mariaEduardaImg, registeredAt: "2025-01-15", notes: "" },
  { id: "10", name: "Rithiély", imageSrc: rithielyImg, registeredAt: "2025-01-15", notes: "" },
  {
    id: "11",
    name: "Carlos Augusto Bohn",
    imageSrc: carlosAugustoBohnImg,
    registeredAt: "2026-04-13",
    notes: "",
  },
  {
    id: "12",
    name: "Rodrigo Delduque",
    imageSrc: rodrigoDelduqueImg,
    registeredAt: "2026-04-13",
    notes: "",
  },
];
