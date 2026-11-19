export type TipoMedio = "imagen" | "video";

export interface MedioEspacio {
  id: string;
  espacioId: string;
  tipo: TipoMedio;
  url: string;
  rutaLocal: string | null;
  nombre: string;
  creadoEn: string;
}
