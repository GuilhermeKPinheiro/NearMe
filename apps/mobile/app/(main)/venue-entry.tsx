import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { AppText } from '@/components/text';
import { getErrorMessage } from '@/services/http';
import { getCurrentDeviceLocation } from '@/services/location';
import { confirmVenueEntry, listActiveVenues, resolveVenueEntry } from '@/services/venues';
import { useSession } from '@/state/session';
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
      <View style={{ gap: 18 }}>
        <SectionHeader
          eyebrow="Entrada manual"
          title="Confirmar Local ou Evento."
          description="Escolha um Local ativo, informe o código ou leia o QR para vincular seu radar ao contexto certo."
        />

        <Card style={{ padding: 18 }}>
          <SectionHeader
            eyebrow="Código ou QR"
            title="Validar entrada."
            description="Você pode colar o código de convite ou abrir a câmera para ler o QR oficial."
          />
          <Input
            label="Código de entrada"
            value={entryCode}
            onChangeText={setEntryCode}
            placeholder="Ex: VAULTSP"
            autoCapitalize="characters"
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title={isLoading ? 'Validando...' : 'Validar código'}
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
                      setMessage('Permita acesso à câmera para ler o QR.');
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
        </Card>

        <Card tone="soft" style={{ padding: 18 }}>
          <SectionHeader
            eyebrow="Locais ativos"
            title="Selecione da lista."
            description="Use a lista quando você já sabe onde está e quer confirmar rapidamente."
          />
          <View style={{ gap: 12 }}>
            {venues.map((venue, index, items) => (
              <View
                key={venue.id}
                style={{
                  gap: 8,
                  paddingBottom: index < items.length - 1 ? 12 : 0,
                  borderBottomWidth: index < items.length - 1 ? 1 : 0,
                  borderBottomColor: '#25302b',
                }}
              >
                <AppText variant="body">{venue.name}</AppText>
                <AppText variant="bodyMuted">
                  {venue.city}
                  {venue.locationLabel ? ` | ${venue.locationLabel}` : ''} | código {venue.joinCode} | área {venue.radiusMeters} m
                </AppText>
                <SecondaryButton title="Selecionar" compact onPress={() => setSelectedVenue(venue)} />
              </View>
            ))}
          </View>
          {venues.length === 0 ? <AppText variant="bodyMuted">Nenhum Local ou Evento ativo.</AppText> : null}
        </Card>

        {selectedVenue ? (
          <Card style={{ padding: 18 }}>
            <SectionHeader
              eyebrow="Confirmação"
              title={`Entrar em ${selectedVenue.name}`}
              description="Seu radar será vinculado a este Local e o app vai priorizar pessoas detectadas no mesmo contexto."
            />
            <View
              style={{
                borderRadius: 22,
                backgroundColor: '#202724',
                padding: 16,
                gap: 6,
              }}
            >
              <AppText variant="body">{selectedVenue.city}</AppText>
              <AppText variant="bodyMuted">
                {selectedVenue.locationLabel ? `${selectedVenue.locationLabel} | ` : ''}código {selectedVenue.joinCode}
              </AppText>
            </View>
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
