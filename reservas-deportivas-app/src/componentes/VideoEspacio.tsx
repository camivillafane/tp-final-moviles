import { useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View, Text } from "react-native";
import { usePaleta } from "@/contextos/Tema";
import type { Paleta } from "@/constantes/colores";

interface VideoEspacioProps {
    url: string | null;
}

export function VideoEspacio({ url }: VideoEspacioProps) {
    const paleta = usePaleta();
    const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

    if (!url) {
        return (
            <View style={estilos.sinVideo}>
                <Text style={estilos.textoSinVideo}>
                    Este espacio todavía no tiene un video.
                </Text>
            </View>
        );
    }

    return <Reproductor url={url} />;
}

function Reproductor({ url }: { url: string }) {
    const paleta = usePaleta();
    const estilos = useMemo(() => crearEstilos(paleta), [paleta]);

    const player = useVideoPlayer(url, (p) => {
        p.loop = false;
    });

    useFocusEffect(
        useCallback(() => {
            return () => {
                player.pause();
            };
        }, [player])
    );

    return (
        <VideoView
            player={player}
            style={estilos.video}
            nativeControls
            contentFit="cover"
            fullscreenOptions={{ enable: true }}
        />
    );
}

const crearEstilos = (paleta: Paleta) =>
    StyleSheet.create({
        video: {
            aspectRatio: 16 / 9,
            backgroundColor: paleta.superficieAlt,
            borderRadius: 10,
            overflow: "hidden",
            width: "100%",
        },
        sinVideo: {
            alignItems: "center",
            backgroundColor: paleta.superficieAlt,
            borderRadius: 10,
            justifyContent: "center",
            paddingVertical: 24,
            width: "100%",
        },
        textoSinVideo: {
            color: paleta.verdeGrisaceo,
            fontSize: 16,
            textAlign: "center",
        },
    });
