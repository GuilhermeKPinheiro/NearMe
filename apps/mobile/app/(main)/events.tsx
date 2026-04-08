import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image, Share, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { Card } from '@/components/card';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { getErrorMessage } from '@/services/http';
import { getCurrentDeviceLocation } from '@/services/location';
import {
  confirmVenueEntry,
  endVenue,
  listInviteOnlyVenues,
  listMyVenues,
  listPublicVenues,
} from '@/services/venues';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';
import type { Venue } from '@/types/domain';

type EventTab = 'mine' | 'public' | 'private';

export default function EventsScreen() {
  const router = useRouter();
  const qrRef = useRef<View | null>(null);
  const { isVisible, activeVenue, setVisible, leaveVenue, refreshDashboard } = useSession();
  const [tab, setTab] = useState<EventTab>('mine');
  const [myVenues, setMyVenues] = useState<Venue[]>([]);
  const [publicVenues, setPublicVenues] = useState<Venue[]>([]);
  const [privateVenues, setPrivateVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [message, setMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const loadAll = useCallback(async () => {
    const [mine, publicList, privateList] = await Promise.all([
      listMyVenues(),
      listPublicVenues(),
      listInviteOnlyVenues(),
    ]);
    setMyVenues(mine);
    setPublicVenues(publicList);
    setPrivateVenues(privateList);
    if (selectedVenue) {
      const refreshed = [...mine, ...publicList, ...privateList].find((item) => item.id === selectedVenue.id) ?? selectedVenue;
      setSelectedVenue(refreshed);
    }
  }, [selectedVenue]);

  useEffect(() => {
    loadAll().catch((nextError) => setMessage(getErrorMessage(nextError)));
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      void loadAll();
    }, [loadAll])
  );

  const displayedVenues = tab === 'mine' ? myVenues : tab === 'public' ? publicVenues : privateVenues;

  const enterVenue = async (venue: Venue) => {
    try {
      setIsBusy(true);
      setMessage('');

      if (!isVisible) {
        const location = await getCurrentDeviceLocation();
        await setVisible(true, location);
      }

      await confirmVenueEntry(venue.id);
      await refreshDashboard();
      await loadAll();
      setSelectedVenue(venue);
    } catch (nextError) {
      setMessage(getErrorMessage(nextError));
    } finally {
      setIsBusy(false);
    }
  };

  const shareQr = async () => {
    if (!qrRef.current || !selectedVenue) {
      return;
    }

    try {
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `QR de ${selectedVenue.name}`,
        });
        return;
      }

      await Share.share({
        url: uri,
        message: `QR oficial de ${selectedVenue.name} - codigo ${selectedVenue.joinCode}`,
      });
    } catch (nextError) {
      setMessage(getErrorMessage(nextError));
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: 18 }}>
        <View style={{ gap: 6 }}>
          <AppText variant="eyebrow">Eventos</AppText>
          <AppText variant="title">Operacao dos seus Locais.</AppText>
          <AppText variant="bodyMuted">
            Separe o que e seu, o que e publico e o que e privado por convite. QR, entrada, saida e gerenciamento ficam aqui.
          </AppText>
        </View>

        <Card style={{ padding: 20 }}>
          {activeVenue ? (
            <View style={{ gap: 12 }}>
              {activeVenue.coverImageUrl ? (
                <Image source={{ uri: activeVenue.coverImageUrl }} style={{ width: '100%', height: 190, borderRadius: 24 }} />
              ) : null}
              <AppText variant="sectionTitle">{activeVenue.name}</AppText>
              <AppText variant="bodyMuted">
                {activeVenue.city}
                {activeVenue.locationLabel ? ` | ${activeVenue.locationLabel}` : ''} | codigo {activeVenue.joinCode}
              </AppText>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton title="Ver QR" compact onPress={() => setSelectedVenue(activeVenue)} />
                </View>
                <View style={{ flex: 1 }}>
                  <SecondaryButton
                    title="Sair do Local"
                    compact
                    onPress={() => {
                      leaveVenue()
                        .then(() => refreshDashboard())
                        .catch((nextError) => setMessage(getErrorMessage(nextError)));
                    }}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <AppText variant="sectionTitle">Nenhum Local ativo</AppText>
              <AppText variant="bodyMuted">Entre em um Evento/Local por QR, codigo ou lista.</AppText>
            </View>
          )}
        </Card>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            {tab === 'mine' ? (
              <PrimaryButton title="Meus eventos" compact onPress={() => undefined} />
            ) : (
              <SecondaryButton title="Meus eventos" compact onPress={() => setTab('mine')} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            {tab === 'public' ? (
              <PrimaryButton title="Publicos" compact onPress={() => undefined} />
            ) : (
              <SecondaryButton title="Publicos" compact onPress={() => setTab('public')} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            {tab === 'private' ? (
              <PrimaryButton title="Privados" compact onPress={() => undefined} />
            ) : (
              <SecondaryButton title="Privados" compact onPress={() => setTab('private')} />
            )}
          </View>
        </View>

        <SecondaryButton title="Entrar por codigo ou QR" onPress={() => router.push('/venue-entry')} />

        {tab === 'mine' ? (
          <PrimaryButton title="Criar Evento/Local" onPress={() => router.push('/event-editor')} />
        ) : null}

        {displayedVenues.map((venue) => (
          <Card key={venue.id} style={{ padding: 18 }}>
            {venue.coverImageUrl ? (
              <Image source={{ uri: venue.coverImageUrl }} style={{ width: '100%', height: 180, borderRadius: 22 }} />
            ) : null}
            <View style={{ gap: 6 }}>
              <AppText variant="sectionTitle">{venue.name}</AppText>
              {venue.description ? <AppText variant="bodyMuted">{venue.description}</AppText> : null}
              <AppText variant="bodyMuted">
                {venue.city}
                {venue.locationLabel ? ` | ${venue.locationLabel}` : ''} | {venue.privacy === 'PUBLIC' ? 'Publico' : 'Privado por convite'}
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <SecondaryButton title="QR" compact onPress={() => setSelectedVenue(venue)} />
              </View>
              <View style={{ flex: 1 }}>
                <PrimaryButton title="Entrar" compact disabled={isBusy} onPress={() => void enterVenue(venue)} />
              </View>
            </View>
            {tab === 'mine' ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <SecondaryButton title="Editar" compact onPress={() => router.push({ pathname: '/event-editor', params: { venueId: venue.id } })} />
                </View>
                <View style={{ flex: 1 }}>
                  <SecondaryButton
                    title="Encerrar"
                    compact
                    onPress={() => {
                      endVenue(venue.id)
                        .then(async () => {
                          await loadAll();
                          if (activeVenue?.id === venue.id) {
                            await refreshDashboard();
                          }
                        })
                        .catch((nextError) => setMessage(getErrorMessage(nextError)));
                    }}
                  />
                </View>
              </View>
            ) : null}
          </Card>
        ))}

        {selectedVenue ? (
          <Card style={{ padding: 20 }}>
            <View ref={qrRef} collapsable={false} style={{ gap: 12, backgroundColor: colors.surface, padding: 16, borderRadius: 24 }}>
              <AppText variant="sectionTitle">{selectedVenue.name}</AppText>
              <AppText variant="bodyMuted">
                {selectedVenue.city}
                {selectedVenue.locationLabel ? ` | ${selectedVenue.locationLabel}` : ''}
              </AppText>
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <QRCode value={selectedVenue.entryUrl ?? `nearme://entry/${selectedVenue.joinCode}`} size={190} backgroundColor={colors.text} color={colors.background} />
              </View>
              <AppText variant="bodyMuted">Codigo {selectedVenue.joinCode}</AppText>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton title="Compartilhar QR" onPress={() => void shareQr()} />
              </View>
              <View style={{ flex: 1 }}>
                <SecondaryButton title="Entrar neste Local" onPress={() => void enterVenue(selectedVenue)} />
              </View>
            </View>
          </Card>
        ) : null}

        {displayedVenues.length === 0 ? (
          <Card>
            <AppText variant="bodyMuted">
              {tab === 'mine'
                ? 'Voce ainda nao criou nenhum Evento/Local.'
                : tab === 'public'
                  ? 'Nenhum Evento publico ativo agora.'
                  : 'Nenhum Local privado por convite ativo agora.'}
            </AppText>
          </Card>
        ) : null}

        {message ? <AppText variant="bodyMuted">{message}</AppText> : null}
      </View>
    </Screen>
  );
}
