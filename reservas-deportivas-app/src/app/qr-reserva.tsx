import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import QRCode from "react-native-qrcode-svg";
import { colores } from "@/constantes/colores";

export default function QrReservaPantalla() {
  const router = useRouter();
  const { qrToken, espacioNombre } = useLocalSearchParams<{
    qrToken?: string;
    espacioNombre?: string;
  }>();

  const token = typeof qrToken === "string" ? qrToken : "";
  const nombre =
    typeof espacioNombre === "string" ? espacioNombre : "Espacio deportivo";

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <Pressable
        onPress={() => router.back()}
        style={estilos.botonVolver}
        accessibilityRole="button"
        accessibilityLabel="Volver atrás"
      >
        <IonIcons name="arrow-back" size={26} color={colores.verdePrincipal} />
      </Pressable>

      <View style={estilos.contenido}>
        <Text style={estilos.titulo}>QR de reserva</Text>
        <Text style={estilos.nombre}>{nombre}</Text>
        <Text style={estilos.instruccion}>
          Presentá este código al ingresar al espacio.
        </Text>

        {token ? (
          <View style={estilos.marcoQr}>
            <QRCode value={token} size={240} />
          </View>
        ) : (
          <Text style={estilos.error}>No se encontró el código de esta reserva.</Text>
        )}

        <Text style={estilos.detalle}>
          Este QR corresponde a tu reserva confirmada.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  botonVolver: {
    marginBottom: 12,
  },
  volver: {
    color: "#2E7D32",
    fontSize: 16,
  },
  contenido: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: {
    color: "#1A1A1A",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  nombre: {
    color: "#333333",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  instruccion: {
    color: "#666666",
    fontSize: 15,
    marginBottom: 28,
    textAlign: "center",
  },
  marcoQr: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
  },
  detalle: {
    color: "#666666",
    fontSize: 13,
    marginTop: 20,
    textAlign: "center",
  },
  error: {
    color: "#C62828",
    fontSize: 15,
    textAlign: "center",
  },
});