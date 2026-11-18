import * as Network from "expo-network";

export async function estaSinConexion(): Promise<boolean> {
    try {
        const estado = await Network.getNetworkStateAsync();

        return(
            estado.isConnected === false ||
            estado.isInternetReachable === false
        );
    } catch {
        return false;
    }
}