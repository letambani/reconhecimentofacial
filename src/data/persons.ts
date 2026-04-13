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

export interface Person {
  id: string;
  name: string;
  imageSrc: string;
  notes?: string;
  registeredAt: string;
  additionalPhotos?: string[];
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
