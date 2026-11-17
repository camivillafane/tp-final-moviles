import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  listarMisReservas,
  cancelarReserva,
} from "@/servicios/reservas";
import { listarEspacios } from "@/servicios/espacios";
import type { Reserva } from "@/tipos/reserva";
import type { Espacio } from "@/tipos/espacio";
import { useSesion } from "@/contextos/Sesion";
import { EstadoConexion } from "@/componentes/EstadoConexion";


export default function MisReservasPantalla() {
  const router = useRouter();
  const { usuario } = useSesion();
  const usuarioId = usuario?.id;
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [cargando, setCargando] = useState(true);


  const cargarReservas = useCallback(async () => {
  try {
    setCargando(true);

    if (!usuarioId) {
      setReservas([]);
      return;
    }

    const [data, espaciosRespuesta] = await Promise.all([
      listarMisReservas(usuarioId),
      listarEspacios({ porPagina: 100 }).catch(() => null),
    ]);
    setReservas(data);
    setEspacios(espaciosRespuesta?.datos ?? []);
  } catch (error) {
    console.error("Error al cargar reservas:", error);
    Alert.alert("Error", "No se pudieron cargar tus reservas.");
  } finally {
    setCargando(false);
  }
}, [usuarioId]);

  useFocusEffect(
  useCallback(() => {
    cargarReservas();
  }, [cargarReservas])
);

  const handleCancelar = async (reservaId: string) => {
    Alert.alert(
      "Cancelar reserva",
      "¿Estás seguro de que deseas cancelar esta reserva?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              if (!usuario) {
                throw new Error("Debés iniciar sesión para cancelar.");
}
              await cancelarReserva(reservaId, usuario.id);
              await cargarReservas();
              Alert.alert("Éxito", "La reserva ha sido cancelada.");
            } catch (error: any) {
              Alert.alert("Error", error.message || "No se pudo cancelar.");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Reserva }) => {
    const espacio = espacios.find((e) => e.id === item.espacioId);
    const esConfirmada = item.estado === "confirmada";
    const etiquetaEstado =
      item.estado === "confirmada" ? "Confirmada" :
      item.estado === "cancelada" ? "Cancelada" :
      item.estado === "cumplida" ? "Cumplida" : "Ausente";

    return (
      <View style={[estilos.tarjeta, !esConfirmada && estilos.tarjetaCancelada]}>
        <View style={estilos.cabeceraTarjeta}>
          <Text style={estilos.nombreEspacio}>
            {espacio ? espacio.nombre : "Espacio deportivo"}
          </Text>
          <View
            style={[
              estilos.badgeEstado,
              { backgroundColor: esConfirmada ? "#E8F5E9" : "#FFEBEE" },
            ]}
          >
            <Text
              style={[
                estilos.textoBadge,
                { color: esConfirmada ? "#2E7D32" : "#C62828" },
              ]}
            >
              {etiquetaEstado}
            </Text>
          </View>
        </View>

        <Text style={estilos.textoInfo}>📅 Fecha: {item.fecha}</Text>
        <Text style={estilos.textoInfo}>
          ⏰ Horario: {item.inicio} a {item.fin} hs
        </Text>
        <Text style={estilos.textoInfo}>
          👥 Personas: {item.cantidadPersonas}
        </Text>
        <Text style={estilos.textoPrecio}>
          Total: ${item.precioTotal.toLocaleString()}
        </Text>

        <TouchableOpacity
          style={estilos.botonDetalle}
          onPress={() =>
            router.push({
              pathname: "/reserva/[id]",
              params: { id: item.id },
            })
          }
        >
          <Text style={estilos.textoBotonDetalle}>Ver detalle</Text>
        </TouchableOpacity>

        {esConfirmada && (
          <View style={estilos.contenedorBotones}>
            <TouchableOpacity
              style={estilos.botonQr}
              onPress={() =>
                router.push({
                  pathname: "/qr-reserva" as any,
                  params: { qrToken: item.qrToken, espacioNombre: espacio?.nombre || "" },
                })
              }
            >
              <Text style={estilos.textoBotonQr}>Ver QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={estilos.botonCancelar}
              onPress={() => handleCancelar(item.id)}
            >
              <Text style={estilos.textoBotonCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <EstadoConexion />

        <View style={estilos.cabecera}>
          <Text style={estilos.titulo}>Mis reservas</Text>
        </View>

      {reservas.length === 0 && !cargando ? (
        <View style={estilos.contenedorVacio}>
          <Text style={estilos.textoVacio}>No tenés reservas registradas.</Text>
        </View>
      ) : (
        <FlatList
          data={reservas}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={estilos.lista}
        />
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: "#F8F9FA" },
  cabecera: { padding: 20, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#EEEEEE" },
  titulo: { fontSize: 22, fontWeight: "bold", color: "#1A1A1A" },
  lista: { padding: 16 },
  tarjeta: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tarjetaCancelada: { opacity: 0.6 },
  cabeceraTarjeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  nombreEspacio: { fontSize: 16, fontWeight: "bold", color: "#1A1A1A", flex: 1 },
  badgeEstado: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  textoBadge: { fontSize: 12, fontWeight: "bold" },
  textoInfo: { fontSize: 14, color: "#666666", marginBottom: 4 },
  textoPrecio: { fontSize: 15, fontWeight: "bold", color: "#2E7D32", marginTop: 8, marginBottom: 12 },
  contenedorBotones: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#EEEEEE", paddingTop: 12 },
  botonQr: { flex: 1, backgroundColor: "#2E7D32", paddingVertical: 8, borderRadius: 8, alignItems: "center", marginRight: 8 },
  textoBotonQr: { color: "#FFFFFF", fontWeight: "bold", fontSize: 14 },
  botonCancelar: { flex: 1, backgroundColor: "#FFEBEE", paddingVertical: 8, borderRadius: 8, alignItems: "center", marginLeft: 8 },
  textoBotonCancelar: { color: "#C62828", fontWeight: "bold", fontSize: 14 },
  botonDetalle: {alignSelf: "flex-start", backgroundColor: "#E8F5E9", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 12,},
  textoBotonDetalle: {color: "#2E7D32", fontWeight: "bold", fontSize: 14,},
  contenedorVacio: { flex: 1, justifyContent: "center", alignItems: "center" },
  textoVacio: { fontSize: 16, color: "#888888" },
});
