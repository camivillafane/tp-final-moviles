import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";

export default function Proximamente() {
    const router = useRouter();
    const { titulo } = useLocalSearchParams<{ titulo?: string }>();
    const paleta = usePaleta();
    const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

    return (
        <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
            <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />

            <View style={estilos.contenido}>
                <IonIcons name="construct-outline" size={48} color={paleta.verdeGrisaceo} />
                <Text style={estilos.titulo}>{titulo ?? "Esta pantalla"}</Text>
                <Text style={estilos.mensaje}>Va a estar disponible próximamente.</Text>
            </View>
        </SafeAreaView>
    );
}

const crearEstilos = (paleta: Paleta) =>
    StyleSheet.create({
        contenedor: {
            backgroundColor: paleta.fondo,
            flex: 1,
        },
        contenido: {
            alignItems: "center",
            flex: 1,
            justifyContent: "center",
            padding: 24,
        },
        titulo: {
            color: paleta.textoOscuro,
            fontSize: 20,
            fontWeight: "700",
            marginTop: 16,
            textAlign: "center",
        },
        mensaje: {
            color: paleta.verdeGrisaceo,
            fontSize: 15,
            marginTop: 8,
            textAlign: "center",
        },
    });
