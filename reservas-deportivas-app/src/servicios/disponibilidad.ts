import { diasBloqueadosMock, reservasFijasMock, reservasMock } from "@/mocks/disponibilidad";
import { espaciosMock } from "@/mocks/espacios";
import { DiaBloqueado, ReservaFija, TurnoSeleccionado, Turno } from "@/tipos/turno";
import { SIMULAR_ERROR_RED, DEMORA_MOCK_MS } from "./config";
import { obtenerTodasLasReservasLocales } from "@/servicios/dbServicios";


const HORA_APERTURA = 8 * 60;
const HORA_CIERRE = 24 * 60;
const DURACION_BLOQUE_MINUTOS = 60;

const fechaLocal = (fecha: Date): string => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const minutos = (hora: string): number => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

const horaDesdeMinutos = (total: number): string => {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const seSuperponen = (inicioA: number, finA: number, inicioB: number, finB: number) =>
  inicioA < finB && inicioB < finA;

const fijaVigente = (fija: ReservaFija, fecha: string, diaSemana: number) =>
  fija.diaSemana === diaSemana && fecha >= fija.vigenteDesde && (!fija.vigenteHasta || fecha <= fija.vigenteHasta);

export async function getDisponibilidad(espacioId: string, fecha: string): Promise<Turno[]> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        if (SIMULAR_ERROR_RED) {
          reject(new Error("No se pudo cargar la disponibilidad."));
          return;
        }

        const espacio = espaciosMock.find((item) => item.id === espacioId && item.activo);
        if (!espacio) {
          reject(new Error("El espacio no existe o no está disponible."));
          return;
        }

        const fechaSeleccionada = new Date(`${fecha}T12:00:00`);
        if (Number.isNaN(fechaSeleccionada.getTime()) || fechaLocal(fechaSeleccionada) !== fecha) {
          reject(new Error("La fecha seleccionada no es válida."));
          return;
        }

        const reservasLocales = await obtenerTodasLasReservasLocales();
        const reservasMockDelDia = reservasMock.filter(
          (item) => item.espacioId === espacioId && item.fecha === fecha
        );
        const reservasLocalesDelDia: Turno[] = reservasLocales
          .filter(
            (reserva) =>
              reserva.estado === "confirmada" &&
              reserva.espacioId === espacioId &&
              reserva.fecha === fecha
          )
          .map((reserva) => ({
            id: `reserva-local-${reserva.id}`,
            espacioId: reserva.espacioId,
            fecha: reserva.fecha,
            inicio: reserva.inicio,
            fin: reserva.fin,
            estado: "reservado" as const,
            reservaId: reserva.id,
            motivoBloqueo: null,
            precio: reserva.precioPorHora,
          }));
        const reservas = [...reservasMockDelDia, ...reservasLocalesDelDia];

        const bloqueos = diasBloqueadosMock.filter(
          (item: DiaBloqueado) => item.espacioId === espacioId && item.fecha === fecha
        );
        const fijas = reservasFijasMock.filter(
          (item: ReservaFija) =>
            item.espacioId === espacioId &&
            fijaVigente(item, fecha, fechaSeleccionada.getDay())
        );
        const resultado: Turno[] = [];

        for (let inicio = HORA_APERTURA; inicio < HORA_CIERRE; inicio += DURACION_BLOQUE_MINUTOS) {
          const fin = inicio + DURACION_BLOQUE_MINUTOS;
          const inicioHora = horaDesdeMinutos(inicio);
          const finHora = horaDesdeMinutos(fin);
          const reserva = reservas.find((item) =>
            seSuperponen(inicio, fin, minutos(item.inicio), minutos(item.fin))
          );
          const fija = fijas.find((item) =>
            seSuperponen(inicio, fin, minutos(item.inicio), minutos(item.fin))
          );
          const bloqueado = bloqueos[0];
          const estado = bloqueado ? "mantenimiento" : reserva ? "reservado" : fija ? "fijo" : "libre";

          resultado.push({
            id: `${espacioId}-${fecha}-${inicioHora}`,
            espacioId,
            fecha,
            inicio: inicioHora,
            fin: finHora,
            estado,
            reservaId: reserva?.reservaId ?? null,
            motivoBloqueo: bloqueado?.motivo ?? null,
            precio: espacio.precioPorHora,
          });
        }

        resolve(resultado);
      } catch (error) {
        reject(error);
      }
    }, DEMORA_MOCK_MS);
  });
}

export function prepararSolicitudReserva(turno: Turno): TurnoSeleccionado | null {
  if (turno.estado !== "libre") return null;
  const ahora = new Date();
  const hoy = fechaLocal(ahora);
  if (turno.fecha < hoy || (turno.fecha === hoy && minutos(turno.inicio) <= ahora.getHours() * 60 + ahora.getMinutes())) return null;
  return { espacioId: turno.espacioId, fecha: turno.fecha, inicio: turno.inicio, fin: turno.fin, precio: turno.precio };
}

export function getProximosSieteDias(desde = new Date()): string[] {
  return Array.from({ length: 7 }, (_, indice) => {
    const fecha = new Date(desde);
    fecha.setDate(desde.getDate() + indice);
    return fechaLocal(fecha);
  });
}



