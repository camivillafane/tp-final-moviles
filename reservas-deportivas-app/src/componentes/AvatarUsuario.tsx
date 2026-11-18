import { useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";

interface AvatarUsuario {
    nombre: string;
    tamaño: number;
}

export function AvatarUsuario({ nombre, tamaño }: AvatarUsuario) {
    const paleta = usePaleta();
    const estilos = useMemo(() => crearEstilos(paleta), [paleta]);
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

const crearEstilos = (paleta: Paleta) =>
    StyleSheet.create({
        circulo: {
            backgroundColor: paleta.verdeBoton,
            justifyContent: "center",
            alignItems: "center",
        },
        iniciales: {
            color: paleta.textoInvertido,
            fontWeight: "700",
            textTransform: "uppercase",
        },
    });
