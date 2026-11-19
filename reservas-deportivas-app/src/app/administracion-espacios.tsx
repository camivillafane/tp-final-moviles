import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import IonIcons from "@react-native-vector-icons/ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";
import { useSesion } from "@/contextos/Sesion";
import {
  cambiarPrecioEspacio,
  listarEspaciosAdministracion,
} from "@/servicios/administracionEspacios";
import {
  subirArchivo,
  tamanoDeArchivo,
  validarArchivoSeleccionado,
  type ArchivoSeleccionado,
  type TipoArchivoSeleccionado,
} from "@/servicios/archivos";
import {
  eliminarMedioEspacio,
  guardarMedioEspacio,
  listarMediosPorEspacio,
} from "@/servicios/mediosEspacios";
import type { Espacio } from "@/tipos/espacio";
import type { MedioEspacio } from "@/tipos/medioEspacio";

interface MedioPendiente {
  id: string;
  tipo: TipoArchivoSeleccionado;
  archivo: ArchivoSeleccionado;
  uri: string;
}

const formatoPesos = (valor: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(valor);

export default function AdministracionEspaciosPantalla() {
  const router = useRouter();
  const { usuario, cargando: cargandoSesion } = useSesion();
  const paleta = usePaleta();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [preciosEditados, setPreciosEditados] = useState<Record<string, string>>({});
  const [medios, setMedios] = useState<Record<string, MedioEspacio[]>>({});
  const [pendientes, setPendientes] = useState<Record<string, MedioPendiente[]>>({});
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState<string | null>(null);
  const [subiendoId, setSubiendoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargarEspacios = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resultado = await listarEspaciosAdministracion();
      setEspacios(resultado.filter((espacio) => espacio.activo));
      setPreciosEditados({});

      try {
        setMedios(await listarMediosPorEspacio());
      } catch {
        setMedios({});
      }
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? fallo.message
          : "No se pudieron cargar los espacios. Intentá nuevamente."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!cargandoSesion && usuario?.rol === "administrador") {
        void cargarEspacios();
      }
    }, [cargandoSesion, usuario, cargarEspacios])
  );

  const guardarPrecio = async (espacio: Espacio) => {
    const textoPrecio = preciosEditados[espacio.id] ?? String(espacio.precioPorHora);
    const precio = Number(textoPrecio);

    if (!Number.isInteger(precio) || precio <= 0 || precio > 100_000_000) {
      Alert.alert("Precio inválido", "Ingresá un precio entero mayor que cero.");
      return;
    }

    setGuardandoId(espacio.id);
    try {
      const actualizado = await cambiarPrecioEspacio(espacio.id, precio);
      setEspacios((actuales) =>
        actuales.map((item) => (item.id === actualizado.id ? actualizado : item))
      );
      setPreciosEditados((actuales) => {
        const siguientes = { ...actuales };
        delete siguientes[espacio.id];
        return siguientes;
      });
      Alert.alert("Precio actualizado", `${actualizado.nombre}: ${formatoPesos(actualizado.precioPorHora)} por hora.`);
    } catch (fallo) {
      Alert.alert(
        "No se pudo guardar",
        fallo instanceof Error ? fallo.message : "Intentá nuevamente."
      );
    } finally {
      setGuardandoId(null);
    }
  };

  const refrescarMedios = async () => {
    try {
      setMedios(await listarMediosPorEspacio());
    } catch {
    }
  };

  const encolarMedios = (
    espacio: Espacio,
    assets: ImagePicker.ImagePickerAsset[],
    tipo: TipoArchivoSeleccionado
  ) => {
    const extension = tipo === "video" ? ".mp4" : ".jpg";

    const nuevos: MedioPendiente[] = [];
    const rechazados: string[] = [];

    for (const asset of assets) {
      const nombre = asset.fileName?.trim();
      const archivo: ArchivoSeleccionado = {
        uri: asset.uri,
        nombre: nombre
          ? nombre.includes(".")
            ? nombre
            : `${nombre}${extension}`
          : `${tipo}-${Date.now()}-${nuevos.length}${extension}`,
        mimeType: asset.mimeType ?? "",
        tamano: tamanoDeArchivo(asset.uri, asset.fileSize),
      };

      const problema = validarArchivoSeleccionado(archivo, tipo);

      if (problema) {
        rechazados.push(problema);
      } else {
        nuevos.push({
          id: Crypto.randomUUID(),
          tipo,
          archivo,
          uri: asset.uri,
        });
      }
    }

    if (nuevos.length > 0) {
      setPendientes((actuales) => ({
        ...actuales,
        [espacio.id]: [...(actuales[espacio.id] ?? []), ...nuevos],
      }));
    }

    if (rechazados.length > 0) {
      Alert.alert("Algunos archivos no se agregaron", rechazados.join("\n"));
    }
  };

  const quitarPendiente = (espacioId: string, pendienteId: string) => {
    setPendientes((actuales) => ({
      ...actuales,
      [espacioId]: (actuales[espacioId] ?? []).filter(
        (item) => item.id !== pendienteId
      ),
    }));
  };

  const guardarPendientes = async (espacio: Espacio) => {
    const lista = pendientes[espacio.id] ?? [];

    if (lista.length === 0) return;

    setSubiendoId(espacio.id);

    const fallidos: MedioPendiente[] = [];
    const errores: string[] = [];

    try {
      for (const pendiente of lista) {
        try {
          const subido = await subirArchivo(pendiente.archivo);
          await guardarMedioEspacio(espacio.id, subido, pendiente.archivo.nombre);
        } catch (fallo) {
          fallidos.push(pendiente);
          errores.push(
            `${pendiente.archivo.nombre}: ${
              fallo instanceof Error ? fallo.message : "no se pudo subir."
            }`
          );
        }
      }
    } finally {
      setPendientes((actuales) => ({ ...actuales, [espacio.id]: fallidos }));
      await refrescarMedios();
      setSubiendoId(null);
    }

    if (errores.length > 0) {
      Alert.alert("Algunos archivos no se subieron", errores.join("\n"));
    }
  };

  const elegirMedios = async (
    espacio: Espacio,
    tipo: TipoArchivoSeleccionado
  ) => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          "Permiso necesario",
          "Necesitamos acceso a tus fotos y videos para agregar los archivos del espacio."
        );
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: tipo === "imagen" ? ["images"] : ["videos"],
        allowsMultipleSelection: tipo === "imagen",
        selectionLimit: tipo === "imagen" ? 10 : 1,
        quality: 1,
      });

      if (resultado.canceled) return;

      encolarMedios(espacio, resultado.assets, tipo);
    } catch (fallo) {
      Alert.alert(
        "No se pudo abrir la galería",
        fallo instanceof Error ? fallo.message : "Intentá nuevamente."
      );
    }
  };

  const quitarMedio = (espacio: Espacio, medio: MedioEspacio) => {
    Alert.alert(
      medio.tipo === "video" ? "Quitar video" : "Quitar foto",
      "Se va a quitar de este dispositivo. El archivo ya subido queda en el servidor.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await eliminarMedioEspacio(medio);
                setMedios((actuales) => ({
                  ...actuales,
                  [espacio.id]: (actuales[espacio.id] ?? []).filter(
                    (item) => item.id !== medio.id
                  ),
                }));
              } catch (fallo) {
                Alert.alert(
                  "No se pudo quitar",
                  fallo instanceof Error ? fallo.message : "Intentá nuevamente."
                );
              }
            })();
          },
        },
      ]
    );
  };

  if (cargandoSesion) {
    return <VistaMensaje mensaje="Verificando la sesión..." />;
  }

  if (!usuario || usuario.rol !== "administrador") {
    return (
      <VistaMensaje
        mensaje="Solo una cuenta administradora puede gestionar los precios."
        volver={() => router.replace("/")}
      />
    );
  }

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <View style={estilos.encabezado}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <IonIcons name="arrow-back" size={24} color={paleta.verdePrincipal} />
        </Pressable>
        <Text style={estilos.titulo}>Gestión de espacios</Text>
        <Pressable
          onPress={cargarEspacios}
          accessibilityRole="button"
          accessibilityLabel="Actualizar espacios"
        >
          <IonIcons name="refresh-outline" size={23} color={paleta.verdePrincipal} />
        </Pressable>
      </View>

      <Text style={estilos.descripcion}>
        Actualizá el precio por hora, las fotos y el video de los espacios municipales.
      </Text>

      {cargando ? (
        <View style={estilos.centro}>
          <ActivityIndicator color={paleta.verdePrincipal} size="large" />
          <Text style={estilos.textoSecundario}>Cargando espacios...</Text>
        </View>
      ) : error ? (
        <View style={estilos.centro}>
          <Text style={estilos.error}>{error}</Text>
          <Pressable style={estilos.botonReintentar} onPress={cargarEspacios}>
            <Text style={estilos.textoBoton}>Reintentar</Text>
          </Pressable>
        </View>
      ) : espacios.length === 0 ? (
        <View style={estilos.centro}>
          <Text style={estilos.textoSecundario}>No hay espacios activos.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={estilos.lista}
          keyboardShouldPersistTaps="handled"
        >
          {espacios.map((espacio) => {
            const precio = preciosEditados[espacio.id] ?? String(espacio.precioPorHora);
            const guardando = guardandoId === espacio.id;
            const subiendo = subiendoId === espacio.id;
            const mediosEspacio = medios[espacio.id] ?? [];
            const pendientesEspacio = pendientes[espacio.id] ?? [];
            return (
              <View key={espacio.id} style={estilos.tarjeta}>
                <Text style={estilos.nombre}>{espacio.nombre}</Text>
                <Text style={estilos.complejo}>{espacio.complejo}</Text>
                <Text style={estilos.dato}>Superficie: {espacio.superficie}</Text>

                <Text style={estilos.etiquetaPrecio}>Precio por hora</Text>
                <View style={estilos.filaPrecio}>
                  <Text style={estilos.simboloPesos}>$</Text>
                  <TextInput
                    value={precio}
                    onChangeText={(valor) =>
                      setPreciosEditados((actuales) => ({
                        ...actuales,
                        [espacio.id]: valor.replace(/\D/g, ""),
                      }))
                    }
                    editable={!guardando}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={9}
                    accessibilityLabel={`Precio por hora de ${espacio.nombre}`}
                    style={estilos.entradaPrecio}
                  />
                  <Pressable
                    style={[estilos.botonGuardar, guardando && estilos.botonDeshabilitado]}
                    onPress={() => void guardarPrecio(espacio)}
                    disabled={guardando}
                    accessibilityRole="button"
                  >
                    {guardando ? (
                      <ActivityIndicator color={paleta.textoInvertido} />
                    ) : (
                      <Text style={estilos.textoBoton}>Guardar</Text>
                    )}
                  </Pressable>
                </View>
                <Text style={estilos.precioActual}>
                  Actual: {formatoPesos(espacio.precioPorHora)} por hora
                </Text>

                <Text style={estilos.etiquetaPrecio}>Fotos y video</Text>
                <Text style={estilos.ayudaMedios}>
                  Elegí los archivos y confirmá con “Guardar multimedia”. Un solo video
                  por espacio: el nuevo reemplaza al anterior.
                </Text>

                {mediosEspacio.length > 0 && (
                  <View style={estilos.filaMedios}>
                    {mediosEspacio.map((medio) => (
                      <View key={medio.id} style={estilos.medio}>
                        {medio.tipo === "imagen" ? (
                          <Image
                            source={{ uri: medio.rutaLocal ?? medio.url }}
                            style={estilos.miniatura}
                            resizeMode="cover"
                            accessibilityLabel={`Foto del espacio ${espacio.nombre}`}
                          />
                        ) : (
                          <View style={[estilos.miniatura, estilos.miniaturaVideo]}>
                            <IonIcons
                              name="videocam-outline"
                              size={22}
                              color={paleta.textoInvertido}
                            />
                          </View>
                        )}
                        <Pressable
                          style={estilos.quitarMedio}
                          onPress={() => quitarMedio(espacio, medio)}
                          accessibilityRole="button"
                          accessibilityLabel={`Quitar ${medio.tipo === "video" ? "video" : "foto"}`}
                        >
                          <IonIcons name="close" size={13} color={paleta.textoInvertido} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                {mediosEspacio.length === 0 && (
                  <Text style={estilos.precioActual}>
                    Todavía no agregaste fotos ni video.
                  </Text>
                )}

                {pendientesEspacio.length > 0 && (
                  <View style={estilos.bloquePendientes}>
                    <Text style={estilos.tituloPendientes}>
                      Pendientes de guardar ({pendientesEspacio.length})
                    </Text>

                    <View style={estilos.filaMedios}>
                      {pendientesEspacio.map((pendiente) => (
                        <View key={pendiente.id} style={estilos.medio}>
                          {pendiente.tipo === "imagen" ? (
                            <Image
                              source={{ uri: pendiente.uri }}
                              style={[estilos.miniatura, estilos.miniaturaPendiente]}
                              resizeMode="cover"
                              accessibilityLabel={`Foto pendiente del espacio ${espacio.nombre}`}
                            />
                          ) : (
                            <View
                              style={[
                                estilos.miniatura,
                                estilos.miniaturaVideo,
                                estilos.miniaturaPendiente,
                              ]}
                            >
                              <IonIcons
                                name="videocam-outline"
                                size={22}
                                color={paleta.textoInvertido}
                              />
                            </View>
                          )}
                          <Pressable
                            style={estilos.quitarMedio}
                            onPress={() => quitarPendiente(espacio.id, pendiente.id)}
                            disabled={subiendo}
                            accessibilityRole="button"
                            accessibilityLabel={`Quitar ${
                              pendiente.tipo === "video" ? "video" : "foto"
                            } pendiente`}
                          >
                            <IonIcons
                              name="close"
                              size={13}
                              color={paleta.textoInvertido}
                            />
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={estilos.filaBotonesMedios}>
                  <Pressable
                    style={[estilos.botonMedio, subiendo && estilos.botonDeshabilitado]}
                    onPress={() => void elegirMedios(espacio, "imagen")}
                    disabled={subiendo}
                    accessibilityRole="button"
                  >
                    <IonIcons name="images-outline" size={18} color={paleta.verdePrincipal} />
                    <Text style={estilos.textoBotonMedio}>Agregar fotos</Text>
                  </Pressable>
                  <Pressable
                    style={[estilos.botonMedio, subiendo && estilos.botonDeshabilitado]}
                    onPress={() => void elegirMedios(espacio, "video")}
                    disabled={subiendo}
                    accessibilityRole="button"
                  >
                    <IonIcons name="videocam-outline" size={18} color={paleta.verdePrincipal} />
                    <Text style={estilos.textoBotonMedio}>Agregar video</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={[
                    estilos.botonGuardarMultimedia,
                    (subiendo || pendientesEspacio.length === 0) &&
                      estilos.botonDeshabilitado,
                  ]}
                  onPress={() => void guardarPendientes(espacio)}
                  disabled={subiendo || pendientesEspacio.length === 0}
                  accessibilityRole="button"
                  accessibilityLabel={`Guardar multimedia de ${espacio.nombre}`}
                >
                  {subiendo ? (
                    <ActivityIndicator color={paleta.textoInvertido} size="small" />
                  ) : (
                    <IonIcons
                      name="cloud-upload-outline"
                      size={18}
                      color={paleta.textoInvertido}
                    />
                  )}
                  <Text style={estilos.textoBotonGuardarMultimedia}>
                    {subiendo ? "Subiendo archivos..." : "Guardar multimedia"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function VistaMensaje({ mensaje, volver }: { mensaje: string; volver?: () => void }) {
  const paleta = usePaleta();
  const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

  return (
    <SafeAreaView style={estilos.contenedor} edges={["top", "bottom"]}>
      <View style={estilos.centro}>
        <Text style={estilos.textoSecundario}>{mensaje}</Text>
        {volver && (
          <Pressable style={estilos.botonReintentar} onPress={volver}>
            <Text style={estilos.textoBoton}>Volver</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const crearEstilos = (paleta: Paleta) =>
  StyleSheet.create({
    contenedor: { backgroundColor: paleta.fondo, flex: 1 },
    encabezado: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 18,
      paddingVertical: 14,
    },
    titulo: { color: paleta.textoOscuro, fontSize: 20, fontWeight: "700" },
    descripcion: {
      color: paleta.verdeGrisaceo,
      fontSize: 14,
      paddingHorizontal: 18,
      paddingBottom: 10,
    },
    lista: { padding: 16, paddingBottom: 32 },
    tarjeta: {
      backgroundColor: paleta.superficie,
      borderColor: paleta.bordeSuave,
      borderWidth: 1,
      borderRadius: 14,
      marginBottom: 14,
      padding: 16,
    },
    nombre: { color: paleta.textoOscuro, fontSize: 17, fontWeight: "700" },
    complejo: { color: paleta.verdeGrisaceo, fontSize: 13, marginTop: 3 },
    dato: { color: paleta.textoOscuro, fontSize: 13, marginTop: 10 },
    etiquetaPrecio: {
      color: paleta.textoOscuro,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 16,
    },
    filaPrecio: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 7 },
    simboloPesos: { color: paleta.textoOscuro, fontSize: 18, fontWeight: "700" },
    entradaPrecio: {
      backgroundColor: paleta.superficieAlt,
      borderColor: paleta.borde,
      borderRadius: 8,
      borderWidth: 1,
      color: paleta.textoOscuro,
      flex: 1,
      fontSize: 16,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    botonGuardar: {
      alignItems: "center",
      backgroundColor: paleta.verdeBoton,
      borderRadius: 8,
      minWidth: 88,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    botonDeshabilitado: { opacity: 0.6 },
    textoBoton: { color: paleta.textoInvertido, fontSize: 14, fontWeight: "700" },
    precioActual: { color: paleta.verdeGrisaceo, fontSize: 12, marginTop: 7 },
    ayudaMedios: { color: paleta.verdeGrisaceo, fontSize: 12, marginTop: 4 },
    filaMedios: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 10,
    },
    medio: { position: "relative" },
    miniatura: {
      backgroundColor: paleta.superficieAlt,
      borderRadius: 8,
      height: 64,
      width: 64,
    },
    miniaturaVideo: {
      alignItems: "center",
      backgroundColor: paleta.verdeBoton,
      justifyContent: "center",
    },
    quitarMedio: {
      alignItems: "center",
      backgroundColor: paleta.magentaBoton,
      borderRadius: 999,
      justifyContent: "center",
      padding: 3,
      position: "absolute",
      right: -6,
      top: -6,
    },
    filaBotonesMedios: { flexDirection: "row", gap: 8, marginTop: 12 },
    botonMedio: {
      alignItems: "center",
      borderColor: paleta.verdePrincipal,
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      flexDirection: "row",
      gap: 6,
      justifyContent: "center",
      paddingHorizontal: 10,
      paddingVertical: 9,
    },
    textoBotonMedio: {
      color: paleta.verdePrincipal,
      fontSize: 13,
      fontWeight: "600",
    },
    bloquePendientes: {
      backgroundColor: paleta.superficieAlt,
      borderColor: paleta.borde,
      borderRadius: 10,
      borderStyle: "dashed",
      borderWidth: 1,
      marginTop: 12,
      padding: 12,
    },
    tituloPendientes: {
      color: paleta.textoOscuro,
      fontSize: 13,
      fontWeight: "600",
    },
    miniaturaPendiente: {
      borderColor: paleta.verdePrincipal,
      borderStyle: "dashed",
      borderWidth: 1,
    },
    botonGuardarMultimedia: {
      alignItems: "center",
      alignSelf: "stretch",
      backgroundColor: paleta.verdeBoton,
      borderRadius: 8,
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      marginTop: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      width: "100%",
    },
    textoBotonGuardarMultimedia: {
      color: paleta.textoInvertido,
      fontSize: 14,
      fontWeight: "700",
    },
    centro: {
      alignItems: "center",
      flex: 1,
      justifyContent: "center",
      padding: 24,
      gap: 12,
    },
    textoSecundario: {
      color: paleta.verdeGrisaceo,
      fontSize: 15,
      textAlign: "center",
    },
    error: { color: paleta.errorTexto, fontSize: 15, textAlign: "center" },
    botonReintentar: {
      backgroundColor: paleta.verdeBoton,
      borderRadius: 8,
      paddingHorizontal: 18,
      paddingVertical: 11,
    },
  });
