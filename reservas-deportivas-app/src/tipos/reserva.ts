export type EstadoReserva = "confirmada" | "cancelada" | "cumplida" | "ausente";

export interface Reserva {
  id: string;
  usuarioId: string;
  espacioId: string;
  fecha: string;
  inicio: string;
  fin: string;
  cantidadPersonas: number;
  precioPorHora: number;
  precioTotal: number;
  estado: EstadoReserva;
  qrToken: string;
  creadaEn: string;
  canceladaEn: string | null;
  /** Límite ISO 8601 devuelto por la API para cancelar la reserva. */
  cancelableHasta: string | null;
}
