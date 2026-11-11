import type { ComponentProps } from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter, type Href } from "expo-router";
import IonIcons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvatarUsuario } from "@/componentes/AvatarUsuario";
import { colores } from "@/constantes/colores";
import { roles } from "@/constantes/roles";
import { Usuario } from "@/tipos/usuario";

type NombreIcono = ComponentProps<typeof IonIcons>["name"];

interface OpcionMenu {
    etiqueta: string;
    icono: NombreIcono;
    destino: Href;
}

interface PerfilMenuProps {
    visible: boolean;
    usuario: Usuario | null;
    onCerrar: () => void;
    onCerrarSesion: () => void;
}

const proximamente = (titulo: string): Href => ({
    pathname: "/proximamente",
    params: { titulo },
});

export function MenuPerfil({
    visible,
    usuario,
    onCerrar,
    onCerrarSesion,
}: PerfilMenuProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const opciones: OpcionMenu[] = [];

    if (!usuario) {
        opciones.push(
            {
                etiqueta: "Iniciar sesión",
                icono: "log-in-outline",
                destino: proximamente("Iniciar sesión"),
            },
            {
                etiqueta: "Crear cuenta",
                icono: "person-add-outline",
                destino: proximamente("Crear cuenta"),
            }
        );
    } else {
        opciones.push({
            etiqueta: "Mi perfil",
            icono: "person-outline",
            destino: "/perfil",
        });

        if (usuario.rol === "jugador") {
            opciones.push(
                {
                    etiqueta: "Mis reservas",
                    icono: "calendar-outline",
                    destino: proximamente("Mis reservas"),
                },
                {
                    etiqueta: "Mis favoritos",
                    icono: "heart-outline",
                    destino: "/favoritos",
                }
            );
        } else {
            opciones.push({
                etiqueta: "Gestión de turnos",
                icono: "clipboard-outline",
                destino: proximamente("Gestión de turnos"),
            });
        }
    }

    const navegar = (destino: Href) => {
        onCerrar();
        router.push(destino);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onCerrar}
        >
            <Pressable style={estilos.fondo} onPress={onCerrar}>
                <Pressable
                    style={[estilos.hoja, { paddingBottom: insets.bottom + 20 }]}
                    onPress={(evento) => evento.stopPropagation()}
                >
                    {usuario ? (
                        <View style={estilos.encabezadoUsuario}>
                            <AvatarUsuario nombre={usuario.nombre} tamaño={56} />
                            <View style={estilos.encabezadoTexto}>
                                <Text style={estilos.nombre} numberOfLines={1}>
                                    {usuario.nombre}
                                </Text>
                                <Text style={estilos.email} numberOfLines={1}>
                                    {usuario.email}
                                </Text>
                                <Text style={estilos.rol}>
                                    {roles[usuario.rol]}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View>
                            <Text style={estilos.titulo}>Mi cuenta</Text>
                            <Text style={estilos.descripcion}>
                                Iniciá sesión para reservar turnos y guardar tus favoritos.
                            </Text>
                        </View>
                    )}

                    <View style={estilos.opciones}>
                        {opciones.map((opcion) => (
                            <Pressable
                                key={opcion.etiqueta}
                                style={estilos.opcion}
                                onPress={() => navegar(opcion.destino)}
                                accessibilityRole="button"
                            >
                                <IonIcons
                                    name={opcion.icono}
                                    size={22}
                                    color={colores.verdePrincipal}
                                />
                                <Text style={estilos.opcionTexto}>{opcion.etiqueta}</Text>
                                <IonIcons
                                    name="chevron-forward"
                                    size={18}
                                    color={colores.verdeGrisaceo}
                                />
                            </Pressable>
                        ))}
                    </View>

                    {usuario && (
                        <Pressable
                            style={estilos.cerrarSesion}
                            onPress={onCerrarSesion}
                            accessibilityRole="button"
                        >
                            <IonIcons
                                name="log-out-outline"
                                size={22}
                                color={colores.magentaPrincipal}
                            />
                            <Text style={estilos.cerrarSesionTexto}>Cerrar sesión</Text>
                        </Pressable>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const estilos = StyleSheet.create({
    fondo: {
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        flex: 1,
        justifyContent: "flex-end",
    },
    hoja: {
        backgroundColor: colores.blanco,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    encabezadoUsuario: {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
    },
    encabezadoTexto: {
        flex: 1,
    },
    titulo: {
        color: colores.textoOscuro,
        fontSize: 20,
        fontWeight: "700",
    },
    descripcion: {
        color: colores.verdeGrisaceo,
        fontSize: 14,
        lineHeight: 20,
        marginTop: 4,
    },
    nombre: {
        color: colores.textoOscuro,
        fontSize: 18,
        fontWeight: "700",
    },
    email: {
        color: colores.verdeGrisaceo,
        fontSize: 13,
        marginTop: 2,
    },
    rol: {
        color: colores.verdePrincipal,
        fontSize: 12,
        fontWeight: "700",
        marginTop: 4,
        textTransform: "uppercase",
    },
    opciones: {
        borderTopColor: colores.borde,
        borderTopWidth: 1,
        marginTop: 16,
    },
    opcion: {
        alignItems: "center",
        borderBottomColor: colores.borde,
        borderBottomWidth: 1,
        flexDirection: "row",
        gap: 12,
        paddingVertical: 16,
    },
    opcionTexto: {
        color: colores.textoOscuro,
        flex: 1,
        fontSize: 16,
        fontWeight: "500",
    },
    cerrarSesion: {
        alignItems: "center",
        flexDirection: "row",
        gap: 12,
        paddingVertical: 16,
    },
    cerrarSesionTexto: {
        color: colores.magentaPrincipal,
        fontSize: 16,
        fontWeight: "700",
    },
});
