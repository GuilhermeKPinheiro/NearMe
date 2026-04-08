import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { TextInput, View } from 'react-native';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { Card } from '@/components/card';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { getErrorMessage } from '@/services/http';
import { getCurrentDeviceLocation } from '@/services/location';
import { confirmVenueEntry, listActiveVenues, resolveVenueEntry } from '@/services/venues';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';
import type { Venue } from '@/types/domain';

export default function VenueEntryScreen() {
  const router = useRouter();
  const { isVisible, setVisible, refreshDashboard } = useSession();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [entryCode, setEntryCode] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanEnabled, setScanEnabled] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  useEffect(() => {
    listActiveVenues()
      .then(setVenues)
      .catch((nextError) => setMessage(getErrorMessage(nextError)));
  }, []);

  const confirmEntry = async (venue: Venue) => {
    try {
      setIsLoading(true);
      setMessage('');

      if (!isVisible) {
        const location = await getCurrentDeviceLocation();
        await setVisible(true, location);
      }

      await confirmVenueEntry(venue.id);
      await refreshDashboard();
      router.back();
    } catch (nextError) {
      setMessage(getErrorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 6 }}>
          <AppText variant="eyebrow">Entrada manual</AppText>
          <AppText variant="title">Confirmar Local ou Evento.</AppText>
          <AppText variant="bodyMuted">
            Escolha um local ativo, informe o codigo de entrada ou leia o QR para confirmar sua presença.
          </AppText>
        </View>

        <Card>
          <View style={{ gap: 10 }}>
            <AppText variant="sectionTitle">Codigo ou QR</AppText>
            <TextInput
              value={entryCode}
              onChangeText={setEntryCode}
              placeholder="Ex: VAULTSP"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              style={{
                backgroundColor: colors.surfaceAlt,
                color: colors.text,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 14,
                fontSize: 16
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  title={isLoading ? 'Validando...' : 'Validar codigo'}
                  disabled={isLoading || !entryCode.trim()}
                  onPress={() => {
                    setIsLoading(true);
                    resolveVenueEntry(entryCode)
                      .then((venue) => {
                        setSelectedVenue(venue);
                        setScanEnabled(false);
                      })
                      .catch((nextError) => setMessage(getErrorMessage(nextError)))
                      .finally(() => setIsLoading(false));
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <SecondaryButton
                  title={scanEnabled ? 'Fechar QR' : 'Ler QR'}
                  onPress={async () => {
                    if (scanEnabled) {
                      setScanEnabled(false);
                      return;
                    }

                    if (!cameraPermission?.granted) {
                      const result = await requestCameraPermission();
                      if (!result.granted) {
                        setMessage('Permita acesso a camera para ler o QR.');
                        return;
                      }
                    }

                    setScanEnabled(true);
                  }}
                />
              </View>
            </View>
            {scanEnabled ? (
              <View style={{ overflow: 'hidden', borderRadius: 24 }}>
                <CameraView
                  style={{ height: 320 }}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={({ data }) => {
                    if (isLoading) {
                      return;
                    }

                    setIsLoading(true);
                    resolveVenueEntry(data)
                      .then((venue) => {
                        setSelectedVenue(venue);
                        setEntryCode(venue.joinCode);
                        setScanEnabled(false);
                      })
                      .catch((nextError) => setMessage(getErrorMessage(nextError)))
                      .finally(() => setIsLoading(false));
                  }}
                />
              </View>
            ) : null}
          </View>
        </Card>

        <Card>
          <AppText variant="sectionTitle">Locais e Eventos ativos</AppText>
          {venues.map((venue) => (
            <View key={venue.id} style={{ gap: 8 }}>
              <AppText variant="body">{venue.name}</AppText>
              <AppText variant="bodyMuted">
                {venue.city} | codigo {venue.joinCode} | area {venue.radiusMeters} m
              </AppText>
              <SecondaryButton title="Selecionar" compact onPress={() => setSelectedVenue(venue)} />
            </View>
          ))}
          {venues.length === 0 ? <AppText variant="bodyMuted">Nenhum local ou evento ativo.</AppText> : null}
        </Card>

        {selectedVenue ? (
          <Card>
            <AppText variant="sectionTitle">Confirmacao de entrada</AppText>
            <AppText variant="body">Voce vai vincular seu radar a {selectedVenue.name}.</AppText>
            <AppText variant="bodyMuted">
              O app vai priorizar pessoas detectadas no mesmo Local ou Evento enquanto sua sessao estiver ativa.
            </AppText>
            <PrimaryButton
              title={isLoading ? 'Confirmando...' : 'Confirmar entrada'}
              disabled={isLoading}
              onPress={() => {
                void confirmEntry(selectedVenue);
              }}
            />
          </Card>
        ) : null}

        {message ? <AppText variant="bodyMuted">{message}</AppText> : null}
      </View>
    </Screen>
  );
}
