import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import { useFocusEffect, useRouter } from "expo-router";

import { useSesion } from "@/contextos/Sesion";
import { colores } from "@/constantes/colores";
import { obtenerAgenda, type DatosAgenda } from "@/servicios/agenda";
import { cancelarReservaLocal } from "@/servicios/dbServicios";
import type { Turno } from "@/tipos/turno";

const fechaLocal = (fecha: Date) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const desplazarFecha = (fecha: string, dias: number) => {
  const nueva = new Date(`${fecha}T12:00:00`);
  nueva.setDate(nueva.getDate() + dias);
  return fechaLocal(nueva);
};

const fechaLegible = (fecha: string) =>
  new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${fecha}T12:00:00`));

const etiquetaEstado = (turno: Turno) => {
  if (turno.estado === "libre") return "Libre";
  if (turno.estado === "reservado") return "Reservado";
  if (turno.estado === "fijo") return "Fijo";
  return "Bloqueado";
};

export default function AgendaDiariaPantalla() {
  const router = useRouter();
  const { usuario, cargando } = useSesion();
  const [fecha, setFecha] = useState(() => fechaLocal(new Date()));
  const [datos, setDatos] = useState<DatosAgenda | null>(null);
  const [cargandoAgenda, setCargandoAgenda] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => new Date());
  const consultaActual = useRef(0);

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 30_000);
    return () => clearInterval(intervalo);
  }, []);

  const cargar = useCallback(async () => {
    const idConsulta = ++consultaActual.current;
    setCargandoAgenda(true);
    setError(null);
    try {
      const agenda = await obtenerAgenda(fecha);
      if (idConsulta === consultaActual.current) setDatos(agenda);
    } catch (fallo) {
      if (idConsulta === consultaActual.current) {
        setError(
          fallo instanceof Error
            ? fallo.message
            : "No se pudo cargar la agenda. Intentá nuevamente."
        );
      }
    } finally {
      if (idConsulta === consultaActual.current) setCargandoAgenda(false);
    }
  }, [fecha]);

  useFocusEffect(
    useCallback(() => {
      if (!cargando && usuario && usuario.rol !== "jugador") {
        void cargar();
      }
    }, [cargando, usuario, cargar])
  );

  const espaciosOrdenados = useMemo(
    () => [...(datos?.espacios ?? [])].sort((a, b) => a.id.localeCompare(b.id)),
    [datos?.espacios]
  );

  const reservasPorId = useMemo(
    () => new Map((datos?.reservas ?? []).map((reserva) => [reserva.id, reserva])),
    [datos?.reservas]
  );

  const confirmarCancelacionLocal = (reservaId: string, usuarioId: string) => {
    Alert.alert(
      "Cancelar reserva local",
      "Se cancelará esta reserva guardada en el dispositivo.",
      [
        { text: "Volver", style: "cancel" },
        {
          text: "Cancelar reserva",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelarReservaLocal(reservaId, usuarioId);
              await cargar();
            } catch (fallo) {
              Alert.alert(
                "No se pudo cancelar",
                fallo instanceof Error ? fallo.message : "Intentá nuevamente."
              );
            }
          },
        },
      ]
    );
  };

  if (cargando) {
    return <VistaMensaje mensaje="Verificando la sesión..." />;
  }

  if (!usuario || usuario.rol === "jugador") {
    return (
      <VistaMensaje
        mensaje="Necesitás una cuenta de encargado o administrador para ver la agenda."
        volver={() => router.replace("/")}
      />
    );
  }

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <View style={estilos.encabezado}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <IonIcons name="arrow-back" size={24} color={colores.verdePrincipal} />
        </Pressable>
        <Text style={estilos.titulo}>Agenda diaria</Text>
        <Pressable onPress={cargar} accessibilityRole="button" accessibilityLabel="Actualizar agenda">
          <IonIcons name="refresh-outline" size={23} color={colores.verdePrincipal} />
        </Pressable>
      </View>

      <View style={estilos.selectorFecha}>
        <Pressable
          style={estilos.botonFecha}
          onPress={() => setFecha((actual) => desplazarFecha(actual, -1))}
          accessibilityRole="button"
          accessibilityLabel="Día anterior"
        >
          <IonIcons name="chevron-back" size={20} color={colores.verdePrincipal} />
        </Pressable>
        <View style={estilos.fechaCentro}>
          <Text style={estilos.fechaTexto}>{fechaLegible(fecha)}</Text>
          {fecha !== fechaLocal(new Date()) && (
            <Pressable onPress={() => setFecha(fechaLocal(new Date()))}>
              <Text style={estilos.volverHoy}>Ir a hoy</Text>
            </Pressable>
          )}
        </View>
        <Pressable
          style={estilos.botonFecha}
          onPress={() => setFecha((actual) => desplazarFecha(actual, 1))}
          accessibilityRole="button"
          accessibilityLabel="Día siguiente"
        >
          <IonIcons name="chevron-forward" size={20} color={colores.verdePrincipal} />
        </Pressable>
      </View>

      {cargandoAgenda ? (
        <View style={estilos.centro}>
          <ActivityIndicator color={colores.verdePrincipal} size="large" />
          <Text style={estilos.textoSecundario}>Cargando agenda...</Text>
        </View>
      ) : error ? (
        <View style={estilos.centro}>
          <Text style={estilos.error}>{error}</Text>
          <Pressable style={estilos.botonReintentar} onPress={cargar}>
            <Text style={estilos.textoBoton}>Reintentar</Text>
          </Pressable>
        </View>
      ) : !datos?.turnos.length ? (
        <View style={estilos.centro}>
          <Text style={estilos.textoSecundario}>No hay turnos para esta fecha.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={estilos.lista}>
          <Text style={estilos.resumen}>
            {datos.turnos.length} turnos · {espaciosOrdenados.length} espacios
          </Text>
          {espaciosOrdenados.map((espacio) => {
            const turnosEspacio = datos.turnos
              .filter((turno) => turno.espacioId === espacio.id)
              .sort((a, b) => a.inicio.localeCompare(b.inicio));

            if (turnosEspacio.length === 0) return null;

            return (
              <View key={espacio.id} style={estilos.grupoEspacio}>
                <Text style={estilos.nombreEspacio}>{espacio.nombre}</Text>
                <Text style={estilos.complejo}>{espacio.complejo}</Text>
                {turnosEspacio.map((turno) => {
                  const reserva = turno.reservaId
                    ? reservasPorId.get(turno.reservaId)
                    : undefined;
                  const esPasado = terminoTurno(fecha, turno.fin, ahora);
                  return (
                    <View key={turno.id} style={[
                      estilos.tarjetaTurno,
                      turno.estado === "mantenimiento" && estilos.tarjetaBloqueada,
                      esPasado && estilos.tarjetaPasada,
                    ]}>
                      <Text style={estilos.horario}>
                        {turno.inicio} – {turno.fin}
                      </Text>
                      <View style={[estilos.estado, estiloEstado(turno.estado), esPasado && estilos.estadoPasado]}>
                        <Text style={estilos.textoEstado}>
                          {esPasado ? `Pasado · ${etiquetaEstado(turno)}` : etiquetaEstado(turno)}
                        </Text>
                      </View>
                      {turno.estado === "mantenimiento" && turno.motivoBloqueo && (
                        <Text style={estilos.motivoBloqueo}>Motivo: {turno.motivoBloqueo}</Text>
                      )}
                      {reserva && (
                        <>
                          <Text style={estilos.detalleReserva}>
                            Reserva {reserva.id} · {reserva.cantidadPersonas} personas · {reserva.estado}
                            {reserva.origen === "local"
                              ? ` · Usuario ${reserva.usuarioId} · Guardada en este dispositivo`
                              : " · API"}
                          </Text>
                          {reserva.origen === "local" && reserva.estado === "confirmada" && (
                            <Pressable
                              style={estilos.botonCancelarLocal}
                              onPress={() => confirmarCancelacionLocal(reserva.id, reserva.usuarioId)}
                            >
                              <Text style={estilos.textoCancelarLocal}>Cancelar reserva local</Text>
                            </Pressable>
                          )}
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function VistaMensaje({ mensaje, volver }: { mensaje: string; volver?: () => void }) {
  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <View style={estilos.centro}>
        <Text style={estilos.textoSecundario}>{mensaje}</Text>
        {volver && (
          <Pressable style={estilos.botonReintentar} onPress={volver}>
            <Text style={estilos.textoBoton}>Volver</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: colores.fondo },
  encabezado: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  titulo: { color: colores.textoOscuro, fontSize: 21, fontWeight: "700" },
  selectorFecha: {
    alignItems: "center",
    backgroundColor: colores.blanco,
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  botonFecha: { padding: 6 },
  fechaCentro: { alignItems: "center", flex: 1 },
  fechaTexto: { color: colores.textoOscuro, fontSize: 15, fontWeight: "600", textTransform: "capitalize" },
  volverHoy: { color: colores.verdePrincipal, fontSize: 13, fontWeight: "600", marginTop: 4 },
  lista: { padding: 16, paddingBottom: 32 },
  resumen: { color: colores.verdeGrisaceo, fontSize: 13, marginBottom: 12 },
  grupoEspacio: {
    backgroundColor: colores.blanco,
    borderRadius: 14,
    marginBottom: 14,
    padding: 14,
  },
  nombreEspacio: { color: colores.textoOscuro, fontSize: 17, fontWeight: "700" },
  complejo: { color: colores.verdeGrisaceo, fontSize: 13, marginTop: 3, marginBottom: 8 },
  tarjetaTurno: {
    alignItems: "center",
    borderTopColor: colores.borde,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 10,
  },
  tarjetaBloqueada: { backgroundColor: "#fff0f0", borderRadius: 8, paddingHorizontal: 7 },
  tarjetaPasada: { backgroundColor: "#ECEFF1", borderRadius: 8, paddingHorizontal: 7 },
  horario: { color: colores.textoOscuro, fontSize: 14, fontWeight: "600", minWidth: 98 },
  estado: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  estado_libre: { backgroundColor: "#e5f2e8" },
  estado_reservado: { backgroundColor: "#f3e1e1" },
  estado_fijo: { backgroundColor: "#eee5f2" },
  estado_mantenimiento: { backgroundColor: "#f8d7da" },
  estadoPasado: { backgroundColor: "#DDE2E5" },
  textoEstado: { color: colores.textoOscuro, fontSize: 12, fontWeight: "600" },
  motivoBloqueo: { color: colores.verdeGrisaceo, flexBasis: "100%", fontSize: 12 },
  detalleReserva: { color: colores.verdeGrisaceo, flexBasis: "100%", fontSize: 12 },
  botonCancelarLocal: { alignSelf: "flex-start", borderColor: "#c62828", borderRadius: 8, borderWidth: 1, marginTop: 4, paddingHorizontal: 10, paddingVertical: 6 },
  textoCancelarLocal: { color: "#c62828", fontSize: 12, fontWeight: "600" },
  centro: { alignItems: "center", flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  textoSecundario: { color: colores.verdeGrisaceo, fontSize: 15, textAlign: "center" },
  error: { color: "#9b2c2c", fontSize: 15, textAlign: "center" },
  botonReintentar: { backgroundColor: colores.verdePrincipal, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 11 },
  textoBoton: { color: colores.blanco, fontSize: 14, fontWeight: "700" },
});

function terminoTurno(fecha: string, horaFin: string, ahora: Date): boolean {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [hora, minuto] = horaFin.split(":").map(Number);
  if (![anio, mes, dia, hora, minuto].every(Number.isFinite)) return false;
  return new Date(anio, mes - 1, dia, hora, minuto).getTime() <= ahora.getTime();
}

function estiloEstado(estado: Turno["estado"]) {
  switch (estado) {
    case "libre":
      return estilos.estado_libre;
    case "reservado":
      return estilos.estado_reservado;
    case "fijo":
      return estilos.estado_fijo;
    case "mantenimiento":
      return estilos.estado_mantenimiento;
  }
}
