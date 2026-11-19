import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import IonIcons from "@react-native-vector-icons/ionicons";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";

interface EstadoVacioProps {
  mensaje?: string;
}

export function EstadoVacio({
  mensaje = "No se encontraron resultados.",
}: EstadoVacioProps) {
  const paleta = usePaleta();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

  return (
    <View style={estilos.contenedor}>
      <IonIcons name="search-outline" size={48} color={paleta.verdeGrisaceo} />
      <Text style={estilos.mensaje}>{mensaje}</Text>
    </View>
  );
}

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    contenedor: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: 180,
      padding: 24,
    },
    mensaje: {
      color: paleta.verdeGrisaceo,
      fontSize: 16,
      marginTop: 12,
      textAlign: "center",
    },
  });
