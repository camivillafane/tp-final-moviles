import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import type { Reserva } from "@/tipos/reserva";

export const CANAL_NOTIFICACIONES_RESERVAS = "reservas-deportivas";

function seEjecutaEnExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

let canalAndroidConfigurado = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function configurarCanalAndroid(): Promise<boolean> {
  if (Platform.OS !== "android" || seEjecutaEnExpoGo()) return false;

  try {
    await Notifications.setNotificationChannelAsync(CANAL_NOTIFICACIONES_RESERVAS, {
      name: "Reservas deportivas",
      description: "Recordatorios y novedades de tus reservas.",
      importance: AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2E7D32",
      sound: "default",
    });
    return true;
  } catch (error) {
    console.warn("No se pudo configurar el canal propio; se usará el canal de respaldo.", error);
    return false;
  }
}

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  canalAndroidConfigurado = await configurarCanalAndroid();

  const permisosActuales = await Notifications.getPermissionsAsync();
  if (permisosActuales.granted) return true;

  const permisosSolicitados = await Notifications.requestPermissionsAsync();
  return permisosSolicitados.granted;
}

export interface NotificacionLocalProgramada {
  titulo: string;
  cuerpo: string;
  fecha: Date;
  datos?: Record<string, unknown>;
}

export async function programarNotificacionLocal(
  notificacion: NotificacionLocalProgramada
): Promise<string | null> {
  if (!(notificacion.fecha instanceof Date) || Number.isNaN(notificacion.fecha.getTime())) {
    throw new Error("La fecha de la notificación no es válida.");
  }
  if (notificacion.fecha.getTime() <= Date.now()) {
    throw new Error("La notificación debe programarse para una fecha futura.");
  }

  const permisoConcedido = await solicitarPermisoNotificaciones();
  if (!permisoConcedido) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: notificacion.titulo,
      body: notificacion.cuerpo,
      data: notificacion.datos,
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notificacion.fecha,
      ...(Platform.OS === "android" && canalAndroidConfigurado
        ? { channelId: CANAL_NOTIFICACIONES_RESERVAS }
        : {}),
    },
  });
}

export async function cancelarNotificacionLocal(
  identificador: string | null | undefined
): Promise<void> {
  if (!identificador) return;
  await Notifications.cancelScheduledNotificationAsync(identificador);
}

const ANTICIPACION_RECORDATORIO_MS = 2 * 60 * 60 * 1000;

export async function programarRecordatorioReserva(
  reserva: Pick<Reserva, "id" | "fecha" | "inicio">,
  nombreEspacio: string,
  opciones?: { anticipacionMs?: number }
): Promise<string | null> {
  const inicio = new Date(`${reserva.fecha}T${reserva.inicio}:00`);
  if (Number.isNaN(inicio.getTime())) {
    throw new Error("La fecha y hora de la reserva no son válidas.");
  }

  const fechaRecordatorio = new Date(
    inicio.getTime() - (opciones?.anticipacionMs ?? ANTICIPACION_RECORDATORIO_MS)
  );
  if (fechaRecordatorio.getTime() <= Date.now()) return null;

  await cancelarRecordatorioReserva(reserva.id);
  const fechaTexto = inicio.toLocaleDateString("es-AR");
  return programarNotificacionLocal({
    titulo: "Recordatorio de reserva",
    cuerpo: `${nombreEspacio}: ${fechaTexto} a las ${reserva.inicio} hs. ¡Te esperamos!`,
    fecha: fechaRecordatorio,
    datos: { tipo: "recordatorio-reserva", reservaId: reserva.id },
  });
}

export async function cancelarRecordatorioReserva(reservaId: string): Promise<void> {
  if (!reservaId) return;
  try {
    const notificaciones = await Notifications.getAllScheduledNotificationsAsync();
    const recordatorios = notificaciones.filter(
      (notificacion) =>
        notificacion.content.data?.tipo === "recordatorio-reserva" &&
        notificacion.content.data?.reservaId === reservaId
    );
    await Promise.all(
      recordatorios.map((notificacion) =>
        Notifications.cancelScheduledNotificationAsync(notificacion.identifier)
      )
    );
  } catch (error) {
    console.warn("No se pudo quitar el recordatorio local de la reserva.", error);
  }
}
