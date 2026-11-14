import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSesion } from "@/contextos/Sesion";
import { obtenerReservaLocal } from "@/servicios/dbServicios";
import type { Reserva } from "@/tipos/reserva";
import { espaciosMock } from "@/mocks/espacios"; 

export default function DetalleReservaPantalla() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { usuario } = useSesion();

  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const espacio = reserva
  ? espaciosMock.find((item) => item.id === reserva.espacioId)
  : undefined;

  useEffect(() => {
    let desmontado = false;

    const cargarReserva = async () => {
      if (!id || !usuario?.id) {
        setError("No se encontró la reserva.");
        setCargando(false);
        return;
      }

      try {
        const resultado = await obtenerReservaLocal(id, usuario.id);

        if (!desmontado) {
          setReserva(resultado);
          if (!resultado) setError("No se encontró la reserva.");
        }
      } catch (e) {
        console.error("Error al cargar el detalle de la reserva:", e);
        if (!desmontado) setError("No se pudo cargar la reserva.");
      } finally {
        if (!desmontado) setCargando(false);
      }
    };

    cargarReserva();

    return () => {
      desmontado = true;
    };
  }, [id, usuario?.id]);

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Pressable onPress={() => router.back()}>
          <Text style={estilos.volver}>‹ Volver</Text>
        </Pressable>

        <Text style={estilos.titulo}>Detalle de reserva</Text>

        {cargando ? (
          <ActivityIndicator size="large" color="#2E7D32" />
        ) : error || !reserva ? (
          <Text style={estilos.mensaje}>{error || "No se encontró la reserva."}</Text>
        ) : (
          <View style={estilos.tarjeta}>
            <Text style={estilos.nombre}>Reserva {reserva.id}</Text>
            <Text style={estilos.estado}>
              Estado: {reserva.estado === "confirmada" ? "Confirmada" : "Cancelada"}
            </Text>
            <Text style={estilos.dato}>
                Espacio: {espacio?.nombre ?? reserva.espacioId}
            </Text>
            <Text style={estilos.dato}>Fecha: {reserva.fecha}</Text>
            <Text style={estilos.dato}>
              Horario: {reserva.inicio} a {reserva.fin} hs
            </Text>
            <Text style={estilos.dato}>
              Personas: {reserva.cantidadPersonas}
            </Text>
            <Text style={estilos.dato}>
              Precio por hora: ${reserva.precioPorHora.toLocaleString()}
            </Text>
            <Text style={estilos.total}>
              Total: ${reserva.precioTotal.toLocaleString()}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#F8F9FA" },
  contenido: { padding: 20 },
  volver: { color: "#2E7D32", fontSize: 16, marginBottom: 20 },
  titulo: {
    color: "#1A1A1A",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    elevation: 2,
    padding: 18,
  },
  nombre: {
    color: "#1A1A1A",
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 10,
  },
  estado: { color: "#2E7D32", fontWeight: "600", marginBottom: 14 },
  dato: { color: "#555555", fontSize: 15, marginBottom: 10 },
  total: {
    color: "#2E7D32",
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 6,
  },
  mensaje: { color: "#666666", fontSize: 16, marginTop: 20 },
});