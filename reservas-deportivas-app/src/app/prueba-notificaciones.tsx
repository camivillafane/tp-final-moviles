import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { colores } from "@/constantes/colores";
import {
  cancelarNotificacionLocal,
  cancelarRecordatorioReserva,
  programarRecordatorioReserva,
  programarNotificacionLocal,
  solicitarPermisoNotificaciones,
} from "@/servicios/notificacionesLocales";
import * as Notifications from "expo-notifications";

export default function PruebaNotificacionesPantalla() {
  const router = useRouter();
  const [permiso, setPermiso] = useState("Consultando permiso...");
  const [identificadorPendiente, setIdentificadorPendiente] = useState<string | null>(null);
  const [reservaPruebaId, setReservaPruebaId] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState("Todavía no se programó una notificación.");

  useEffect(() => {
    void Notifications.getPermissionsAsync().then((respuesta) => {
      setPermiso(respuesta.granted ? "Concedido" : "No concedido");
    });

    const suscripcion = Notifications.addNotificationReceivedListener((notificacion) => {
      if (notificacion.request.content.data?.origen === "prueba-local") {
        setMensaje("La notificación llegó mientras la app estaba abierta.");
        setIdentificadorPendiente(null);
      }
      if (notificacion.request.content.data?.tipo === "recordatorio-reserva") {
        setMensaje("Llegó el recordatorio de reserva de prueba.");
        setReservaPruebaId(null);
      }
    });

    return () => suscripcion.remove();
  }, []);

  const pedirPermiso = async () => {
    setOcupado(true);
    try {
      const concedido = await solicitarPermisoNotificaciones();
      setPermiso(concedido ? "Concedido" : "Denegado");
      setMensaje(
        concedido
          ? "Permiso listo. Ya podés programar la prueba."
          : "No se concedió el permiso. Revisá los permisos de Expo Go en Android."
      );
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo consultar el permiso.");
    } finally {
      setOcupado(false);
    }
  };

  const programarPrueba = async () => {
    setOcupado(true);
    try {
      const identificador = await programarNotificacionLocal({
        titulo: "Prueba de notificación",
        cuerpo: "Si recibís este aviso, las notificaciones locales funcionan.",
        fecha: new Date(Date.now() + 10_000),
        datos: { origen: "prueba-local" },
      });

      if (!identificador) {
        setPermiso("Denegado");
        setMensaje("No se programó: hace falta conceder el permiso de notificaciones.");
        return;
      }

      setPermiso("Concedido");
      setIdentificadorPendiente(identificador);
      setMensaje("Programada para dentro de 10 segundos.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo programar la notificación.");
    } finally {
      setOcupado(false);
    }
  };

  const cancelarPrueba = async () => {
    setOcupado(true);
    try {
      await cancelarNotificacionLocal(identificadorPendiente);
      setIdentificadorPendiente(null);
      setMensaje("Se canceló la notificación pendiente.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo cancelar la notificación.");
    } finally {
      setOcupado(false);
    }
  };

  const programarRecordatorioPrueba = async () => {
    setOcupado(true);
    try {
      const ahora = Date.now();
      const inicio = new Date(ahora + 2 * 60 * 60 * 1000 + 60_000);
      inicio.setSeconds(0, 0);
      const fecha = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, "0")}-${String(inicio.getDate()).padStart(2, "0")}`;
      const hora = `${String(inicio.getHours()).padStart(2, "0")}:${String(inicio.getMinutes()).padStart(2, "0")}`;
      const id = `prueba-recordatorio-${Date.now()}`;
      const identificador = await programarRecordatorioReserva(
        { id, fecha, inicio: hora },
        "Cancha de prueba",
        { anticipacionMs: inicio.getTime() - ahora - 10_000 }
      );
      if (!identificador) {
        setPermiso("Denegado");
        setMensaje("No se programó: revisá el permiso de notificaciones.");
        return;
      }
      setReservaPruebaId(id);
      setPermiso("Concedido");
      setMensaje("Recordatorio de reserva programado para dentro de 10 segundos.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo programar el recordatorio.");
    } finally {
      setOcupado(false);
    }
  };

  const cancelarRecordatorioPrueba = async () => {
    setOcupado(true);
    try {
      if (reservaPruebaId) await cancelarRecordatorioReserva(reservaPruebaId);
      setReservaPruebaId(null);
      setMensaje("Se canceló el recordatorio de reserva de prueba.");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo cancelar el recordatorio.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />
      <View style={estilos.contenido}>
        <Text style={estilos.titulo}>Prueba de notificaciones locales</Text>
        <Text style={estilos.descripcion}>
          Esta pantalla de desarrollo programa un aviso de prueba para 10 segundos después. No crea ni modifica reservas.
        </Text>

        <View style={estilos.tarjeta}>
          <Text style={estilos.etiqueta}>Permiso: <Text style={estilos.valor}>{permiso}</Text></Text>
          <Text style={estilos.mensaje}>{mensaje}</Text>

          <Pressable style={estilos.botonSecundario} onPress={() => void pedirPermiso()} disabled={ocupado}>
            <Text style={estilos.textoBotonSecundario}>{ocupado ? "Un momento..." : "Pedir permiso"}</Text>
          </Pressable>
          <Pressable style={estilos.botonPrincipal} onPress={() => void programarPrueba()} disabled={ocupado}>
            <Text style={estilos.textoBotonPrincipal}>{ocupado ? "Un momento..." : "Programar prueba (10 s)"}</Text>
          </Pressable>
          <Pressable style={estilos.botonPrincipal} onPress={() => void programarRecordatorioPrueba()} disabled={ocupado}>
            <Text style={estilos.textoBotonPrincipal}>{ocupado ? "Un momento..." : "Probar recordatorio de reserva (10 s)"}</Text>
          </Pressable>
          <Pressable
            style={[estilos.botonCancelar, (!reservaPruebaId || ocupado) && estilos.botonDeshabilitado]}
            onPress={() => void cancelarRecordatorioPrueba()}
            disabled={!reservaPruebaId || ocupado}
          >
            <Text style={estilos.textoCancelar}>Cancelar recordatorio de prueba</Text>
          </Pressable>
          <Pressable
            style={[estilos.botonCancelar, (!identificadorPendiente || ocupado) && estilos.botonDeshabilitado]}
            onPress={() => void cancelarPrueba()}
            disabled={!identificadorPendiente || ocupado}
          >
            <Text style={estilos.textoCancelar}>Cancelar prueba pendiente</Text>
          </Pressable>
        </View>

        <Text style={estilos.ayuda}>
          Para probar en segundo plano, programá el aviso y minimizá Expo Go antes de que pasen los 10 segundos.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  contenido: { flex: 1, gap: 16, padding: 20 },
  titulo: { color: colores.textoOscuro, fontSize: 22, fontWeight: "700" },
  descripcion: { color: colores.verdeGrisaceo, fontSize: 15, lineHeight: 22 },
  tarjeta: { backgroundColor: colores.blanco, borderRadius: 14, gap: 14, padding: 16 },
  etiqueta: { color: colores.textoOscuro, fontSize: 15, fontWeight: "600" },
  valor: { color: colores.verdePrincipal },
  mensaje: { color: colores.verdeGrisaceo, fontSize: 14, lineHeight: 20 },
  botonPrincipal: { alignItems: "center", backgroundColor: colores.verdePrincipal, borderRadius: 10, padding: 13 },
  textoBotonPrincipal: { color: colores.blanco, fontSize: 15, fontWeight: "700" },
  botonSecundario: { alignItems: "center", borderColor: colores.verdePrincipal, borderRadius: 10, borderWidth: 1, padding: 12 },
  textoBotonSecundario: { color: colores.verdePrincipal, fontSize: 14, fontWeight: "600" },
  botonCancelar: { alignItems: "center", backgroundColor: "#FFEBEE", borderRadius: 10, padding: 12 },
  botonDeshabilitado: { opacity: 0.5 },
  textoCancelar: { color: "#C62828", fontSize: 14, fontWeight: "600" },
  ayuda: { color: colores.verdeGrisaceo, fontSize: 13, lineHeight: 19 },
});
