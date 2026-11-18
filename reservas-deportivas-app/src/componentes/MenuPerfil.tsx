import { useMemo, type ComponentProps } from "react";
import { Modal, View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter, type Href } from "expo-router";
import IonIcons from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvatarUsuario } from "@/componentes/AvatarUsuario";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";
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
    const paleta = usePaleta();
    const estilos = useMemo(() => crearEstilos(paleta), [paleta]);
    const opciones: OpcionMenu[] = [
        {
            etiqueta: "Configuraciones",
            icono: "settings-outline",
            destino: "/configuraciones" as any,
        },
    ];

    if (__DEV__) {
        opciones.push({
            etiqueta: "Probar notificaciones",
            icono: "notifications-outline",
            destino: "/prueba-notificaciones" as any,
        });
    }

    if (!usuario) {
        opciones.push(
            {
                etiqueta: "Iniciar sesión",
                icono: "log-in-outline",
                destino: "/login" as any
            },
            {
                etiqueta: "Crear cuenta",
                icono: "person-add-outline",
                destino: "/registro" as any
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
                    destino: "/mis-reservas",
                },
                {
                    etiqueta: "Mis favoritos",
                    icono: "heart-outline",
                    destino: "/favoritos",
                }
            );
        } else {
            opciones.push({
                etiqueta: "Agenda diaria",
                icono: "today-outline",
                destino: "/agenda-diaria" as any,
            });

            opciones.push({
                etiqueta: "Administración de turnos",
                icono: "time-outline",
                destino: "/administracion-turnos" as any,
            });

            if (usuario.rol === "administrador") {
                opciones.push({
                    etiqueta: "Gestión de espacios",
                    icono: "business-outline",
                    destino: "/administracion-espacios" as any,
                });
            }

            if (usuario.rol === "encargado") {
                opciones.push(
                    {
                        etiqueta: "Gestión de turnos",
                        icono: "clipboard-outline",
                        destino: "/gestion-turnos" as any,
                    },
                    {
                        etiqueta: "Escanear QR",
                        icono: "qr-code-outline",
                        destino: "/escanear-qr" as any,
                    }
                );
            }
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
                                    color={paleta.verdePrincipal}
                                />
                                <Text style={estilos.opcionTexto}>{opcion.etiqueta}</Text>
                                <IonIcons
                                    name="chevron-forward"
                                    size={18}
                                    color={paleta.verdeGrisaceo}
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
                                color={paleta.magentaPrincipal}
                            />
                            <Text style={estilos.cerrarSesionTexto}>Cerrar sesión</Text>
                        </Pressable>
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const crearEstilos = (paleta: Paleta) =>
    StyleSheet.create({
        fondo: {
            backgroundColor: paleta.overlay,
            flex: 1,
            justifyContent: "flex-end",
        },
        hoja: {
            backgroundColor: paleta.superficie,
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
            color: paleta.textoOscuro,
            fontSize: 20,
            fontWeight: "700",
        },
        descripcion: {
            color: paleta.verdeGrisaceo,
            fontSize: 14,
            lineHeight: 20,
            marginTop: 4,
        },
        nombre: {
            color: paleta.textoOscuro,
            fontSize: 18,
            fontWeight: "700",
        },
        email: {
            color: paleta.verdeGrisaceo,
            fontSize: 13,
            marginTop: 2,
        },
        rol: {
            color: paleta.verdePrincipal,
            fontSize: 12,
            fontWeight: "700",
            marginTop: 4,
            textTransform: "uppercase",
        },
        opciones: {
            borderTopColor: paleta.bordeSuave,
            borderTopWidth: 1,
            marginTop: 16,
        },
        opcion: {
            alignItems: "center",
            borderBottomColor: paleta.bordeSuave,
            borderBottomWidth: 1,
            flexDirection: "row",
            gap: 12,
            paddingVertical: 16,
        },
        opcionTexto: {
            color: paleta.textoOscuro,
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
            color: paleta.magentaPrincipal,
            fontSize: 16,
            fontWeight: "700",
        },
    });
