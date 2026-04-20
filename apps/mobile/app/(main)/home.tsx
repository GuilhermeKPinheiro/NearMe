import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image, ScrollView, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { CameraCaptureModal } from '@/components/camera-capture-modal';
import { Card } from '@/components/card';
import { MediaSourceSheet } from '@/components/media-source-sheet';
import { NearMeLogo } from '@/components/logo';
import { Screen } from '@/components/screen';
import { SegmentedControl } from '@/components/segmented-control';
import { StoryAvatar } from '@/components/story-avatar';
import { StoryViewerModal } from '@/components/story-viewer-modal';
import { AppText } from '@/components/text';
import { debugLog, measureAsync } from '@/services/diagnostics';
import { getErrorMessage } from '@/services/http';
import { getCurrentDeviceLocation } from '@/services/location';
import { profileToDraft } from '@/services/profile';
import { uploadImage } from '@/services/uploads';
import { listActiveVenues } from '@/services/venues';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';
import type { Venue } from '@/types/domain';
import { formatRelativeTime } from '@/utils/time';

type StoryAudience = 'public' | 'match';

function splitMedia(value?: string | null) {
  return (value ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function StatusChip({ label, icon }: { label: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      <Ionicons name={icon} size={14} color={colors.accentStrong} />
      <AppText variant="bodyMuted">{label}</AppText>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    isVisible,
    nearbyCount,
    activeVenue,
    setVisible,
    refreshVisibilityLocation,
    profile,
    refreshDashboard,
    saveProfile,
    visibilitySession,
  } = useSession();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [error, setError] = useState('');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [storySourceAudience, setStorySourceAudience] = useState<StoryAudience | null>(null);
  const [cameraAudience, setCameraAudience] = useState<StoryAudience | null>(null);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyTab, setStoryTab] = useState<StoryAudience>('public');
  const [venues, setVenues] = useState<Venue[]>([]);

  const publicStories = splitMedia(profile?.storyPhotoUrls);
  const privateStories = splitMedia(profile?.matchOnlyStoryPhotoUrls);
  const activeStories = storyTab === 'public' ? publicStories : privateStories;
  const hasActiveStory = activeStories.length > 0;
  const storySubtitle = useMemo(() => {
    const relative = formatRelativeTime(profile?.updatedAt);
    return relative ? `Publicado ${relative}` : 'Momento publicado';
  }, [profile?.updatedAt]);

  const locationLabel = useMemo(() => {
    if (activeVenue) {
      return activeVenue.name;
    }

    if (visibilitySession?.latitude != null && visibilitySession?.longitude != null) {
      return 'Posição atualizada';
    }

    return 'Sem local ativo';
  }, [activeVenue, visibilitySession?.latitude, visibilitySession?.longitude]);

  const uploadStory = async (uri: string, audience: StoryAudience) => {
    if (!profile) {
      throw new Error('Complete seu perfil antes de publicar um momento.');
    }

    setIsUploadingStory(true);

    try {
      const uploadedUrl = await measureAsync('home', 'uploadStoryImage', () => uploadImage(uri), {
        audience,
      });
      const draft = profileToDraft(profile);

      await measureAsync('home', 'saveStoryProfile', () =>
        saveProfile({
          ...draft,
          storyPhotoUrls:
            audience === 'public' ? [draft.storyPhotoUrls, uploadedUrl].filter(Boolean).join('\n') : draft.storyPhotoUrls,
          matchOnlyStoryPhotoUrls:
            audience === 'match' ? [draft.matchOnlyStoryPhotoUrls, uploadedUrl].filter(Boolean).join('\n') : draft.matchOnlyStoryPhotoUrls,
        })
      );
    } finally {
      setIsUploadingStory(false);
    }
  };

  const addStoryFromLibrary = async (audience: StoryAudience) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new Error('Permita acesso às fotos para publicar um momento.');
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

    await uploadStory(uri, audience);
  };

  const openStoryCamera = async (audience: StoryAudience) => {
    const permissionResponse = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();

    if (!permissionResponse?.granted) {
      throw new Error('Permita acesso à câmera para publicar um momento na hora.');
    }

    setCameraAudience(audience);
  };

  useEffect(() => {
    measureAsync('home', 'initialRefreshDashboard', () => refreshDashboard()).catch(() => undefined);
    measureAsync('home', 'initialListActiveVenues', () => listActiveVenues())
      .then(setVenues)
      .catch(() => undefined);
  }, [refreshDashboard]);

  useFocusEffect(
    useCallback(() => {
      void refreshDashboard().catch(() => undefined);
      void listActiveVenues().then(setVenues).catch(() => undefined);
      return () => undefined;
    }, [refreshDashboard])
  );

  return (
    <Screen scroll>
      <View style={{ gap: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <NearMeLogo compact />
          <SecondaryButton title="Perfil" compact onPress={() => router.push('/profile')} />
        </View>

        <Card tone="soft" style={{ padding: 16, gap: 14 }}>
          <SegmentedControl
            options={[
              { label: 'Todo mundo vê', value: 'public' as StoryAudience },
              { label: 'Só conexões', value: 'match' as StoryAudience },
            ]}
            selectedValue={storyTab}
            onChange={setStoryTab}
          />
          <AppText variant="bodyMuted">
            {storyTab === 'public'
              ? 'Todo mundo vê o básico do seu momento enquanto você está visível.'
              : 'Só conexões mostra o que fica reservado para depois do aceite.'}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <StoryAvatar
              uri={profile?.photoUrl}
              name={profile?.displayName}
              label={hasActiveStory ? 'Ver' : 'Adicionar'}
              active={hasActiveStory}
              onPress={hasActiveStory ? () => setStoryViewerOpen(true) : () => setStorySourceAudience(storyTab)}
            />
            <View style={{ flex: 1, gap: 6 }}>
              <AppText variant="eyebrow">{storyTab === 'public' ? 'Momento aberto' : 'Momento reservado'}</AppText>
              <AppText variant="sectionTitle">{hasActiveStory ? 'Seu momento já está no ar.' : 'Publique algo do agora.'}</AppText>
            </View>
            <PrimaryButton
              title="+"
              compact
              disabled={isUploadingStory}
              onPress={() => setStorySourceAudience(storyTab)}
              style={{ width: 48, paddingHorizontal: 0 }}
            />
          </View>
        </Card>

        <Card
          style={{
            padding: 22,
            overflow: 'hidden',
            gap: 16,
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: colors.accentStrong,
              top: -70,
              right: -32,
              opacity: 0.12,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: colors.glow,
              bottom: -36,
              left: -22,
            }}
          />

          <View style={{ gap: 6 }}>
            <AppText variant="eyebrow" style={{ color: isVisible ? colors.accentWarm : colors.muted }}>
              {isVisible ? 'Visível agora' : 'Modo discreto'}
            </AppText>
            <AppText variant="title" style={{ fontSize: 26, lineHeight: 32 }}>
              {isVisible ? `${nearbyCount} pessoas no seu radar.` : 'Apareça só quando fizer sentido.'}
            </AppText>
            <AppText variant="bodyMuted">
              {isVisible
                ? 'Você está visível por proximidade, sem abrir contato direto antes do aceite.'
                : 'Entre no radar para ver quem está por perto e no mesmo contexto que você.'}
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <StoryAvatar
              uri={profile?.photoUrl}
              name={profile?.displayName}
              size={82}
              active={publicStories.length > 0}
              onPress={
                publicStories.length > 0
                  ? () => {
                      setStoryTab('public');
                      setStoryViewerOpen(true);
                    }
                  : () => setStorySourceAudience('public')
              }
            />
            <View style={{ flex: 1, gap: 8 }}>
              <AppText variant="sectionTitle">{profile?.displayName ?? 'Complete seu perfil'}</AppText>
              <AppText variant="bodyMuted">{profile?.headline || 'Defina sua foto, sua frase e o que fica público antes da conexão.'}</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <StatusChip icon="radio" label={isVisible ? 'Radar ativo' : 'Fora do radar'} />
                <StatusChip icon={activeVenue ? 'location' : 'locate'} label={locationLabel} />
              </View>
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
                        await measureAsync('home', 'leaveRadar', () => setVisible(false));
                        return;
                      }

                      setIsUpdatingLocation(true);
                      const location = await measureAsync('home', 'getCurrentLocationForRadar', () => getCurrentDeviceLocation());
                      await measureAsync('home', 'enterRadar', () => setVisible(true, location));
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
                title={isVisible ? (isUpdatingLocation ? 'Atualizando...' : 'Atualizar posição') : 'Ver eventos'}
                disabled={isUpdatingLocation}
                onPress={() => {
                  if (isVisible) {
                    (async () => {
                      try {
                        setError('');
                        setIsUpdatingLocation(true);
                        const location = await measureAsync('home', 'getCurrentLocationForRefresh', () => getCurrentDeviceLocation());
                        await measureAsync('home', 'refreshCurrentLocation', () => refreshVisibilityLocation(location));
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
        </Card>

        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'stretch' }}>
          <View style={{ flex: 1 }}>
            <Card tone="soft" style={{ padding: 16, minHeight: 136, justifyContent: 'space-between' }}>
              <View style={{ gap: 4 }}>
                <AppText variant="eyebrow">Pessoas</AppText>
                <AppText variant="sectionTitle">{nearbyCount}</AppText>
                <AppText variant="bodyMuted">No seu raio agora.</AppText>
              </View>
              <SecondaryButton title="Abrir radar" compact onPress={() => router.push('/nearby')} />
            </Card>
          </View>
          <View style={{ flex: 1 }}>
            <Card tone="soft" style={{ padding: 16, minHeight: 136, justifyContent: 'space-between' }}>
              <View style={{ gap: 4 }}>
                <AppText variant="eyebrow">Conexões</AppText>
                <AppText variant="sectionTitle">Abra sua rede</AppText>
                <AppText variant="bodyMuted">Leve a conexão para suas redes no momento certo.</AppText>
              </View>
              <SecondaryButton title="Ver conexões" compact onPress={() => router.push('/connections')} />
            </Card>
          </View>
        </View>

        <Card tone="soft" style={{ padding: 18 }}>
          <View style={{ gap: 6 }}>
            <AppText variant="eyebrow">{activeVenue ? 'No mesmo local' : 'Locais ativos'}</AppText>
            <AppText variant="sectionTitle">{activeVenue ? activeVenue.name : 'Entre em um local para afinar a descoberta.'}</AppText>
            <AppText variant="bodyMuted">
              {activeVenue
                ? `${activeVenue.city}${activeVenue.locationLabel ? ` · ${activeVenue.locationLabel}` : ''}`
                : 'Quando você confirma entrada, o NearMe prioriza quem está no mesmo contexto.'}
            </AppText>
          </View>

          {activeVenue?.coverImageUrl ? (
            <Image source={{ uri: activeVenue.coverImageUrl }} style={{ width: '100%', height: 196, borderRadius: 24 }} />
          ) : venues.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {venues.slice(0, 4).map((venue) => (
                <View
                  key={venue.id}
                  style={{
                    width: 220,
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surface,
                    overflow: 'hidden',
                  }}
                >
                  {venue.coverImageUrl ? (
                    <Image source={{ uri: venue.coverImageUrl }} style={{ width: '100%', height: 120 }} />
                  ) : (
                    <View style={{ height: 120, backgroundColor: colors.glow }} />
                  )}
                  <View style={{ padding: 14, gap: 4 }}>
                    <AppText variant="sectionTitle">{venue.name}</AppText>
                    <AppText variant="bodyMuted">
                      {venue.city}
                      {venue.locationLabel ? ` · ${venue.locationLabel}` : ''}
                    </AppText>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <AppText variant="bodyMuted">Nenhum local ativo agora.</AppText>
          )}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Abrir eventos" onPress={() => router.push('/events')} />
            </View>
            <View style={{ flex: 1 }}>
              <SecondaryButton title="Editar perfil" onPress={() => router.push('/profile')} />
            </View>
          </View>
        </Card>

        {error ? <AppText variant="bodyMuted">{error}</AppText> : null}
      </View>

      <MediaSourceSheet
        visible={Boolean(storySourceAudience)}
        title={storySourceAudience === 'match' ? 'Momento reservado' : 'Novo momento'}
        description={
          storySourceAudience === 'match'
            ? 'Esse momento só aparece para conexões aceitas.'
            : 'Esse momento aparece para quem está vendo você por perto agora.'
        }
        onClose={() => setStorySourceAudience(null)}
        onPickCamera={() => {
          const audience = storySourceAudience;
          setStorySourceAudience(null);

          if (!audience) {
            return;
          }

          debugLog('home', 'openStoryCamera', { audience });
          openStoryCamera(audience).catch((nextError) => setError(getErrorMessage(nextError)));
        }}
        onPickLibrary={() => {
          const audience = storySourceAudience;
          setStorySourceAudience(null);

          if (!audience) {
            return;
          }

          debugLog('home', 'openStoryLibrary', { audience });
          addStoryFromLibrary(audience).catch((nextError) => setError(getErrorMessage(nextError)));
        }}
      />

      <CameraCaptureModal
        visible={Boolean(cameraAudience)}
        title={cameraAudience === 'match' ? 'Momento reservado' : 'Novo momento'}
        description={
          cameraAudience === 'match'
            ? 'Capture algo que só entra depois do aceite.'
            : 'Capture o momento e publique sem sair da home.'
        }
        aspectLabel="4:5 vertical"
        uploading={isUploadingStory}
        onClose={() => setCameraAudience(null)}
        onCapture={async (uri) => {
          if (!cameraAudience) {
            return;
          }

          try {
            await uploadStory(uri, cameraAudience);
            setCameraAudience(null);
            setError('');
          } catch (nextError) {
            setError(getErrorMessage(nextError));
          }
        }}
      />

      <StoryViewerModal
        visible={storyViewerOpen}
        name={profile?.displayName || 'Seu momento'}
        items={activeStories}
        subtitle={storySubtitle}
        onClose={() => setStoryViewerOpen(false)}
      />
    </Screen>
  );
}
