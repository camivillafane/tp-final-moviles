import { Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import { colores } from "@/constantes/colores";

interface EstadoErrorProps {
  mensaje?: string;
  onReintentar?: () => void;
}

export function EstadoError({
  mensaje = "No se pudieron cargar los datos.",
  onReintentar,
}: EstadoErrorProps) {
  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <IonIcons name="alert-circle-outline" size={48} color={colores.magentaPrincipal} />
      <Text style={estilos.mensaje}>{mensaje}</Text>
      {onReintentar && (
        <Pressable style={estilos.boton} onPress={onReintentar}>
          <Text style={estilos.textoBoton}>Reintentar</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  mensaje: {
    color: colores.textoOscuro,
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
  boton: {
    backgroundColor: colores.magentaPrincipal,
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  textoBoton: {
    color: colores.blanco,
    fontSize: 14,
    fontWeight: "600",
  },
});
