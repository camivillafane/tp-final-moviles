import { StyleSheet, Text, View } from "react-native";
import IonIcons from "@react-native-vector-icons/ionicons";
import { colores } from "@/constantes/colores";

interface EstadoVacioProps {
  mensaje?: string;
}

export function EstadoVacio({
  mensaje = "No se encontraron resultados.",
}: EstadoVacioProps) {
  return (
    <View style={estilos.contenedor}>
      <IonIcons name="search-outline" size={48} color={colores.verdeGrisaceo} />
      <Text style={estilos.mensaje}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
    padding: 24,
  },
  mensaje: {
    color: colores.verdeGrisaceo,
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
});
