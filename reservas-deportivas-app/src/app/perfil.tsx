import type { ComponentProps } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";
import { AvatarUsuario } from "@/componentes/AvatarUsuario";
import { EstadoVacio } from "@/componentes/EstadoVacio";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { colores } from "@/constantes/colores";
import { roles } from "@/constantes/roles";
import { useSesion } from "@/contextos/Sesion";

export default function Perfil() {
    const router = useRouter();
    const { usuario } = useSesion();

    if (!usuario) {
        return (
            <SafeAreaView style={estilos.contenedor} edges={["top","bottom"]}>
                <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />
                <EstadoVacio mensaje="No hay sesión activa" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={estilos.contenedor} edges={["top","bottom"]}>
            <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />
            <ScrollView
                contentContainerStyle={estilos.contenido}
                showsVerticalScrollIndicator={false}
            >
                <View style = {estilos.card}>
                    <AvatarUsuario nombre = {usuario.nombre} tamaño={80} />
                    <Text style={estilos.nombre}>{usuario.nombre}</Text>
                    <View style={estilos.chipRol}>
                        <Text style={estilos.chipTexto}>
                        {roles[usuario.rol]}
                        </Text>
                    </View>
                </View>
                <Text style={estilos.titulo}>Información de contacto</Text>
                <View style={estilos.cardDatos}>
                    <Fila
                        icono="mail-outline"
                        etiqueta="Email"
                        valor={usuario.email}
                    />
                    <View style={estilos.separador} />
                    <Fila
                        icono="call-outline"
                        etiqueta="Teléfono"
                        valor={usuario.telefono}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

interface FilaProps {
    icono: ComponentProps<typeof IonIcons>["name"];
    etiqueta: string;
    valor: string;
}

function Fila({ icono, etiqueta, valor }: FilaProps) {
    return (
        <View style={estilos.fila}>
            <IonIcons name={icono} size={20} color={colores.verdePrincipal} />
            <Text style={estilos.etiqueta}>{etiqueta}</Text>
            <Text style={estilos.valor}>{valor}</Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: {
        backgroundColor: colores.fondo,
        flex: 1,
    },
    contenido: {
        padding: 16,
        paddingBottom: 16,
    },
    card: {
        alignItems: "center",
        padding: 16,
        backgroundColor: colores.blanco,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colores.verdeGrisaceo,
    },
    nombre: {
        color: colores.textoOscuro,
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 10,
    },
    chipRol: {
        backgroundColor: colores.fondo,
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    chipTexto: {
        color: colores.textoOscuro,
        fontSize: 18,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    titulo: {
        color: colores.textoOscuro,
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 24,
        marginBottom: 8,
    },
    cardDatos: {
        backgroundColor: colores.blanco,
        borderColor: colores.verdeGrisaceo,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
    },
    fila: {
        alignItems: "center",
        flexDirection: "row",
        paddingVertical: 12,
        gap: 8,
    },
    etiqueta: {
        color: colores.verdeGrisaceo,
        fontSize: 16,
        textTransform: "uppercase",
    },
    valor: {
        color: colores.verdeGrisaceo,
        fontSize: 16,
        fontWeight: "500",
    },
    separador: {
        backgroundColor: colores.borde,
        height: 1,
    },
});