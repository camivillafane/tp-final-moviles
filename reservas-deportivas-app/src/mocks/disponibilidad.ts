import { DiaBloqueado, ReservaFija, Turno } from "@/tipos/turno";

// Fechas relativas para que los ejemplos sigan apareciendo en los próximos siete días.
const fechaRelativa = (dias: number): string => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

export const reservasMock: Turno[] = [
  { id: "reserva-mock-1", espacioId: "espacio-02", fecha: fechaRelativa(1), inicio: "10:00", fin: "11:00", estado: "reservado", reservaId: "reserva-1", motivoBloqueo: null, precio: 12000 },
  { id: "reserva-mock-2", espacioId: "espacio-02", fecha: fechaRelativa(2), inicio: "20:00", fin: "22:00", estado: "reservado", reservaId: "reserva-2", motivoBloqueo: null, precio: 24000 },
];

export const reservasFijasMock: ReservaFija[] = [
  { id: "fija-1", espacioId: "espacio-02", diaSemana: new Date(`${fechaRelativa(3)}T12:00:00`).getDay(), inicio: "18:00", fin: "20:00", vigenteDesde: fechaRelativa(-30), vigenteHasta: null },
];

export const diasBloqueadosMock: DiaBloqueado[] = [
  { id: "bloqueo-1", espacioId: "espacio-02", fecha: fechaRelativa(4), motivo: "Mantenimiento de la superficie" },
];
