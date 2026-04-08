import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Card } from '@/components/card';
import { Avatar } from '@/components/avatar';
import { NearMeLogo } from '@/components/logo';
import { getErrorMessage } from '@/services/http';
import { getCurrentDeviceLocation } from '@/services/location';
import { profileToDraft } from '@/services/profile';
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
      throw new Error('Permita acesso as fotos para publicar um story.');
    }

    if (!profile) {
      throw new Error('Complete seu perfil antes de publicar um story.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.85
    });

    if (result.canceled) {
      return;
    }

    const uri = result.assets[0]?.uri;

    if (!uri) {
      return;
    }

    const draft = profileToDraft(profile);

    await saveProfile({
      ...draft,
      storyPhotoUrls: audience === 'public' ? [draft.storyPhotoUrls, uri].filter(Boolean).join('\n') : draft.storyPhotoUrls,
      matchOnlyStoryPhotoUrls:
        audience === 'match' ? [draft.matchOnlyStoryPhotoUrls, uri].filter(Boolean).join('\n') : draft.matchOnlyStoryPhotoUrls
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
      <View style={{ gap: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <NearMeLogo compact />
          <Avatar uri={profile?.photoUrl} name={profile?.displayName} size={48} />
        </View>

        <View
          style={{
            minHeight: 250,
            borderRadius: 40,
            backgroundColor: colors.surface,
            padding: 24,
            overflow: 'hidden',
            justifyContent: 'flex-end',
            gap: 12
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
              opacity: 0.18
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
              opacity: 0.9
            }}
          />
          <AppText variant="eyebrow" style={{ color: colors.accentWarm }}>
            {isVisible ? 'Voce esta no radar' : 'Modo discreto'}
          </AppText>
          <AppText variant="title">
            {isVisible ? `${nearbyCount} pessoas no seu raio agora.` : 'Apareca so quando quiser.'}
          </AppText>
          <AppText variant="bodyMuted">
            O NearMe usa sua localizacao atual para mostrar quem esta perto de verdade. Contato direto fica protegido ate uma conexao aceita.
          </AppText>
          {activeVenue ? <AppText variant="bodyMuted">Local atual: {activeVenue.name}</AppText> : null}
        </View>

        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar uri={profile?.photoUrl} name={profile?.displayName} size={72} />
            <View style={{ flex: 1, gap: 4 }}>
              <AppText variant="sectionTitle">{profile?.displayName ?? 'Complete seu perfil'}</AppText>
              <AppText variant="bodyMuted">{profile?.headline || 'Defina redes, fotos e raio para aparecer melhor.'}</AppText>
            </View>
          </View>
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
          {isVisible ? (
            <SecondaryButton
              title={isUpdatingLocation ? 'Atualizando local...' : 'Atualizar local'}
              disabled={isUpdatingLocation}
              onPress={() => {
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
              }}
            />
          ) : null}
        </Card>

        <Card style={{ padding: 18 }}>
          <AppText variant="sectionTitle">Story rapido</AppText>
          <AppText variant="bodyMuted">Publique da tela principal e escolha se o story sera aberto para todos ou so para match.</AppText>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Story publico"
                onPress={() => {
                  addQuickStory('public').catch((nextError) => setError(getErrorMessage(nextError)));
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SecondaryButton
                title="Story so match"
                onPress={() => {
                  addQuickStory('match').catch((nextError) => setError(getErrorMessage(nextError)));
                }}
              />
            </View>
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton title="Ver pessoas" onPress={() => router.push('/nearby')} />
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton title="Matches" onPress={() => router.push('/connections')} />
          </View>
        </View>

        <Card style={{ padding: 18 }}>
          <AppText variant="sectionTitle">{activeVenue ? 'Participando agora' : 'Locais e Eventos ativos'}</AppText>
          {activeVenue?.coverImageUrl ? (
            <Image source={{ uri: activeVenue.coverImageUrl }} style={{ width: '100%', height: 190, borderRadius: 24 }} />
          ) : null}
          {activeVenue ? (
            <View style={{ gap: 4 }}>
              <AppText variant="body">{activeVenue.name}</AppText>
              <AppText variant="bodyMuted">
                {activeVenue.city}
                {activeVenue.locationLabel ? ` | ${activeVenue.locationLabel}` : ''} | codigo {activeVenue.joinCode}
              </AppText>
            </View>
          ) : (
            venues.slice(0, 2).map((venue) => (
              <View key={venue.id} style={{ gap: 4 }}>
                <AppText variant="body">{venue.name}</AppText>
                <AppText variant="bodyMuted">
                  {venue.city}
                  {venue.locationLabel ? ` | ${venue.locationLabel}` : ''} | area de {venue.radiusMeters} m | codigo {venue.joinCode}
                </AppText>
              </View>
            ))
          )}
          <SecondaryButton title="Abrir Eventos" onPress={() => router.push('/events')} />
          {venues.length === 0 ? <AppText variant="bodyMuted">Nenhum Local ou Evento ativo no momento.</AppText> : null}
        </Card>

        <SecondaryButton title="Editar meu perfil" onPress={() => router.push('/profile')} />

        {error ? (
          <Card>
            <AppText variant="bodyMuted">{error}</AppText>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
