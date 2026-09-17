export type Disciplina =
  | "Futbol 5"
  | "Futbol 11"
  | "Basquet"
  | "Voley"
  | "Tenis"
  | "Padel"
  | "Handball"
  | "Atletismo"
  | "Gimnasia"
  | "Natacion"
  | "Polideportivo";

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface Espacio {
  id: string;
  nombre: string;
  complejo: string;
  descripcion?: string;
  disciplinas: Disciplina[];
  superficie: string;
  iluminacion: boolean;
  capacidad: number;
  precioPorHora: number;
  reglasDeUso: string[];
  fotos: string[];
  videoUrl: string | null; //del video del espacio de unos 20 o 30 seg de largo
  coordenadas: Coordenadas;
  direccion: string;
  destacado: boolean;
  telefonoContacto?: string;
}

export type EstadoCarga = "idle" | "loading" | "success" | "error";

export interface ResultadoEspacios {
  espacios: Espacio[];
  estado: EstadoCarga;
  error: string | null;
}

export interface ResultadoEspacio {
  espacio: Espacio | null;
  estado: EstadoCarga;
  error: string | null;
}
