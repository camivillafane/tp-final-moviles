import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { CardEspacio } from "@/componentes/CardEspacio";
import { EstadoVacio } from "@/componentes/EstadoVacio";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { colores } from "@/constantes/colores";
import { useFavoritos } from "@/contextos/Favoritos";
import { useSesion } from "@/contextos/Sesion";
import { listarEspacios } from "@/servicios/espacios";
import type { Espacio } from "@/tipos/espacio";

export default function Favoritos() {
    const router = useRouter();
    const { usuario } = useSesion();
    const { favoritos } = useFavoritos();
    const [todos, setTodos] = useState<Espacio[]>([]);

    useEffect(() => {
        listarEspacios({ porPagina: 100 })
            .then(({ datos }) => setTodos(datos))
            .catch(() => setTodos([]));
    }, []);

    const espaciosFavoritos = useMemo(
        () => todos.filter((espacio) => favoritos.includes(espacio.id)),
        [todos, favoritos]
    );

    if (!usuario) {
        return (
            <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
            <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />
            <EstadoVacio mensaje="Iniciá sesión para ver tus favoritos." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
        <HeaderInstitucional mostrarVolver onVolverPress={() => router.back()} />

        <ScrollView
            contentContainerStyle={estilos.contenido}
            showsVerticalScrollIndicator={false}
        >
            <Text style={estilos.titulo}>Mis favoritos</Text>

            {espaciosFavoritos.length === 0 ? (
            <EstadoVacio mensaje="Todavía no guardaste ningún espacio." />
            ) : (
            espaciosFavoritos.map((espacio) => (
                <CardEspacio
                key={espacio.id}
                espacio={espacio}
                onVerDetalle={() =>
                    router.push({
                    pathname: "/espacio/[id]",
                    params: { id: espacio.id },
                    })
                }
                />
            ))
        )}
        </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
    contenedor: {
        backgroundColor: colores.fondo,
        flex: 1,
    },
    contenido: {
        padding: 16,
        paddingBottom: 32,
    },
    titulo: {
        color: colores.textoOscuro,
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 16,
    },
});
