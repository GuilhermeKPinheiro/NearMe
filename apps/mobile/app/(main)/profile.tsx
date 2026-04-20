import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Switch, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { CameraCaptureModal } from '@/components/camera-capture-modal';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { MediaSourceSheet } from '@/components/media-source-sheet';
import { MediaStrip } from '@/components/media-strip';
import { Screen } from '@/components/screen';
import { SegmentedControl } from '@/components/segmented-control';
import { StoryAvatar } from '@/components/story-avatar';
import { StoryViewerModal } from '@/components/story-viewer-modal';
import { AppText } from '@/components/text';
import { getErrorMessage } from '@/services/http';
import { emptyProfileDraft, profileToDraft, type ProfileDraft } from '@/services/profile';
import { uploadImage } from '@/services/uploads';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';
import { formatRelativeTime } from '@/utils/time';

const radiusOptions = [
  { label: '100 m', value: 100 },
  { label: '1 km', value: 1000 },
  { label: '10 km', value: 10000 },
];

type PhotoField = 'publicPhotoUrls' | 'matchOnlyPhotoUrls' | 'storyPhotoUrls' | 'matchOnlyStoryPhotoUrls';
type MediaKind = 'story' | 'photo';
type AudienceKind = 'public' | 'match';
type LayerTarget = {
  key: `${AudienceKind}-${MediaKind}`;
  field: PhotoField;
  title: string;
  description: string;
  aspectLabel: string;
  currentItems: string[];
  tall: boolean;
};
type MediaTarget =
  | {
      key: 'avatar';
      title: string;
      description: string;
      aspectLabel: string;
      field?: undefined;
      currentItems?: undefined;
      tall?: undefined;
    }
  | LayerTarget;

function appendLine(current: string, value: string) {
  return [current.trim(), value].filter(Boolean).join('\n');
}

function splitMedia(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function removeMedia(value: string, target: string) {
  return splitMedia(value).filter((item) => item !== target).join('\n');
}

function PrivacyToggle({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.surfaceAlt,
        padding: 14,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <AppText variant="sectionTitle">{title}</AppText>
        <AppText variant="bodyMuted">{description}</AppText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? colors.accentStrong : colors.muted}
        trackColor={{ false: colors.border, true: colors.glow }}
      />
    </View>
  );
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 110,
        gap: 4,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.surfaceAlt,
        padding: 14,
      }}
    >
      <AppText variant="eyebrow">{label}</AppText>
      <AppText variant="sectionTitle">{value}</AppText>
    </View>
  );
}

