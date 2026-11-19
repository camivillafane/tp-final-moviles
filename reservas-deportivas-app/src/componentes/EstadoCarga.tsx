import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { SafeAreaView, type Edges } from "react-native-safe-area-context";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";

interface EstadoCargaProps {
  mensaje?: string;
  edges?: Edges;
}

export function EstadoCarga({
  mensaje = "Cargando...",
  edges = ["top", "bottom"],
}: EstadoCargaProps) {
  const paleta = usePaleta();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

  return (
    <SafeAreaView style={estilos.contenedor} edges={edges}>
      <ActivityIndicator size="large" color={paleta.verdePrincipal} />
      <Text style={estilos.mensaje}>{mensaje}</Text>
    </SafeAreaView>
  );
}

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    contenedor: {
      alignItems: "center",
      backgroundColor: paleta.fondo,
      flex: 1,
      justifyContent: "center",
      padding: 24,
    },
    mensaje: {
      color: paleta.verdeGrisaceo,
      fontSize: 16,
      marginTop: 12,
    },
  });
