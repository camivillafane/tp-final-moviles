//import {espaciosMock} from "@/mocks/espacios";
import axios from "axios";
import {cliente} from "@/servicios/cliente";
import {Espacio} from "@/tipos/espacio";

export const getEspacios = async (): Promise<Espacio[]> => {
    const {data} = await cliente.get<Espacio[]>("/espacios");
    return data;
};

export const getEspacioById = async (id: string): Promise<Espacio | null> => {
    try {
        const {data} = await cliente.get<Espacio>(`/espacios/${id}`);
        return data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        throw error;
    }
}

/*export const getEspacios = async (): Promise<Espacio[]> => {
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
}*/