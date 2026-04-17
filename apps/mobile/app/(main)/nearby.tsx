import { useCallback, useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Avatar } from '@/components/avatar';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Card } from '@/components/card';
import { MediaStrip } from '@/components/media-strip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { SegmentedControl } from '@/components/segmented-control';
import { AppText } from '@/components/text';
import { sendConnectionRequest } from '@/services/connections';
import { getErrorMessage } from '@/services/http';
import { listNearbyUsers } from '@/services/nearby';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';
import type { NearbySummary, NearbyUser } from '@/types/domain';

const radiusOptions = [
  { label: '100 m', value: 100 },
  { label: '1 km', value: 1000 },
  { label: '10 km', value: 10000 },
];

const REFRESH_INTERVAL_MS = 30_000;

function splitPhotos(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
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
    [radiusMeters, sameVenueOnly],
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
    }, [load, radiusMeters, sameVenueOnly]),
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
        <SectionHeader
          eyebrow="Pessoas"
          title="Quem esta perto agora."
          description="A tela atualiza sozinha enquanto estiver aberta e também permite atualizar arrastando."
        />

        <SegmentedControl options={radiusOptions} selectedValue={radiusMeters} onChange={setRadiusMeters} />

        {activeVenue ? (
          <Card tone="soft" style={{ padding: 14 }}>
            <AppText variant="eyebrow">Contexto atual</AppText>
            <AppText variant="body">{activeVenue.name}</AppText>
            <AppText variant="bodyMuted">Escolha entre filtrar só deste Local ou manter todos por perto.</AppText>
            <SegmentedControl
              options={[
                { label: 'Só deste evento', value: 1 },
                { label: 'Todos por perto', value: 0 },
              ]}
              selectedValue={sameVenueOnly ? 1 : 0}
              onChange={(value) => setSameVenueOnly(value === 1)}
            />
          </Card>
        ) : null}

        {summary ? (
          <Card tone="soft" style={{ padding: 14 }}>
            <AppText variant="body">
              {summary.count} pessoas carregadas
              {sameVenueOnly && activeVenue ? ` em ${activeVenue.name}` : ''}.
            </AppText>
            <AppText variant="bodyMuted">Perfil completo, fotos privadas e contato direto continuam protegidos até conexão aceita.</AppText>
          </Card>
        ) : null}
        {error ? <AppText variant="bodyMuted">{error}</AppText> : null}

        {people.map((person) => {
          const publicPhotos = splitPhotos(person.publicPhotoUrls);
          const stories = splitPhotos(person.storyPhotoUrls);
          const socialCount = [
            person.instagramUrl,
            person.tiktokUrl,
            person.snapchatUrl,
            person.otherSocialUrl,
            person.whatsappUrl,
          ].filter(Boolean).length;

          return (
            <Card key={person.id} style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                <Avatar uri={person.photoUrl} name={person.displayName} size={76} />
                <View style={{ flex: 1, gap: 5 }}>
                  <View style={{ gap: 5 }}>
                    <AppText variant="sectionTitle">{person.displayName}</AppText>
                    <AppText variant="bodyMuted">{person.headline || 'Aberto para conhecer pessoas por perto'}</AppText>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: colors.surfaceAlt,
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                      }}
                    >
                      <AppText variant="eyebrow" style={{ color: colors.accent }}>
                        {person.distanceLabel}
                      </AppText>
                    </View>
                    {!person.distanceLabel.toLowerCase().includes('aproximada') ? null : (
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          backgroundColor: colors.surfaceAlt,
                          borderWidth: 1,
                          borderColor: colors.borderSubtle,
                        }}
                      >
                        <AppText variant="bodyMuted">Localização aproximada</AppText>
                      </View>
                    )}
                  </View>
                  {person.bio ? (
                    <AppText variant="bodyMuted" numberOfLines={3}>
                      {person.bio}
                    </AppText>
                  ) : null}
                  {person.venue ? (
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        backgroundColor: colors.surfaceAlt,
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                      }}
                    >
                      <AppText variant="bodyMuted">No mesmo Local: {person.venue.name}</AppText>
                    </View>
                  ) : null}
                </View>
              </View>

              {stories.length ? (
                <MediaStrip title="Stories agora" items={stories.slice(0, 6)} tall />
              ) : publicPhotos.length ? (
                <MediaStrip title="Fotos públicas" items={publicPhotos.slice(0, 6)} />
              ) : (
                <View
                  style={{
                    borderRadius: 22,
                    backgroundColor: colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    padding: 14,
                    gap: 4,
                  }}
                >
                  <AppText variant="eyebrow">Vitrine</AppText>
                  <AppText variant="bodyMuted">Sem mídia pública no momento.</AppText>
                </View>
              )}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <AppText variant="bodyMuted">{socialCount} links disponíveis</AppText>
                </View>
                {!person.linksUnlocked ? (
                  <View
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                    }}
                  >
                    <AppText variant="bodyMuted">Contato privado bloqueado</AppText>
                  </View>
                ) : null}
              </View>

              {person.linksUnlocked ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <SocialButton title="Instagram" url={person.instagramUrl} />
                  <SocialButton title="TikTok" url={person.tiktokUrl} />
                  <SocialButton title="Snapchat" url={person.snapchatUrl} />
                  <SocialButton title="Outro link" url={person.otherSocialUrl} />
                  <SocialButton title="WhatsApp" url={person.whatsappUrl} />
                </View>
              ) : (
                <AppText variant="bodyMuted">Contato direto, fotos privadas e stories reservados ficam bloqueados até a conexão ser aceita.</AppText>
              )}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <SecondaryButton title={person.linksUnlocked ? 'Links liberados' : 'Visibilidade protegida'} compact onPress={() => undefined} />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title={person.isConnected ? 'Match' : person.requestStatus === 'PENDING' ? 'Enviado' : 'Curtir'}
                    compact
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

        {people.length === 0 && !error ? (
          <Card tone="soft">
            <AppText variant="sectionTitle">Nenhuma pessoa visível no momento</AppText>
            <AppText variant="bodyMuted">Tente ampliar o raio ou volte em alguns instantes. A lista atualiza sozinha enquanto a tela estiver aberta.</AppText>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
