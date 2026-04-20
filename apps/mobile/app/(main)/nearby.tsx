import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Card } from '@/components/card';
import { MediaStrip } from '@/components/media-strip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { SegmentedControl } from '@/components/segmented-control';
import { StoryAvatar } from '@/components/story-avatar';
import { StoryRail } from '@/components/story-rail';
import { AppText } from '@/components/text';
import { sendConnectionRequest } from '@/services/connections';
import { getErrorMessage } from '@/services/http';
import { listNearbyUsers } from '@/services/nearby';
import { realtimeClient } from '@/services/realtime';
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
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function SocialButton({ title, url }: { title: string; url: string | null }) {
  if (!url) {
    return null;
  }

  return <SecondaryButton title={title} compact onPress={() => Linking.openURL(url)} />;
}

export default function NearbyScreen() {
  const { refreshDashboard, profile, activeVenue, isVisible } = useSession();
  const [people, setPeople] = useState<NearbyUser[]>([]);
  const [summary, setSummary] = useState<NearbySummary | null>(null);
  const [radiusMeters, setRadiusMeters] = useState(profile?.preferredRadiusMeters ?? 1000);
  const [sameVenueOnly, setSameVenueOnly] = useState(Boolean(activeVenue));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingConnectionIds, setPendingConnectionIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const audienceHint = useMemo(
    () =>
      activeVenue
        ? 'Todo mundo vê quem está visível agora. Só conexões libera o que fica reservado depois do aceite.'
        : 'Todo mundo vê o básico do perfil. Só conexões abre momentos reservados, fotos privadas e links depois do aceite.',
    [activeVenue]
  );

  const load = useCallback(
    async (nextRadius = radiusMeters, nextSameVenueOnly = sameVenueOnly, silent = false) => {
      if (!isVisible) {
        setPeople([]);
        setSummary(null);
        setError('');
        return;
      }

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
    [isVisible, radiusMeters, sameVenueOnly]
  );

  useEffect(() => {
    if (!isVisible) {
      setPeople([]);
      setSummary(null);
      setPendingConnectionIds([]);
      return;
    }

    void load(radiusMeters, sameVenueOnly);
  }, [isVisible, load, radiusMeters, sameVenueOnly]);

  useFocusEffect(
    useCallback(() => {
      if (!isVisible) {
        setPeople([]);
        setSummary(null);
        return () => undefined;
      }

      void load(radiusMeters, sameVenueOnly, true);
      const interval = setInterval(() => {
        void load(radiusMeters, sameVenueOnly, true);
      }, REFRESH_INTERVAL_MS);
      const unsubscribeRealtime = realtimeClient.subscribe('connections:updated', () => {
        void load(radiusMeters, sameVenueOnly, true);
      });

      return () => {
        clearInterval(interval);
        unsubscribeRealtime();
      };
    }, [isVisible, load, radiusMeters, sameVenueOnly])
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
          title="Quem está por perto agora."
          description="Puxe para atualizar ou deixe a tela aberta para acompanhar o movimento do local."
        />

        <SegmentedControl options={radiusOptions} selectedValue={radiusMeters} onChange={setRadiusMeters} />

        {activeVenue ? (
          <Card tone="soft" style={{ padding: 14 }}>
            <AppText variant="eyebrow">Contexto atual</AppText>
            <AppText variant="body">{activeVenue.name}</AppText>
            <AppText variant="bodyMuted">Escolha entre ver só quem está nesse local ou manter todo o radar.</AppText>
            <SegmentedControl
              options={[
                { label: 'Só deste local', value: 1 },
                { label: 'Todo o radar', value: 0 },
              ]}
              selectedValue={sameVenueOnly ? 1 : 0}
              onChange={(value) => setSameVenueOnly(value === 1)}
            />
          </Card>
        ) : null}

        <Card tone="soft" style={{ padding: 14 }}>
          <AppText variant="eyebrow">Como funciona</AppText>
          <AppText variant="bodyMuted">{audienceHint}</AppText>
        </Card>

        {!isVisible ? (
          <Card tone="soft" style={{ padding: 14 }}>
            <AppText variant="sectionTitle">Radar pausado</AppText>
            <AppText variant="bodyMuted">Saindo do radar, a lista de pessoas é limpa e volta só quando você entrar novamente.</AppText>
          </Card>
        ) : null}

        {summary && isVisible ? (
          <Card tone="soft" style={{ padding: 14 }}>
            <AppText variant="body">
              {summary.count} pessoas encontradas
              {sameVenueOnly && activeVenue ? ` em ${activeVenue.name}` : ''}.
            </AppText>
            <AppText variant="bodyMuted">Fotos reservadas, momentos fechados e contato direto seguem protegidos até a conexão ser aceita.</AppText>
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
                <StoryAvatar uri={person.photoUrl} name={person.displayName} size={76} active={stories.length > 0} />
                <View style={{ flex: 1, gap: 6 }}>
                  <AppText variant="sectionTitle">{person.displayName}</AppText>
                  <AppText variant="bodyMuted">{person.headline || 'Disponível para novas conexões por perto'}</AppText>
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
                        <AppText variant="bodyMuted">{person.venue.name}</AppText>
                      </View>
                    ) : null}
                  </View>
                  {person.bio ? (
                    <AppText variant="bodyMuted" numberOfLines={2}>
                      {person.bio}
                    </AppText>
                  ) : null}
                </View>
              </View>

              {stories.length ? (
                <StoryRail
                  title="Momento agora"
                  subtitle="Publicado para quem está vendo este perfil por proximidade."
                  items={stories.slice(0, 6)}
                  emptyLabel="Sem momento público ativo agora."
                />
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
                  <AppText variant="eyebrow">Perfil</AppText>
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
                    <AppText variant="bodyMuted">Contato direto protegido</AppText>
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
                <AppText variant="bodyMuted">Contato direto, fotos reservadas e momentos fechados aparecem só depois do aceite.</AppText>
              )}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      minHeight: 42,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      backgroundColor: colors.surfaceAlt,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 16,
                    }}
                  >
                    <AppText variant="bodyMuted">{person.linksUnlocked ? 'Links liberados' : 'Perfil protegido'}</AppText>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  {person.isConnected ? (
                    <SecondaryButton title="Conectado" compact disabled />
                  ) : person.requestStatus === 'PENDING' || pendingConnectionIds.includes(person.id) ? (
                    <SecondaryButton title="Pedido enviado" compact disabled />
                  ) : (
                    <PrimaryButton
                      title="Enviar pedido"
                      compact
                      onPress={() => {
                        setPendingConnectionIds((current) => [...current, person.id]);
                        setPeople((current) =>
                          current.map((item) =>
                            item.id === person.id
                              ? {
                                  ...item,
                                  requestStatus: 'PENDING',
                                }
                              : item
                          )
                        );

                        sendConnectionRequest(person.id)
                          .then(async () => {
                            await load(radiusMeters, sameVenueOnly, true);
                            await refreshDashboard();
                          })
                          .catch((nextError) => {
                            setPeople((current) =>
                              current.map((item) =>
                                item.id === person.id
                                  ? {
                                      ...item,
                                      requestStatus: null,
                                    }
                                  : item
                              )
                            );
                            setError(getErrorMessage(nextError));
                          })
                          .finally(() => {
                            setPendingConnectionIds((current) => current.filter((id) => id !== person.id));
                          });
                      }}
                    />
                  )}
                </View>
              </View>
            </Card>
          );
        })}

        {people.length === 0 && !error && isVisible ? (
          <Card tone="soft">
            <AppText variant="sectionTitle">Ninguém visível no momento</AppText>
            <AppText variant="bodyMuted">Tente ampliar o raio ou volte em alguns instantes. A lista se atualiza enquanto a tela estiver aberta.</AppText>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
