import { diasBloqueadosMock, reservasFijasMock, reservasMock } from "@/mocks/disponibilidad";
import { espaciosMock } from "@/mocks/espacios";
import { obtenerTodasLasReservasLocales } from "@/servicios/dbServicios";
import { getLista } from "@/servicios/cliente";
import { obtenerIdEspacioApi } from "@/servicios/mapeoEspacios";
import { DiaBloqueado, ReservaFija, TurnoSeleccionado, Turno } from "@/tipos/turno";
import { SIMULAR_ERROR_RED, DEMORA_MOCK_MS, USAR_MOCKS } from "./config";


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
  // const espacio = espaciosMock.find((item) => item.id === espacioId && item.activo);
  // if (!espacio) throw new Error("El espacio no existe o no esta disponible.");

  const fechaSeleccionada = new Date(`${fecha}T12:00:00`);
  if (Number.isNaN(fechaSeleccionada.getTime()) || fechaLocal(fechaSeleccionada) !== fecha) {
    throw new Error("La fecha seleccionada no es valida.");
  }

  // const espacioApiId = obtenerIdEspacioApi(espacioId);
  const espacioApiId =
  obtenerIdEspacioApi(espacioId) ?? (!USAR_MOCKS ? espacioId : null);
  if (espacioApiId) {
    const [respuesta, reservasLocales] = await Promise.all([
      getLista<Turno>(`/espacios/${espacioApiId}/turnos`, { fecha, porPagina: 100 }),
      obtenerTodasLasReservasLocales(),
    ]);
    const turnos = respuesta.datos.map((turno) => ({ ...turno, espacioId }));

    for (const reservaLocal of reservasLocales) {
      if (
        reservaLocal.estado !== "confirmada" ||
        reservaLocal.espacioId !== espacioId ||
        reservaLocal.fecha !== fecha
      ) {
        continue;
      }

      const indiceTurno = turnos.findIndex(
        (turno) => turno.inicio === reservaLocal.inicio && turno.fin === reservaLocal.fin
      );
      if (indiceTurno === -1) continue;

      turnos[indiceTurno] = {
        ...turnos[indiceTurno],
        estado: "reservado",
        reservaId: reservaLocal.id,
        motivoBloqueo: null,
      };
    }

    return turnos;
  }

  const espacio = espaciosMock.find(
  (item) => item.id === espacioId && item.activo
);

  if (!espacio) {
    throw new Error("El espacio no existe o no está disponible.");
  }

  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
      const espacio = espaciosMock.find((item) => item.id === espacioId && item.activo);
      if (!espacio) {
        reject(new Error("El espacio no existe o no esta disponible."));
        return;
      }
      const fechaSeleccionada = new Date(`${fecha}T12:00:00`);
      if (Number.isNaN(fechaSeleccionada.getTime()) || fechaLocal(fechaSeleccionada) !== fecha) {
        reject(new Error("La fecha seleccionada no es valida."));
        return;
      }

      const bloqueos = diasBloqueadosMock.filter((item: DiaBloqueado) => item.espacioId === espacioId && item.fecha === fecha);
      const reservasLocales = await obtenerTodasLasReservasLocales();
      const reservasLocalesPorId = new Map(reservasLocales.map((reserva) => [reserva.id, reserva]));
      const reservasEnMemoria = reservasMock.filter((turno) => {
        if (!turno.reservaId) return true;
        const reservaLocal = reservasLocalesPorId.get(turno.reservaId);
        return !reservaLocal || reservaLocal.estado === "confirmada";
      });
      const reservasDelEspacio = reservasEnMemoria.filter(
        (item) => item.espacioId === espacioId && item.fecha === fecha
      );
      const idsEnMemoria = new Set(reservasDelEspacio.map((turno) => turno.reservaId));
      const reservasLocalesActivas: Turno[] = reservasLocales
        .filter(
          (reserva) =>
            reserva.estado === "confirmada" &&
            reserva.espacioId === espacioId &&
            reserva.fecha === fecha &&
            !idsEnMemoria.has(reserva.id)
        )
        .map((reserva) => ({
          id: `turno-${reserva.id}`,
          espacioId: reserva.espacioId,
          fecha: reserva.fecha,
          inicio: reserva.inicio,
          fin: reserva.fin,
          estado: "reservado" as const,
          reservaId: reserva.id,
          motivoBloqueo: null,
          precio: reserva.precioPorHora,
        }));
      const reservas = [...reservasDelEspacio, ...reservasLocalesActivas];
      const fijas = reservasFijasMock.filter((item: ReservaFija) => item.espacioId === espacioId && fijaVigente(item, fecha, fechaSeleccionada.getDay()));
      const ahora = new Date();
      const hoy = fechaLocal(ahora);
      const resultado: Turno[] = [];

      for (let inicio = HORA_APERTURA; inicio < HORA_CIERRE; inicio += DURACION_BLOQUE_MINUTOS) {
        const fin = inicio + DURACION_BLOQUE_MINUTOS;
        const inicioHora = horaDesdeMinutos(inicio);
        const finHora = horaDesdeMinutos(fin);
        const reserva = reservas.find((item) => seSuperponen(inicio, fin, minutos(item.inicio), minutos(item.fin)));
        const fija = fijas.find((item) => seSuperponen(inicio, fin, minutos(item.inicio), minutos(item.fin)));
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
    }, 350);
  });
}

export function prepararSolicitudReserva(turno: Turno): TurnoSeleccionado | null {
  if (turno.estado !== "libre") return null;
  const ahora = new Date();
  const hoy = fechaLocal(ahora);
  if (turno.fecha < hoy || (turno.fecha === hoy && minutos(turno.inicio) <= ahora.getHours() * 60 + ahora.getMinutes())) return null;
  return {
    turnoId: turno.id,
    espacioId: turno.espacioId,
    fecha: turno.fecha,
    inicio: turno.inicio,
    fin: turno.fin,
    precio: turno.precio,
  };
}

export function getProximosSieteDias(desde = new Date()): string[] {
  return Array.from({ length: 7 }, (_, indice) => {
    const fecha = new Date(desde);
    fecha.setDate(desde.getDate() + indice);
    return fechaLocal(fecha);
  });
}



