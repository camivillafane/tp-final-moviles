import { StyleSheet, TextInput, View } from "react-native";
import IonIcons from "@react-native-vector-icons/ionicons";
import { colores } from "@/constantes/colores";

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
  return (
    <View style={estilos.contenedor}>
      <IonIcons name="search-outline" size={20} color={colores.verdeGrisaceo} />
      <TextInput
        style={estilos.input}
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colores.verdeGrisaceo}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    alignItems: "center",
    backgroundColor: colores.blanco,
    borderColor: colores.borde,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    color: colores.textoOscuro,
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
});
