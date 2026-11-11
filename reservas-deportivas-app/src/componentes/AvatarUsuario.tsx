import { StyleSheet, View, Text } from "react-native";
import { colores } from "@/constantes/colores";

interface AvatarUsuario {
    nombre: string;
    tamaño: number;
}

export function AvatarUsuario({ nombre, tamaño }: AvatarUsuario) {
    const iniciales = nombre
        .split(" ")
        .map((palabra) => palabra.charAt(0).toUpperCase())
        .join("");

    return (
        <View
            style={[
                estilos.circulo,
                { borderRadius: tamaño / 2, width: tamaño, height: tamaño },
            ]}
        >   
            <Text style={[estilos.iniciales, { fontSize: tamaño / 2 }]}>
                {iniciales}
            </Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    circulo: {
        backgroundColor: colores.verdePrincipal,
        justifyContent: "center",
        alignItems: "center",
    },
    iniciales: {
        color: colores.blanco,
        fontWeight: "700",
        textTransform: "uppercase",
    },
});