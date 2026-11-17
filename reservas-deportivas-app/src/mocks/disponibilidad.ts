import { DiaBloqueado, ReservaFija, Turno } from "@/tipos/turno";

const fechaRelativa = (dias: number): string => {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const reservasParaDiaCompleto = (
  espacioId: string,
  fecha: string
): Turno[] =>
  Array.from({ length: 16 }, (_, indice) => {
    const horaInicio = indice + 8;
    const horaFin = horaInicio + 1;

    return {
      id: `reserva-completa-${espacioId}-${indice}`,
      espacioId,
      fecha,
      inicio: `${String(horaInicio).padStart(2, "0")}:00`,
      fin: `${String(horaFin).padStart(2, "0")}:00`,
      estado: "reservado" as const,
      reservaId: `reserva-completa-${indice}`,
      motivoBloqueo: null,
      precio: 12000,
    };
  });

export const reservasMock: Turno[] = [
  { id: "reserva-mock-1", espacioId: "espacio-02", fecha: fechaRelativa(1), inicio: "10:00", fin: "11:00", estado: "reservado", reservaId: "reserva-1", motivoBloqueo: null, precio: 12000 },
  { id: "reserva-mock-2", espacioId: "espacio-02", fecha: fechaRelativa(2), inicio: "20:00", fin: "22:00", estado: "reservado", reservaId: "reserva-2", motivoBloqueo: null, precio: 24000 },
  ...reservasParaDiaCompleto("espacio-03", fechaRelativa(6)),
];

export const reservasFijasMock: ReservaFija[] = [
  { id: "fija-1", espacioId: "espacio-02", diaSemana: new Date(`${fechaRelativa(3)}T12:00:00`).getDay(), inicio: "18:00", fin: "20:00", vigenteDesde: fechaRelativa(-30), vigenteHasta: null },
];

export const diasBloqueadosMock: DiaBloqueado[] = [
  {id: "bloqueo-1", espacioId: "espacio-02", fecha: fechaRelativa(4), motivo: "Mantenimiento de la superficie" },
  {id: "bloqueo-lluvia", espacioId: "espacio-04", fecha: fechaRelativa(5), motivo: "Suspensión por lluvia",},
];
