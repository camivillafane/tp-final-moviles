export type EstadoTurno = "libre" | "reservado" | "fijo" | "mantenimiento";

export interface Turno {
  id: string;
  espacioId: string;
  fecha: string; //"aaaa-mm-dd"
  inicio: string; //"hh:mm"
  fin: string; //"hh:mm"
  estado: EstadoTurno;
  reservaId: string | null;
  motivoBloqueo: string | null;
  precio: number;
}