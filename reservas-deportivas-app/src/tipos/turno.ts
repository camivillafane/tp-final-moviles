export type EstadoTurno = "libre" | "reservado" | "fijo" | "mantenimiento";

export interface Turno {
  id: string;
  espacioId: string;
  fecha: string;
  inicio: string;
  fin: string;
  estado: EstadoTurno;
  reservaId: string | null;
  motivoBloqueo: string | null;
  precio: number;
}

export interface ReservaFija {
  id: string;
  espacioId: string;
  diaSemana: number;
  inicio: string;
  fin: string;
  vigenteDesde: string;
  vigenteHasta: string | null;
}

export interface DiaBloqueado {
  id: string;
  espacioId: string;
  fecha: string;
  motivo: string;
}

export interface SolicitudReserva {
  espacioId: string;
  fecha: string;
  inicio: string;
  fin: string;
  precio: number;
  cantidadPersonas: number; //AGREGUE ESTO
}
