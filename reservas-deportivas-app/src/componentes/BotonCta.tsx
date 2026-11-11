import { Pressable, StyleSheet, Text } from "react-native";
import { colores } from "@/constantes/colores";

interface BotonCtaProps {
  titulo: string;
  onPress: () => void;
  deshabilitado?: boolean;
}

export function BotonCta({ titulo, onPress, deshabilitado = false }: BotonCtaProps) {
  return (
    <Pressable
      style={[estilos.boton, deshabilitado && estilos.deshabilitado]}
      onPress={onPress}
      disabled={deshabilitado}
    >
      <Text style={estilos.texto}>{titulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  boton: {
    alignItems: "center",
    backgroundColor: colores.magentaPrincipal,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  deshabilitado: {
    backgroundColor: colores.magentaSecundario,
    opacity: 0.7,
  },
  texto: {
    color: colores.blanco,
    fontSize: 14,
    fontWeight: "700",
  },
});
