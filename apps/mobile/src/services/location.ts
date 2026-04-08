import * as Location from 'expo-location';

export type DeviceLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export async function getCurrentDeviceLocation(): Promise<DeviceLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Permita acesso a localizacao para entrar no radar com distancia real.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracyMeters: position.coords.accuracy ?? undefined,
  };
}