function TagChip({ label, active = true }: { label: string; active?: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.border : colors.borderSubtle,
        backgroundColor: active ? colors.surfaceAlt : colors.surface,
      }}
    >
      <AppText variant="bodyMuted" style={{ color: active ? colors.text : colors.muted }}>
        {label}
      </AppText>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, saveProfile, signOut } = useSession();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [draft, setDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [sourceTarget, setSourceTarget] = useState<MediaTarget | null>(null);
  const [cameraTarget, setCameraTarget] = useState<MediaTarget | null>(null);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [audienceTab, setAudienceTab] = useState<AudienceKind>('public');
  const [mediaTab, setMediaTab] = useState<MediaKind>('story');
  const [hasLocalEdits, setHasLocalEdits] = useState(false);
  const [syncedProfileId, setSyncedProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    const nextProfileId = profile.id;
    const shouldSync = syncedProfileId !== nextProfileId || !hasLocalEdits;

    if (!shouldSync) {
      return;
    }

    setDraft(profileToDraft(profile));
    setSyncedProfileId(nextProfileId);
    setHasLocalEdits(false);
  }, [hasLocalEdits, profile, syncedProfileId]);

  const updateDraft = (updater: (current: ProfileDraft) => ProfileDraft) => {
    setHasLocalEdits(true);
    setDraft((current) => updater(current));
  };

  const layers = useMemo<Record<`${AudienceKind}-${MediaKind}`, LayerTarget>>(
    () => ({
      'public-story': {
        key: 'public-story',
        field: 'storyPhotoUrls',
        title: 'Momento público',
        description: 'Aparece para quem encontra você por perto agora.',
        aspectLabel: '4:5 vertical',
        currentItems: splitMedia(draft.storyPhotoUrls),
        tall: true,
      },
      'match-story': {
        key: 'match-story',
        field: 'matchOnlyStoryPhotoUrls',
        title: 'Momento reservado',
        description: 'Só entra para conexões aceitas.',
        aspectLabel: '4:5 vertical',
        currentItems: splitMedia(draft.matchOnlyStoryPhotoUrls),
        tall: true,
      },
      'public-photo': {
        key: 'public-photo',
        field: 'publicPhotoUrls',
        title: 'Fotos públicas',
        description: 'É a parte aberta do seu perfil.',
        aspectLabel: '1:1 retrato',
        currentItems: splitMedia(draft.publicPhotoUrls),
        tall: false,
      },
      'match-photo': {
        key: 'match-photo',
        field: 'matchOnlyPhotoUrls',
        title: 'Fotos reservadas',
        description: 'Aparecem só depois da conexão.',
        aspectLabel: '1:1 retrato',
        currentItems: splitMedia(draft.matchOnlyPhotoUrls),
        tall: false,
      },
    }),
    [draft.matchOnlyPhotoUrls, draft.matchOnlyStoryPhotoUrls, draft.publicPhotoUrls, draft.storyPhotoUrls],
  );

  const activeLayer = layers[`${audienceTab}-${mediaTab}`];
  const publicStories = layers['public-story'].currentItems;
  const privateStories = layers['match-story'].currentItems;
  const publicPhotos = layers['public-photo'].currentItems;
  const privatePhotos = layers['match-photo'].currentItems;
  const activeStories = audienceTab === 'public' ? publicStories : privateStories;
  const profileCompleteness = [draft.displayName, draft.headline, draft.bio, draft.city, draft.photoUrl].filter(Boolean).length;
  const storySubtitle = useMemo(() => {
    const publishedAt = audienceTab === 'public' ? profile?.storyPublishedAt : profile?.matchOnlyStoryPublishedAt;
    const relative = formatRelativeTime(publishedAt);
    return relative ? `Publicado ${relative}` : 'Momento publicado';
  }, [audienceTab, profile?.matchOnlyStoryPublishedAt, profile?.storyPublishedAt]);

  const applyUploadedMedia = async (uri: string, target: MediaTarget) => {
    setIsUploadingMedia(true);
    setMessage('Enviando imagem...');

    try {
      const uploadedUrl = await uploadImage(uri);

      updateDraft((current) => {
        if (target.key === 'avatar') {
          return { ...current, photoUrl: uploadedUrl };
        }

        return {
          ...current,
          [target.field]: appendLine(current[target.field], uploadedUrl),
        };
      });

      setMessage('Imagem adicionada. Salve para publicar.');
    } catch (nextError) {
      setMessage(getErrorMessage(nextError));
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const openLibrary = async (target: MediaTarget) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setMessage('Permita acesso às fotos para usar a galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: target.key === 'avatar' || !target.tall ? [1, 1] : [4, 5],
      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    const uri = result.assets[0]?.uri;

    if (!uri) {
      return;
    }

    await applyUploadedMedia(uri, target);
  };

  const openCamera = async (target: MediaTarget) => {
    const permissionResponse = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();

    if (!permissionResponse?.granted) {
      setMessage('Permita acesso à câmera para tirar uma foto agora.');
      return;
    }

    setCameraTarget(target);
  };

  const saveDraft = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      await saveProfile(draft);
      setHasLocalEdits(false);
      setSyncedProfileId(profile?.id ?? syncedProfileId);
      setMessage('Perfil salvo.');
    } catch (nextError) {
      setMessage(getErrorMessage(nextError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: 18 }}>
        <Card style={{ padding: 22, overflow: 'hidden', gap: 18 }}>
          <View
            style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: colors.glow,
              top: -58,
              right: -34,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 150,
              height: 150,
              borderRadius: 75,
              backgroundColor: colors.accentStrong,
              bottom: -42,
              left: -22,
              opacity: 0.12,
            }}
          />

          <View style={{ gap: 6 }}>
            <AppText variant="eyebrow">Seu perfil</AppText>
            <AppText variant="title" style={{ fontSize: 26, lineHeight: 32 }}>
              Mais contexto, menos cadastro.
            </AppText>
            <AppText variant="bodyMuted">Organize o que todo mundo vê e o que fica para quando a conexão for aceita.</AppText>
          </View>

          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <StoryAvatar
              uri={draft.photoUrl}
              name={draft.displayName}
              size={108}
              active={publicStories.length > 0}
              onPress={
                publicStories.length > 0
                  ? () => {
                      setAudienceTab('public');
                      setStoryViewerOpen(true);
                    }
                  : () =>
                      setSourceTarget({
                        key: 'avatar',
                        title: 'Foto principal',
                        description: 'Escolha a imagem que abre o seu perfil.',
                        aspectLabel: '1:1 retrato',
                      })
              }
            />
            <View style={{ flex: 1, gap: 8 }}>
              <AppText variant="title" style={{ fontSize: 25, lineHeight: 30 }}>
                {draft.displayName || 'Seu nome no radar'}
              </AppText>
              <AppText variant="bodyMuted">{draft.headline || 'Adicione uma frase curta para apresentar o seu momento.'}</AppText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <TagChip label={draft.city || 'Cidade'} active={Boolean(draft.city)} />
                <TagChip label={draft.professionTag || 'Interesses'} active={Boolean(draft.professionTag)} />
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <MetricBadge label="Perfil" value={`${profileCompleteness}/5`} />
            <MetricBadge label="Momentos" value={`${publicStories.length + privateStories.length}`} />
            <MetricBadge label="Fotos" value={`${publicPhotos.length + privatePhotos.length}`} />
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                title="Foto principal"
                onPress={() =>
                  setSourceTarget({
                    key: 'avatar',
                    title: 'Foto principal',
                    description: 'Escolha a imagem que abre o seu perfil.',
                    aspectLabel: '1:1 retrato',
                  })
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <SecondaryButton title="Salvar perfil" onPress={() => void saveDraft()} disabled={isSaving || isUploadingMedia} />
            </View>
          </View>
        </Card>

        <Card style={{ padding: 18 }}>
          <View style={{ gap: 6 }}>
            <AppText variant="eyebrow">Cartão</AppText>
            <AppText variant="sectionTitle">O que as pessoas entendem de você em poucos segundos.</AppText>
          </View>
          <Input
            label="Nome"
            placeholder="Como você quer aparecer"
            value={draft.displayName}
            onChangeText={(value) => updateDraft((current) => ({ ...current, displayName: value }))}
          />
          <Input
            label="Frase curta"
            placeholder="Ex: house, boas conversas, sem pressa"
            value={draft.headline}
            onChangeText={(value) => updateDraft((current) => ({ ...current, headline: value }))}
          />
          <Input
            label="Bio"
            placeholder="Uma descrição breve, humana e direta"
            multiline
            textAlignVertical="top"
            style={{ minHeight: 110 }}
            value={draft.bio}
            onChangeText={(value) => updateDraft((current) => ({ ...current, bio: value }))}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Interesses"
                placeholder="Música, arte, conversas, criação..."
                value={draft.professionTag}
                onChangeText={(value) => updateDraft((current) => ({ ...current, professionTag: value }))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Cidade"
                placeholder="São Paulo"
                value={draft.city}
                onChangeText={(value) => updateDraft((current) => ({ ...current, city: value }))}
              />
            </View>
          </View>
        </Card>

        <Card style={{ padding: 18 }}>
          <View style={{ gap: 6 }}>
            <AppText variant="eyebrow">Vitrine</AppText>
            <AppText variant="sectionTitle">Escolha a camada e publique.</AppText>
            <AppText variant="bodyMuted">Aqui você controla o que todo mundo vê primeiro e o que só entra depois do aceite.</AppText>
          </View>

          <SegmentedControl
            options={[
              { label: 'Todo mundo vê', value: 'public' as AudienceKind },
              { label: 'Só conexões', value: 'match' as AudienceKind },
            ]}
            selectedValue={audienceTab}
            onChange={setAudienceTab}
          />
          <AppText variant="bodyMuted">
            {audienceTab === 'public'
              ? 'Todo mundo vê essa camada quando encontra seu perfil por perto.'
              : 'Só conexões libera essa camada depois que o pedido é aceito.'}
          </AppText>

          <SegmentedControl
            options={[
              { label: 'Momentos', value: 'story' as MediaKind },
              { label: 'Fotos', value: 'photo' as MediaKind },
            ]}
            selectedValue={mediaTab}
            onChange={setMediaTab}
          />

          <Card tone="soft" style={{ padding: 16, gap: 12 }}>
            <View style={{ gap: 4 }}>
              <AppText variant="eyebrow">{activeLayer.title}</AppText>
              <AppText variant="sectionTitle">
                {activeLayer.currentItems.length > 0 ? `${activeLayer.currentItems.length} itens` : 'Nada publicado ainda'}
              </AppText>
              <AppText variant="bodyMuted">{activeLayer.description}</AppText>
            </View>

            <MediaStrip
              title={mediaTab === 'story' ? 'Momentos publicados' : 'Fotos publicadas'}
              items={activeLayer.currentItems.slice(0, 12)}
              tall={mediaTab === 'story'}
              emptyLabel={mediaTab === 'story' ? 'Nada publicado agora.' : 'Nenhuma foto adicionada ainda.'}
              onRemoveItem={(item) =>
                updateDraft((current) => ({
                  ...current,
                  [activeLayer.field]: removeMedia(current[activeLayer.field], item),
                }))
              }
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              {mediaTab === 'story' && activeLayer.currentItems.length > 0 ? (
                <View style={{ flex: 1 }}>
                  <SecondaryButton title="Ver momento" onPress={() => setStoryViewerOpen(true)} />
                </View>
              ) : null}
              <View style={{ flex: 1 }}>
                <PrimaryButton title={mediaTab === 'story' ? 'Publicar momento' : 'Adicionar foto'} onPress={() => setSourceTarget(activeLayer)} />
              </View>
            </View>
          </Card>
        </Card>

        <Card style={{ padding: 18 }}>
          <View style={{ gap: 6 }}>
            <AppText variant="eyebrow">Contato</AppText>
            <AppText variant="sectionTitle">O que pode sair do app.</AppText>
            <AppText variant="bodyMuted">O NearMe apresenta. O contato direto só abre quando fizer sentido.</AppText>
          </View>

          <PrivacyToggle
            title="Mostrar redes antes da conexão"
            description="Instagram, TikTok e outros links podem aparecer já na parte pública."
            value={draft.showSocialLinks}
            onValueChange={(value) => updateDraft((current) => ({ ...current, showSocialLinks: value }))}
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Instagram"
                placeholder="https://instagram.com/..."
                keyboardType="url"
                autoCapitalize="none"
                autoComplete="off"
                textContentType="URL"
                value={draft.instagramUrl}
                onChangeText={(value) => updateDraft((current) => ({ ...current, instagramUrl: value }))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="TikTok"
                placeholder="https://tiktok.com/@..."
                keyboardType="url"
                autoCapitalize="none"
                autoComplete="off"
                textContentType="URL"
                value={draft.tiktokUrl}
                onChangeText={(value) => updateDraft((current) => ({ ...current, tiktokUrl: value }))}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Snapchat"
                placeholder="https://snapchat.com/add/..."
                keyboardType="url"
                autoCapitalize="none"
                autoComplete="off"
                textContentType="URL"
                value={draft.snapchatUrl}
                onChangeText={(value) => updateDraft((current) => ({ ...current, snapchatUrl: value }))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Outro link"
                placeholder="Site, portfólio ou outro link"
                keyboardType="url"
                autoCapitalize="none"
                autoComplete="off"
                textContentType="URL"
                value={draft.otherSocialUrl}
                onChangeText={(value) => updateDraft((current) => ({ ...current, otherSocialUrl: value }))}
              />
            </View>
          </View>

          <PrivacyToggle
            title="Liberar telefone e WhatsApp após conexão"
            description="Contato direto aparece só quando a conexão for aceita."
            value={draft.showPhoneNumber}
            onValueChange={(value) => updateDraft((current) => ({ ...current, showPhoneNumber: value }))}
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Telefone"
                placeholder="+55 11 99999-9999"
                keyboardType="phone-pad"
                value={draft.phoneNumber}
                onChangeText={(value) => updateDraft((current) => ({ ...current, phoneNumber: value }))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="WhatsApp"
                placeholder="https://wa.me/5511999999999"
                value={draft.whatsappUrl}
                onChangeText={(value) => updateDraft((current) => ({ ...current, whatsappUrl: value }))}
              />
            </View>
          </View>
        </Card>

        <Card style={{ padding: 18 }}>
          <View style={{ gap: 6 }}>
            <AppText variant="eyebrow">Presença</AppText>
            <AppText variant="sectionTitle">Raio padrão quando você entra no radar.</AppText>
            <AppText variant="bodyMuted">Você controla alcance e contexto sem expor a sua posição exata.</AppText>
          </View>
          <SegmentedControl
            options={radiusOptions}
            selectedValue={draft.preferredRadiusMeters}
            onChange={(value) => updateDraft((current) => ({ ...current, preferredRadiusMeters: value }))}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <TagChip label="Presença intencional" />
            <TagChip label="Descoberta por proximidade" />
            <TagChip label="Privacidade antes do aceite" />
          </View>
        </Card>

        {message ? (
          <Card tone="soft" style={{ padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="sparkles" size={18} color={colors.accentStrong} />
              <AppText variant="bodyMuted">{message}</AppText>
            </View>
          </Card>
        ) : null}

        <PrimaryButton title={isSaving ? 'Salvando...' : 'Salvar perfil'} onPress={() => void saveDraft()} disabled={isSaving || isUploadingMedia} />
        <SecondaryButton
          title="Sair"
          onPress={async () => {
            await signOut();
            router.replace('/login');
          }}
        />
      </View>

      <MediaSourceSheet
        visible={Boolean(sourceTarget)}
        title={sourceTarget?.title ?? 'Mídia'}
        description={sourceTarget?.description ?? 'Escolha a origem da sua mídia.'}
        onClose={() => setSourceTarget(null)}
        onPickCamera={() => {
          const target = sourceTarget;
          setSourceTarget(null);

          if (!target) {
            return;
          }

          void openCamera(target);
        }}
        onPickLibrary={() => {
          const target = sourceTarget;
          setSourceTarget(null);

          if (!target) {
            return;
          }

          void openLibrary(target);
        }}
      />

      <CameraCaptureModal
        visible={Boolean(cameraTarget)}
        title={cameraTarget?.title ?? 'Câmera'}
        description={cameraTarget?.description ?? 'Capture a imagem do momento.'}
        aspectLabel={cameraTarget?.aspectLabel ?? '1:1 retrato'}
        uploading={isUploadingMedia}
        onClose={() => setCameraTarget(null)}
        onCapture={async (uri) => {
          if (!cameraTarget) {
            return;
          }

          await applyUploadedMedia(uri, cameraTarget);
          setCameraTarget(null);
        }}
      />

      <StoryViewerModal
        visible={storyViewerOpen}
        name={draft.displayName || 'Seu momento'}
        items={activeStories}
        subtitle={storySubtitle}
        onClose={() => setStoryViewerOpen(false)}
      />
    </Screen>
  );
}
