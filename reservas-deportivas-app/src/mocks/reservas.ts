import type { Reserva } from "../tipos/reserva";
import { sesionMock } from "./sesionUsuario"; 


export const reservasEjemplo: Reserva[] = [
{
    id: "res-001",
    usuarioId: "usr-207",
    espacioId: "espacio-02",
    fecha: "2026-11-10",
    inicio: "10:00",
    fin: "12:00",
    cantidadPersonas: 8,
    precioPorHora: 12000,
    precioTotal: 24000,
    estado: "confirmada",
    qrToken: "token-demo-res-001",
    creadaEn: "2026-11-09T19:00:00",
    canceladaEn: null,
},
{
    id: "res-002",
    usuarioId: "usr-105",
    espacioId: "espacio-03",
    fecha: "2026-11-12",
    inicio: "16:00",
    fin: "17:00",
    cantidadPersonas: 12,
    precioPorHora: 10000,
    precioTotal: 10000,
    estado: "confirmada",
    qrToken: "token-demo-res-002",
    creadaEn: "2026-11-10T10:00:00",
    canceladaEn: null,
},

];

export const obtenerMisReservas = (): Reserva[] => {
  if (sesionMock === null) {
    return [];
  }

  const usuarioId = sesionMock.id;

  return reservasEjemplo.filter(
    (reserva) => reserva.usuarioId === usuarioId
  );
};

console.log("Mis reservas:", obtenerMisReservas()); 