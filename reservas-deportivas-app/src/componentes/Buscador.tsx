import { useMemo } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import IonIcons from "@react-native-vector-icons/ionicons";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";

interface BuscadorProps {
  valor: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
}

export function Buscador({
  valor,
  onChangeText,
  placeholder = "¿Qué querés reservar?",
}: BuscadorProps) {
  const paleta = usePaleta();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

  return (
    <View style={estilos.contenedor}>
      <IonIcons name="search-outline" size={20} color={paleta.verdeGrisaceo} />
      <TextInput
        style={estilos.input}
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={paleta.verdeGrisaceo}
      />
    </View>
  );
}

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    contenedor: {
      alignItems: "center",
      backgroundColor: paleta.superficie,
      borderColor: paleta.bordeSuave,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: "row",
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    input: {
      color: paleta.textoOscuro,
      flex: 1,
      fontSize: 16,
      marginLeft: 8,
    },
  });
