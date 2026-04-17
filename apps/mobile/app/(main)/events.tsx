import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image, Share, View } from 'react-native';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { SegmentedControl } from '@/components/segmented-control';
import { AppText } from '@/components/text';
import { getErrorMessage } from '@/services/http';
import { getCurrentDeviceLocation } from '@/services/location';
import { confirmVenueEntry, endVenue, listInviteOnlyVenues, listMyVenues, listPublicVenues } from '@/services/venues';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';
import type { Venue } from '@/types/domain';

type EventTab = 'mine' | 'public' | 'private';

function VenueListItem({
  venue,
  selected,
  onSelect,
  onEnter,
  onEdit,
  onEnd,
  showOwnerActions,
  isBusy,
}: {
  venue: Venue;
  selected: boolean;
  onSelect: () => void;
  onEnter: () => void;
  onEdit?: () => void;
  onEnd?: () => void;
  showOwnerActions?: boolean;
  isBusy: boolean;
}) {
  return (
    <Card tone="soft" style={{ padding: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        {venue.coverImageUrl ? (
          <Image source={{ uri: venue.coverImageUrl }} style={{ width: 92, height: 112, borderRadius: 22 }} />
        ) : (
          <View
            style={{
              width: 92,
              height: 112,
              borderRadius: 22,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 10,
            }}
          >
            <AppText variant="bodyMuted" style={{ textAlign: 'center' }}>
              Sem capa
            </AppText>
          </View>
        )}
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="sectionTitle">{venue.name}</AppText>
              <AppText variant="bodyMuted">
                {venue.city}
                {venue.locationLabel ? ` | ${venue.locationLabel}` : ''}
              </AppText>
            </View>
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: selected ? colors.accentStrong : colors.surface,
              }}
            >
              <AppText variant="bodyMuted" style={{ color: selected ? colors.background : colors.muted }}>
                {venue.privacy === 'PUBLIC' ? 'Público' : 'Convite'}
              </AppText>
            </View>
          </View>
          {venue.description ? (
            <AppText variant="bodyMuted" numberOfLines={3}>
              {venue.description}
            </AppText>
          ) : null}
          <AppText variant="bodyMuted">Raio ativo: {venue.radiusMeters} m</AppText>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <SecondaryButton title={selected ? 'QR selecionado' : 'Ver QR'} compact onPress={onSelect} />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Entrar" compact disabled={isBusy} onPress={onEnter} />
        </View>
      </View>

      {showOwnerActions ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <SecondaryButton title="Editar" compact onPress={onEdit} />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton title="Encerrar" compact onPress={onEnd} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

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
    const [mine, publicList, privateList] = await Promise.all([listMyVenues(), listPublicVenues(), listInviteOnlyVenues()]);
    setMyVenues(mine);
    setPublicVenues(publicList);
    setPrivateVenues(privateList);

    if (selectedVenue) {
      const refreshed = [...mine, ...publicList, ...privateList].find((item) => item.id === selectedVenue.id) ?? null;
      setSelectedVenue(refreshed);
    }
  }, [selectedVenue]);

  useEffect(() => {
    loadAll().catch((nextError) => setMessage(getErrorMessage(nextError)));
  }, [loadAll]);

  useFocusEffect(
    useCallback(() => {
      void loadAll();
    }, [loadAll]),
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
        <SectionHeader
          eyebrow="Eventos"
          title="Entrada, operação e gestão."
          description="Tudo sobre Locais fica aqui: onde você está, onde entrar, seus próprios eventos e o QR oficial."
        />

        <Card style={{ padding: 20 }}>
          {activeVenue ? (
            <View style={{ gap: 14 }}>
              <SectionHeader
                eyebrow="Local ativo"
                title={activeVenue.name}
                description={`${activeVenue.city}${activeVenue.locationLabel ? ` | ${activeVenue.locationLabel}` : ''} | código ${activeVenue.joinCode}`}
              />
              {activeVenue.coverImageUrl ? (
                <Image source={{ uri: activeVenue.coverImageUrl }} style={{ width: '100%', height: 190, borderRadius: 24 }} />
              ) : null}
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
            <View style={{ gap: 12 }}>
              <SectionHeader
                eyebrow="Nenhum Local ativo"
                title="Entre por QR, código ou lista."
                description="Quando você confirma a entrada, o app pode priorizar pessoas do mesmo Local."
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton title="Entrar por QR ou código" onPress={() => router.push('/venue-entry')} />
                </View>
                <View style={{ flex: 1 }}>
                  <SecondaryButton title="Criar novo Local" onPress={() => router.push('/event-editor')} />
                </View>
              </View>
            </View>
          )}
        </Card>

        <SegmentedControl
          options={[
            { label: 'Meus eventos', value: 'mine' as EventTab },
            { label: 'Públicos', value: 'public' as EventTab },
            { label: 'Privados', value: 'private' as EventTab },
          ]}
          selectedValue={tab}
          onChange={setTab}
        />

        <Card tone="soft" style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <SecondaryButton title="Entrar por código ou QR" onPress={() => router.push('/venue-entry')} />
            </View>
            {tab === 'mine' ? (
              <View style={{ flex: 1 }}>
                <PrimaryButton title="Criar Evento/Local" onPress={() => router.push('/event-editor')} />
              </View>
            ) : null}
          </View>
        </Card>

        {displayedVenues.map((venue) => (
          <VenueListItem
            key={venue.id}
            venue={venue}
            selected={selectedVenue?.id === venue.id}
            onSelect={() => setSelectedVenue(venue)}
            onEnter={() => void enterVenue(venue)}
            onEdit={tab === 'mine' ? () => router.push({ pathname: '/event-editor', params: { venueId: venue.id } }) : undefined}
            onEnd={
              tab === 'mine'
                ? () => {
                    endVenue(venue.id)
                      .then(async () => {
                        await loadAll();
                        if (selectedVenue?.id === venue.id) {
                          setSelectedVenue(null);
                        }
                        if (activeVenue?.id === venue.id) {
                          await refreshDashboard();
                        }
                      })
                      .catch((nextError) => setMessage(getErrorMessage(nextError)));
                  }
                : undefined
            }
            showOwnerActions={tab === 'mine'}
            isBusy={isBusy}
          />
        ))}

        {selectedVenue ? (
          <Card style={{ padding: 20 }}>
            <SectionHeader
              eyebrow="QR oficial"
              title={selectedVenue.name}
              description={`${selectedVenue.city}${selectedVenue.locationLabel ? ` | ${selectedVenue.locationLabel}` : ''}`}
            />
            <View ref={qrRef} collapsable={false} style={{ gap: 12, backgroundColor: colors.surfaceAlt, padding: 16, borderRadius: 24 }}>
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <QRCode value={selectedVenue.entryUrl ?? `nearme://entry/${selectedVenue.joinCode}`} size={190} backgroundColor={colors.text} color={colors.background} />
              </View>
              <AppText variant="body">Código {selectedVenue.joinCode}</AppText>
              <AppText variant="bodyMuted">Compartilhe este QR para entrada rápida no Local.</AppText>
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
          <Card tone="soft">
            <AppText variant="sectionTitle">
              {tab === 'mine'
                ? 'Você ainda não criou nenhum Evento/Local.'
                : tab === 'public'
                  ? 'Nenhum Evento público ativo agora.'
                  : 'Nenhum Local privado por convite ativo agora.'}
            </AppText>
            <AppText variant="bodyMuted">
              {tab === 'mine'
                ? 'Crie um Local com foto, referência e coordenadas para liberar entrada por QR e geofence.'
                : 'Volte mais tarde ou use um código de convite para entrar em um Local específico.'}
            </AppText>
          </Card>
        ) : null}

        {message ? <AppText variant="bodyMuted">{message}</AppText> : null}
      </View>
    </Screen>
  );
}
