import { useCallback, useEffect, useState } from 'react';
import { Image, Linking, ScrollView, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { Card } from '@/components/card';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Avatar } from '@/components/avatar';
import { sendConnectionRequest } from '@/services/connections';
import { getErrorMessage } from '@/services/http';
import { listNearbyUsers } from '@/services/nearby';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';
import type { NearbySummary, NearbyUser } from '@/types/domain';

const radiusOptions = [
  { label: '100 m', value: 100 },
  { label: '1 km', value: 1000 },
  { label: '10 km', value: 10000 }
];

const REFRESH_INTERVAL_MS = 30_000;

function splitPhotos(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function ProfilePhotos({ title, photos }: { title: string; photos: string[] }) {
  if (!photos.length) {
    return null;
  }

  return (
    <View style={{ gap: 8 }}>
      <AppText variant="eyebrow">{title}</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {photos.map((photo) => (
          <Image
            key={photo}
            source={{ uri: photo }}
            style={{ width: 82, height: 82, borderRadius: 20, backgroundColor: colors.surfaceAlt }}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function SocialButton({ title, url }: { title: string; url: string | null }) {
  if (!url) {
    return null;
  }

  return <SecondaryButton title={title} compact onPress={() => Linking.openURL(url)} />;
}

export default function NearbyScreen() {
  const { refreshDashboard, profile, activeVenue } = useSession();
  const [people, setPeople] = useState<NearbyUser[]>([]);
  const [summary, setSummary] = useState<NearbySummary | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(profile?.preferredRadiusMeters ?? 1000);
  const [sameVenueOnly, setSameVenueOnly] = useState(Boolean(activeVenue));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(
    async (nextRadius = radiusMeters, nextSameVenueOnly = sameVenueOnly, silent = false) => {
      if (!silent) {
        setIsRefreshing(true);
      }

      try {
        const data = await listNearbyUsers(nextRadius, nextSameVenueOnly);
        setPeople(data.users);
        setSummary(data.summary);
        setError('');
      } catch (nextError) {
        setError(getErrorMessage(nextError));
      } finally {
        if (!silent) {
          setIsRefreshing(false);
        }
      }
    },
    [radiusMeters, sameVenueOnly]
  );

  useEffect(() => {
    void load(radiusMeters, sameVenueOnly);
  }, [load, radiusMeters, sameVenueOnly]);

  useFocusEffect(
    useCallback(() => {
      void load(radiusMeters, sameVenueOnly, true);
      const interval = setInterval(() => {
        void load(radiusMeters, sameVenueOnly, true);
      }, REFRESH_INTERVAL_MS);

      return () => clearInterval(interval);
    }, [load, radiusMeters, sameVenueOnly])
  );

  return (
    <Screen
      scroll
      refreshControlProps={{
        refreshing: isRefreshing,
        onRefresh: () => {
          void load(radiusMeters, sameVenueOnly);
        },
      }}
    >
      <View style={{ gap: 18 }}>
        <View style={{ gap: 6 }}>
          <AppText variant="eyebrow">Pessoas</AppText>
          <AppText variant="title">Quem esta perto agora.</AppText>
          <AppText variant="bodyMuted">
            Esta tela agora atualiza sozinha enquanto estiver aberta e tambem permite atualizar arrastando.
          </AppText>
          {activeVenue ? <AppText variant="bodyMuted">Local atual: {activeVenue.name}</AppText> : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {radiusOptions.map((option) => (
            <View key={option.value} style={{ flex: 1 }}>
              {radiusMeters === option.value ? (
                <PrimaryButton title={option.label} compact onPress={() => undefined} />
              ) : (
                <SecondaryButton title={option.label} compact onPress={() => setRadiusMeters(option.value)} />
              )}
            </View>
          ))}
        </View>

        {activeVenue ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              {sameVenueOnly ? (
                <PrimaryButton title="So deste evento" compact onPress={() => undefined} />
              ) : (
                <SecondaryButton title="So deste evento" compact onPress={() => setSameVenueOnly(true)} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              {!sameVenueOnly ? (
                <PrimaryButton title="Todos por perto" compact onPress={() => undefined} />
              ) : (
                <SecondaryButton title="Todos por perto" compact onPress={() => setSameVenueOnly(false)} />
              )}
            </View>
          </View>
        ) : null}

        {summary ? <AppText variant="bodyMuted">{summary.count} pessoas carregadas.</AppText> : null}
        {error ? <AppText variant="bodyMuted">{error}</AppText> : null}

        {people.map((person) => {
          const publicPhotos = splitPhotos(person.publicPhotoUrls);
          const privatePhotos = splitPhotos(person.matchOnlyPhotoUrls);
          const stories = splitPhotos(person.storyPhotoUrls);

          return (
            <Card key={person.id} style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Avatar uri={person.photoUrl} name={person.displayName} size={76} />
                <View style={{ flex: 1, gap: 5 }}>
                  <AppText variant="sectionTitle">{person.displayName}</AppText>
                  <AppText variant="bodyMuted">{person.headline || 'Aberto para conhecer pessoas por perto'}</AppText>
                  <AppText variant="eyebrow" style={{ color: colors.accent }}>
                    {person.distanceLabel}
                  </AppText>
                </View>
              </View>

              {person.bio ? <AppText variant="bodyMuted">{person.bio}</AppText> : null}
              {person.venue ? <AppText variant="bodyMuted">No mesmo evento/local: {person.venue.name}</AppText> : null}

              <ProfilePhotos title="Stories agora" photos={stories} />
              <ProfilePhotos title="Fotos publicas" photos={publicPhotos} />
              <ProfilePhotos title="Fotos apos match" photos={privatePhotos} />

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <SocialButton title="Instagram" url={person.instagramUrl} />
                <SocialButton title="TikTok" url={person.tiktokUrl} />
                <SocialButton title="Snapchat" url={person.snapchatUrl} />
                <SocialButton title="Outro link" url={person.otherSocialUrl} />
                <SocialButton title="WhatsApp" url={person.whatsappUrl} />
              </View>

              {!person.linksUnlocked ? (
                <AppText variant="bodyMuted">Contato direto e fotos privadas ficam bloqueados ate a conexao ser aceita.</AppText>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <SecondaryButton title={person.linksUnlocked ? 'Conectado' : 'Ver perfil'} onPress={() => undefined} />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title={person.isConnected ? 'Match' : person.requestStatus === 'PENDING' ? 'Enviado' : 'Curtir'}
                    disabled={person.isConnected || person.requestStatus === 'PENDING'}
                    onPress={() => {
                      sendConnectionRequest(person.id)
                        .then(async () => {
                          await load(radiusMeters, sameVenueOnly, true);
                          await refreshDashboard();
                        })
                        .catch((nextError) => {
                          setError(getErrorMessage(nextError));
                        });
                    }}
                  />
                </View>
              </View>
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
