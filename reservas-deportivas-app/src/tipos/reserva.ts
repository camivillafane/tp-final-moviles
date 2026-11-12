export type EstadoReserva = "confirmada" | "cancelada";

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
}
