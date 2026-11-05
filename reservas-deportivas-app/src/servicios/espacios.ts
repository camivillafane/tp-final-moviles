import axios from "axios";
import { cliente } from "./cliente";
import { Espacio } from "@/tipos/espacio";
import { espaciosMock } from "@/mocks/espacios";

const USE_MOCKS: boolean = true;

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const getEspacios = async (): Promise<Espacio[]> => {
  if (USE_MOCKS) {
    await esperar(900);
    return espaciosMock;
  }

  const { data } = await cliente.get<Espacio[]>("/espacios");
  return data;
};

export const getEspacioById = async (id: string): Promise<Espacio | null> => {
  if (USE_MOCKS) {
    await esperar(900);
    return espaciosMock.find((e) => e.id === id) ?? null;
  }

  try {
    const { data } = await cliente.get<Espacio>(`/espacios/${id}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};
