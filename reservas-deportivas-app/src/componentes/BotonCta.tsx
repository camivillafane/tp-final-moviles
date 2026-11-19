import { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";

interface BotonCtaProps {
  titulo: string;
  onPress: () => void;
  deshabilitado?: boolean;
}

export function BotonCta({ titulo, onPress, deshabilitado = false }: BotonCtaProps) {
  const paleta = usePaleta();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

  return (
    <Pressable
      style={[estilos.boton, deshabilitado && estilos.deshabilitado]}
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
    >
      <Text style={[estilos.texto, deshabilitado && estilos.textoDeshabilitado]}>
        {titulo}
      </Text>
    </Pressable>
  );
}

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    boton: {
      alignItems: "center",
      backgroundColor: paleta.magentaBoton,
      borderRadius: 10,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    deshabilitado: {
      backgroundColor: paleta.botonDeshabilitado,
    },
    texto: {
      color: paleta.textoInvertido,
      fontSize: 14,
      fontWeight: "700",
    },
    textoDeshabilitado: {
      color: paleta.textoDeshabilitado,
    },
  });
