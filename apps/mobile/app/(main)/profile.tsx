import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Switch, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '@/components/avatar';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { MediaStrip } from '@/components/media-strip';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { SegmentedControl } from '@/components/segmented-control';
import { AppText } from '@/components/text';
import { emptyProfileDraft, profileToDraft, type ProfileDraft } from '@/services/profile';
import { getErrorMessage } from '@/services/http';
import { uploadImage } from '@/services/uploads';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';

const radiusOptions = [
  { label: '100 m', value: 100 },
  { label: '1 km', value: 1000 },
  { label: '10 km', value: 10000 },
];

type PhotoField = 'publicPhotoUrls' | 'matchOnlyPhotoUrls' | 'storyPhotoUrls' | 'matchOnlyStoryPhotoUrls';
type MediaMode = 'public-story' | 'match-story' | 'public-photo' | 'match-photo';

function appendLine(current: string, value: string) {
  return [current.trim(), value].filter(Boolean).join('\n');
}

function splitMedia(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
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

function MediaPanel({
  title,
  description,
  items,
  onAdd,
  tall,
}: {
  title: string;
  description: string;
  items: string[];
  onAdd: () => void;
  tall?: boolean;
}) {
  return (
    <Card tone="soft" style={{ padding: 14 }}>
      <View style={{ gap: 4 }}>
        <AppText variant="eyebrow">{title}</AppText>
        <AppText variant="sectionTitle">{items.length} itens</AppText>
        <AppText variant="bodyMuted">{description}</AppText>
      </View>
      <MediaStrip title="Preview" items={items.slice(0, 6)} tall={tall} emptyLabel="Nenhuma mídia adicionada ainda." />
      <SecondaryButton title="Adicionar" compact onPress={onAdd} />
    </Card>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, saveProfile, signOut } = useSession();
  const [draft, setDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [message, setMessage] = useState('');
  const [mediaMode, setMediaMode] = useState<MediaMode>('public-story');

  useEffect(() => {
    if (!profile) {
      return;
    }

    setDraft(profileToDraft(profile));
  }, [profile]);

  const pickImage = async (field?: PhotoField) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setMessage('Permita acesso às fotos para escolher uma imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: field?.includes('Story') ? [4, 5] : [1, 1],
      quality: 0.85,
    });

    if (result.canceled) {
      return;
    }

    const uri = result.assets[0]?.uri;

    if (!uri) {
      return;
    }

    try {
      setMessage('Enviando imagem...');
      const uploadedUrl = await uploadImage(uri);
      setDraft((current) => (field ? { ...current, [field]: appendLine(current[field], uploadedUrl) } : { ...current, photoUrl: uploadedUrl }));
      setMessage('Imagem enviada com sucesso.');
    } catch (nextError) {
      setMessage(getErrorMessage(nextError));
    }
  };

  const mediaPanels = {
    'public-story': {
      title: 'Story público',
      description: 'Aparece para quem está vendo você por perto.',
      items: splitMedia(draft.storyPhotoUrls),
      field: 'storyPhotoUrls' as PhotoField,
      tall: true,
    },
    'match-story': {
      title: 'Story só match',
      description: 'Fica reservado para conexões aceitas.',
      items: splitMedia(draft.matchOnlyStoryPhotoUrls),
      field: 'matchOnlyStoryPhotoUrls' as PhotoField,
      tall: true,
    },
    'public-photo': {
      title: 'Fotos públicas',
      description: 'Compõem a vitrine básica do seu perfil.',
      items: splitMedia(draft.publicPhotoUrls),
      field: 'publicPhotoUrls' as PhotoField,
      tall: false,
    },
    'match-photo': {
      title: 'Fotos privadas',
      description: 'Liberadas apenas depois do match.',
      items: splitMedia(draft.matchOnlyPhotoUrls),
      field: 'matchOnlyPhotoUrls' as PhotoField,
      tall: false,
    },
  };

  const activeMediaPanel = mediaPanels[mediaMode];

  return (
    <Screen scroll>
      <View style={{ gap: 18 }}>
        <SectionHeader
          eyebrow="Perfil"
          title="Controle sua vitrine na festa."
          description="Defina o que aparece para todos, o que fica reservado para match e como você quer ser encontrado."
        />

        <Card style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Avatar uri={draft.photoUrl} name={draft.displayName} size={112} />
            <View style={{ flex: 1, gap: 8 }}>
              <AppText variant="sectionTitle">{draft.displayName || 'Sua identidade principal'}</AppText>
              <AppText variant="bodyMuted">{draft.headline || 'Escolha uma foto e uma frase curta para o primeiro contato.'}</AppText>
              <SecondaryButton title="Trocar foto principal" onPress={() => pickImage()} />
            </View>
          </View>
        </Card>

        <Card style={{ padding: 18 }}>
          <SectionHeader
            eyebrow="Identidade"
            title="Como você aparece."
            description="Esses dados montam o topo do seu perfil e ajudam a puxar assunto."
          />
          <Input
            label="Nome"
            placeholder="Como você quer aparecer"
            value={draft.displayName}
            onChangeText={(value) => setDraft((current) => ({ ...current, displayName: value }))}
          />
          <Input
            label="Frase curta"
            placeholder="Ex: set de house, boas conversas, sem pressa"
            value={draft.headline}
            onChangeText={(value) => setDraft((current) => ({ ...current, headline: value }))}
          />
          <Input
            label="Sobre você"
            placeholder="Uma bio curta para puxar assunto"
            value={draft.bio}
            onChangeText={(value) => setDraft((current) => ({ ...current, bio: value }))}
          />
          <Input
            label="Vibe ou interesses"
            placeholder="Música, festa, arte, viagem..."
            value={draft.professionTag}
            onChangeText={(value) => setDraft((current) => ({ ...current, professionTag: value }))}
          />
          <Input label="Cidade" placeholder="São Paulo" value={draft.city} onChangeText={(value) => setDraft((current) => ({ ...current, city: value }))} />
        </Card>

        <Card style={{ padding: 18 }}>
          <SectionHeader
            eyebrow="Redes e contato"
            title="Defina o que pode ser liberado."
            description="O app deve funcionar como ponte para suas redes, sem abrir tudo antes da hora."
          />
          <PrivacyToggle
            title="Mostrar redes antes do match"
            description="A pessoa vê seus links públicos sem acessar suas partes reservadas."
            value={draft.showSocialLinks}
            onValueChange={(value) => setDraft((current) => ({ ...current, showSocialLinks: value }))}
          />
          <Input
            label="Instagram"
            placeholder="https://instagram.com/..."
            value={draft.instagramUrl}
            onChangeText={(value) => setDraft((current) => ({ ...current, instagramUrl: value }))}
          />
          <Input
            label="TikTok"
            placeholder="https://tiktok.com/@..."
            value={draft.tiktokUrl}
            onChangeText={(value) => setDraft((current) => ({ ...current, tiktokUrl: value }))}
          />
          <Input
            label="Snapchat"
            placeholder="https://snapchat.com/add/..."
            value={draft.snapchatUrl}
            onChangeText={(value) => setDraft((current) => ({ ...current, snapchatUrl: value }))}
          />
          <Input
            label="Outro link"
            placeholder="Site, X, Threads ou outra rede"
            value={draft.otherSocialUrl}
            onChangeText={(value) => setDraft((current) => ({ ...current, otherSocialUrl: value }))}
          />
          <PrivacyToggle
            title="Liberar telefone e WhatsApp após match"
            description="O contato direto só aparece para conexões aceitas."
            value={draft.showPhoneNumber}
            onValueChange={(value) => setDraft((current) => ({ ...current, showPhoneNumber: value }))}
          />
          <Input
            label="Telefone"
            placeholder="+55 11 99999-9999"
            keyboardType="phone-pad"
            value={draft.phoneNumber}
            onChangeText={(value) => setDraft((current) => ({ ...current, phoneNumber: value }))}
          />
          <Input
            label="Link WhatsApp"
            placeholder="https://wa.me/5511999999999"
            value={draft.whatsappUrl}
            onChangeText={(value) => setDraft((current) => ({ ...current, whatsappUrl: value }))}
          />
        </Card>

        <Card style={{ padding: 18 }}>
          <SectionHeader
            eyebrow="Mídia"
            title="Monte sua vitrine por camada."
            description="Stories mostram o momento. Fotos sustentam o perfil. Você decide o que é público e o que fica para match."
          />
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                {mediaMode === 'public-story' ? (
                  <PrimaryButton title="Story público" compact onPress={() => undefined} />
                ) : (
                  <SecondaryButton title="Story público" compact onPress={() => setMediaMode('public-story')} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                {mediaMode === 'match-story' ? (
                  <PrimaryButton title="Story só match" compact onPress={() => undefined} />
                ) : (
                  <SecondaryButton title="Story só match" compact onPress={() => setMediaMode('match-story')} />
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                {mediaMode === 'public-photo' ? (
                  <PrimaryButton title="Fotos públicas" compact onPress={() => undefined} />
                ) : (
                  <SecondaryButton title="Fotos públicas" compact onPress={() => setMediaMode('public-photo')} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                {mediaMode === 'match-photo' ? (
                  <PrimaryButton title="Fotos privadas" compact onPress={() => undefined} />
                ) : (
                  <SecondaryButton title="Fotos privadas" compact onPress={() => setMediaMode('match-photo')} />
                )}
              </View>
            </View>
          </View>
          <MediaPanel
            title={activeMediaPanel.title}
            description={activeMediaPanel.description}
            items={activeMediaPanel.items}
            tall={activeMediaPanel.tall}
            onAdd={() => pickImage(activeMediaPanel.field)}
          />
        </Card>

        <Card style={{ padding: 18 }}>
          <SectionHeader
            eyebrow="Raio padrão"
            title="Controle sua distância."
            description="Defina o alcance inicial sempre que entrar no radar."
          />
          <SegmentedControl
            options={radiusOptions}
            selectedValue={draft.preferredRadiusMeters}
            onChange={(value) => setDraft((current) => ({ ...current, preferredRadiusMeters: value }))}
          />
        </Card>

        {message ? <AppText variant="bodyMuted">{message}</AppText> : null}
        <PrimaryButton
          title="Salvar perfil"
          onPress={() => {
            saveProfile(draft)
              .then(() => setMessage('Perfil salvo.'))
              .catch((nextError) => setMessage(getErrorMessage(nextError)));
          }}
        />
        <SecondaryButton
          title="Sair"
          onPress={async () => {
            await signOut();
            router.replace('/login');
          }}
        />
      </View>
    </Screen>
  );
}
