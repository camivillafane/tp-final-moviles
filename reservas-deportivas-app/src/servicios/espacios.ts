import {espacios_mock} from "../mock/espacios";
import {Espacio} from "../tipos/espacio";

export const getEspacios = async (): Promise<Espacio[]> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(espacios_mock);
        }, 900);
    });
};

export const getEspacioById = async (id: string): Promise<Espacio | null> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const espacio = espacios_mock.find((e) => e.id === id);
            resolve(espacio || null);
        }, 900);
    });
}