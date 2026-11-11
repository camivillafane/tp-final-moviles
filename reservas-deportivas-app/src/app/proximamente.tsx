import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { colores } from "@/constantes/colores";

export default function Proximamente() {
    const router = useRouter();
    const { titulo } = useLocalSearchParams<{ titulo?: string }>();

    return (
        <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
            <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />

            <View style={estilos.contenido}>
                <IonIcons name="construct-outline" size={48} color={colores.verdeGrisaceo} />
                <Text style={estilos.titulo}>{titulo ?? "Esta pantalla"}</Text>
                <Text style={estilos.mensaje}>Va a estar disponible próximamente.</Text>
            </View>
        </SafeAreaView>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        backgroundColor: colores.fondo,
        flex: 1,
    },
    contenido: {
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        padding: 24,
    },
    titulo: {
        color: colores.textoOscuro,
        fontSize: 20,
        fontWeight: "700",
        marginTop: 16,
        textAlign: "center",
    },
    mensaje: {
        color: colores.verdeGrisaceo,
        fontSize: 15,
        marginTop: 8,
        textAlign: "center",
    },
});
