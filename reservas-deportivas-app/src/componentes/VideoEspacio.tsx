import {useCallback} from 'react';
import { useFocusEffect} from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View, Text } from "react-native";
import { colores } from "../constantes/colores";

interface VideoEspacioProps {
    url: string | null;
}

export function VideoEspacio({ url }: VideoEspacioProps) {
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
            contentFit='cover'
            fullscreenOptions={{enable:true}}
        />
    );
}

const estilos = StyleSheet.create({
    video: {
        aspectRatio: 16 / 9,
        borderRadius: 10,
        overflow: 'hidden',
        width: '100%',
    },
    sinVideo: {
        alignItems: 'center',
        borderRadius: 10,
        justifyContent: 'center',
        paddingVertical: 24,
        width: '100%',
    },
    textoSinVideo: {
        color: colores.verdeGrisaceo,
        fontSize: 16,
        textAlign: 'center',
    },
});