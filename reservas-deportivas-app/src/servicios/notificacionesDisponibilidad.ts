import { getDisponibilidad } from "@/servicios/disponibilidad";
import { obtenerUsuariosQueMarcaronFavoritoLocal } from "@/servicios/dbServicios";
import {
  programarNotificacionLocal,
  solicitarPermisoNotificaciones,
} from "@/servicios/notificacionesLocales";

interface OpcionesTurnoLiberado {
  espacioId: string;
  fecha: string;
  nombreEspacio?: string;
  inicio?: string | null;
  fin?: string | null;
}

const seSuperponen = (inicioA: string, finA: string, inicioB: string, finB: string) =>
  inicioA < finB && finA > inicioB;

function fechaLegible(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
  }).format(new Date(anio, mes - 1, dia));
}

/**
 * Simula en este dispositivo el aviso a quienes tienen el espacio en favoritos.
 * Solo avisa si, después de la acción, la API/disponibilidad confirma turnos libres.
 */
export async function notificarDisponibilidadEnFavorito(
  opciones: OpcionesTurnoLiberado
): Promise<boolean> {
  const usuariosFavoritos = await obtenerUsuariosQueMarcaronFavoritoLocal(opciones.espacioId);
  if (usuariosFavoritos.length === 0) return false;

  const turnos = await getDisponibilidad(opciones.espacioId, opciones.fecha);
  const turnosLibres = turnos.filter((turno) =>
    turno.estado === "libre" &&
    (!opciones.inicio || !opciones.fin || seSuperponen(
      turno.inicio,
      turno.fin,
      opciones.inicio,
      opciones.fin
    ))
  );
  if (turnosLibres.length === 0) return false;

  // Pide el permiso antes de iniciar la cuenta regresiva de la notificación.
  if (!(await solicitarPermisoNotificaciones())) return false;

  const horarios = turnosLibres.map((turno) => `${turno.inicio}–${turno.fin}`);
  const resumenHorarios = horarios.length === 1
    ? horarios[0]
    : `${horarios.slice(0, 2).join(", ")}${horarios.length > 2 ? " y otros" : ""}`;
  const nombreEspacio = opciones.nombreEspacio ?? "Tu espacio favorito";
  const cuerpo = `Se liberó ${horarios.length === 1 ? "el turno" : "un turno"} ${resumenHorarios} de ${nombreEspacio} para el ${fechaLegible(opciones.fecha)}. Revisá la disponibilidad.`;

  const identificador = await programarNotificacionLocal({
    titulo: "Turno disponible en un favorito",
    cuerpo,
    fecha: new Date(Date.now() + 5_000),
    datos: {
      origen: "favorito-disponible",
      espacioId: opciones.espacioId,
      fecha: opciones.fecha,
      horarios,
    },
  });

  return Boolean(identificador);
}
