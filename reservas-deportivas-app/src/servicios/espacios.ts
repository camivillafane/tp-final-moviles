import {espaciosMock} from "@/mocks/espacios";
import {Espacio} from "@/tipos/espacio";

export const getEspacios = async (): Promise<Espacio[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(espaciosMock);
        }, 900);
    });
};

export const getEspacioById = async (id: string): Promise<Espacio | null> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const espacio = espaciosMock.find((e) => e.id === id);
            resolve(espacio || null);
        }, 900);
    });
}