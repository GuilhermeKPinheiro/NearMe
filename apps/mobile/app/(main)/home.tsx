import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '@/components/avatar';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Card } from '@/components/card';
import { NearMeLogo } from '@/components/logo';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { AppText } from '@/components/text';
import { getErrorMessage } from '@/services/http';
import { getCurrentDeviceLocation } from '@/services/location';
import { profileToDraft } from '@/services/profile';
import { uploadImage } from '@/services/uploads';
import { listActiveVenues } from '@/services/venues';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';
import type { Venue } from '@/types/domain';

export default function HomeScreen() {
  const router = useRouter();
  const { isVisible, nearbyCount, activeVenue, setVisible, refreshVisibilityLocation, profile, refreshDashboard, saveProfile } = useSession();
  const [error, setError] = useState('');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);

  const addQuickStory = async (audience: 'public' | 'match') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new Error('Permita acesso às fotos para publicar um story.');
    }

    if (!profile) {
      throw new Error('Complete seu perfil antes de publicar um story.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    const uri = result.assets[0]?.uri;

    if (!uri) {
      return;
    }

    const uploadedUrl = await uploadImage(uri);

    const draft = profileToDraft(profile);

    await saveProfile({
      ...draft,
      storyPhotoUrls: audience === 'public' ? [draft.storyPhotoUrls, uploadedUrl].filter(Boolean).join('\n') : draft.storyPhotoUrls,
      matchOnlyStoryPhotoUrls:
        audience === 'match' ? [draft.matchOnlyStoryPhotoUrls, uploadedUrl].filter(Boolean).join('\n') : draft.matchOnlyStoryPhotoUrls,
    });
  };

  useEffect(() => {
    refreshDashboard().catch((nextError) => {
      setError(getErrorMessage(nextError));
    });
    listActiveVenues()
      .then(setVenues)
      .catch((nextError) => {
        setError(getErrorMessage(nextError));
      });
  }, [refreshDashboard]);

  return (
    <Screen scroll>
      <View style={{ gap: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <NearMeLogo compact />
          <Avatar uri={profile?.photoUrl} name={profile?.displayName} size={48} />
        </View>

        <View
          style={{
            minHeight: 300,
            borderRadius: 36,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            padding: 24,
            overflow: 'hidden',
            justifyContent: 'flex-end',
            gap: 16,
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 230,
              height: 230,
              borderRadius: 150,
              backgroundColor: colors.accentStrong,
              top: -54,
              right: -42,
              opacity: 0.14,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: 120,
              backgroundColor: colors.glow,
              bottom: -36,
              left: -32,
              opacity: 0.8,
            }}
          />

          <SectionHeader
            eyebrow={isVisible ? 'Visível agora' : 'Modo discreto'}
            title={isVisible ? `${nearbyCount} pessoas no seu raio agora.` : 'Apareça só quando quiser.'}
            description="O NearMe usa sua localização atual para mostrar quem está perto de verdade. Contato direto fica protegido até uma conexão aceita."
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar uri={profile?.photoUrl} name={profile?.displayName} size={72} />
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="sectionTitle">{profile?.displayName ?? 'Complete seu perfil'}</AppText>
              <AppText variant="bodyMuted">{profile?.headline || 'Defina redes, fotos e raio para aparecer melhor.'}</AppText>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title={isVisible ? 'Sair do radar' : 'Entrar no radar'}
                onPress={() => {
                  (async () => {
                    try {
                      setError('');

                      if (isVisible) {
                        await setVisible(false);
                        return;
                      }

                      setIsUpdatingLocation(true);
                      const location = await getCurrentDeviceLocation();
                      await setVisible(true, location);
                    } catch (nextError) {
                      setError(getErrorMessage(nextError));
                    } finally {
                      setIsUpdatingLocation(false);
                    }
                  })();
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                title={isVisible ? (isUpdatingLocation ? 'Atualizando local' : 'Atualizar local') : activeVenue ? activeVenue.name : 'Abrir Eventos'}
                disabled={isUpdatingLocation}
                onPress={() => {
                  if (isVisible) {
                    (async () => {
                      try {
                        setError('');
                        setIsUpdatingLocation(true);
                        const location = await getCurrentDeviceLocation();
                        await refreshVisibilityLocation(location);
                      } catch (nextError) {
                        setError(getErrorMessage(nextError));
                      } finally {
                        setIsUpdatingLocation(false);
                      }
                    })();
                    return;
                  }

                  router.push('/events');
                }}
              />
            </View>
          </View>

          {activeVenue ? (
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: colors.borderSubtle,
                paddingTop: 14,
                gap: 4,
              }}
            >
              <AppText variant="eyebrow">Local atual</AppText>
              <AppText variant="body">{activeVenue.name}</AppText>
              <AppText variant="bodyMuted">
                {activeVenue.city}
                {activeVenue.locationLabel ? ` | ${activeVenue.locationLabel}` : ''}
              </AppText>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <SecondaryButton title="Editar meu perfil" onPress={() => router.push('/profile')} />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton title="Matches" onPress={() => router.push('/connections')} />
          </View>
        </View>

        <Card tone="soft" style={{ padding: 18 }}>
          <SectionHeader
            eyebrow="Story rápido"
            title="Publique sem sair da tela principal."
            description="Escolha se o story será aberto para todos ou só para quem já deu match."
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Story público"
                onPress={() => {
                  addQuickStory('public').catch((nextError) => setError(getErrorMessage(nextError)));
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                title="Story só match"
                onPress={() => {
                  addQuickStory('match').catch((nextError) => setError(getErrorMessage(nextError)));
                }}
              />
            </View>
          </View>
        </Card>

        <Card tone="soft" style={{ padding: 18 }}>
          <SectionHeader
            eyebrow={activeVenue ? 'Participando agora' : 'Locais e Eventos ativos'}
            title={activeVenue ? activeVenue.name : 'Entre em um Local para aparecer no contexto certo.'}
            description={
              activeVenue
                ? `${activeVenue.city}${activeVenue.locationLabel ? ` | ${activeVenue.locationLabel}` : ''} | código ${activeVenue.joinCode}`
                : 'O app prioriza pessoas do mesmo Local quando você confirma a entrada.'
            }
          />
          {activeVenue?.coverImageUrl ? (
            <Image source={{ uri: activeVenue.coverImageUrl }} style={{ width: '100%', height: 196, borderRadius: 24 }} />
          ) : (
            <View style={{ gap: 12 }}>
              {venues.slice(0, 2).map((venue, index, items) => (
                <View
                  key={venue.id}
                  style={{
                    gap: 4,
                    paddingBottom: index < items.length - 1 ? 12 : 0,
                    borderBottomWidth: index < items.length - 1 ? 1 : 0,
                    borderBottomColor: colors.borderSubtle,
                  }}
                >
                  <AppText variant="body">{venue.name}</AppText>
                  <AppText variant="bodyMuted">
                    {venue.city}
                    {venue.locationLabel ? ` | ${venue.locationLabel}` : ''} | área de {venue.radiusMeters} m
                  </AppText>
                </View>
              ))}
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Ver pessoas" onPress={() => router.push('/nearby')} />
            </View>
            <View style={{ flex: 1 }}>
              <SecondaryButton title="Abrir Eventos" onPress={() => router.push('/events')} />
            </View>
          </View>
          {venues.length === 0 ? <AppText variant="bodyMuted">Nenhum Local ou Evento ativo no momento.</AppText> : null}
        </Card>

        {error ? (
          <Card tone="soft">
            <AppText variant="bodyMuted">{error}</AppText>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
