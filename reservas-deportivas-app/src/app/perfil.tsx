import { useCallback, useMemo, useState, type ComponentProps } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import IonIcons from "@react-native-vector-icons/ionicons";

import { AvatarUsuario } from "@/componentes/AvatarUsuario";
import { EstadoVacio } from "@/componentes/EstadoVacio";
import { HeaderInstitucional } from "@/componentes/HeaderInstitucional";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";
import { roles } from "@/constantes/roles";
import { useSesion } from "@/contextos/Sesion";

export default function Perfil() {
    const router = useRouter();
    const { usuario, actualizarUsuario } = useSesion();
    const usuarioId = usuario?.id;
    const paleta = usePaleta();
    const estilos = useMemo(() => crearEstilos(paleta), [paleta]);
    const [falloAlActualizar, setFalloAlActualizar] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!usuarioId) return;

            let activa = true;
            actualizarUsuario()
                .then(() => {
                    if (activa) setFalloAlActualizar(false);
                })
                .catch(() => {
                    if (activa) setFalloAlActualizar(true);
                });

            return () => {
                activa = false;
            };
        }, [actualizarUsuario, usuarioId])
    );

    if (!usuario) {
        return (
            <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
                <HeaderInstitucional
                    mostrarVolver
                    onVolverPress={() => router.back()}
                />
                <EstadoVacio mensaje="No hay sesión activa" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
            <HeaderInstitucional
                mostrarVolver
                onVolverPress={() => router.back()}
            />

            <ScrollView
                contentContainerStyle={estilos.contenido}
                showsVerticalScrollIndicator={false}
            >
                <View style={estilos.card}>
                    <AvatarUsuario nombre={usuario.nombre} tamaño={80} />
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

                {usuario.rol === "jugador" && (
                    <>
                        <Text style={estilos.titulo}>Actividad de la cuenta</Text>
                        <View style={estilos.cardDatos}>
                            <Fila
                                icono="time-outline"
                                etiqueta="Cancelaciones tardías"
                                valor={String(usuario.cancelacionesTardias ?? 0)}
                            />
                            <View style={estilos.separador} />
                            <Fila
                                icono="alert-circle-outline"
                                etiqueta="Ausencias"
                                valor={String(usuario.ausencias ?? 0)}
                            />
                        </View>
                        {falloAlActualizar && (
                            <Text style={estilos.avisoActualizacion}>
                                Sin conexión: se muestra el último dato guardado.
                            </Text>
                        )}
                    </>
                )}
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
    const paleta = usePaleta();
    const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

    return (
        <View style={estilos.fila}>
            <IonIcons
                name={icono}
                size={20}
                color={paleta.verdePrincipal}
            />
            <Text style={estilos.etiqueta}>{etiqueta}</Text>
            <Text style={estilos.valor}>{valor}</Text>
        </View>
    );
}

const crearEstilos = (paleta: Paleta) =>
    StyleSheet.create({
        contenedor: {
            backgroundColor: paleta.fondo,
            flex: 1,
        },
        contenido: {
            padding: 16,
            paddingBottom: 16,
        },
        card: {
            alignItems: "center",
            padding: 16,
            backgroundColor: paleta.superficie,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: paleta.bordeSuave,
        },
        nombre: {
            color: paleta.textoOscuro,
            fontSize: 20,
            fontWeight: "bold",
            textAlign: "center",
            marginTop: 10,
        },
        chipRol: {
            backgroundColor: paleta.superficieAlt,
            marginTop: 8,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 16,
        },
        chipTexto: {
            color: paleta.textoOscuro,
            fontSize: 18,
            fontWeight: "700",
            textTransform: "uppercase",
        },
        titulo: {
            color: paleta.textoOscuro,
            fontSize: 18,
            fontWeight: "bold",
            marginTop: 24,
            marginBottom: 8,
        },
        cardDatos: {
            backgroundColor: paleta.superficie,
            borderColor: paleta.bordeSuave,
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
            color: paleta.verdeGrisaceo,
            fontSize: 16,
            textTransform: "uppercase",
        },
        valor: {
            color: paleta.textoOscuro,
            fontSize: 16,
            fontWeight: "500",
        },
        avisoActualizacion: {
            color: paleta.verdeGrisaceo,
            fontSize: 13,
            marginTop: 8,
        },
        separador: {
            backgroundColor: paleta.bordeSuave,
            height: 1,
        },
    });
