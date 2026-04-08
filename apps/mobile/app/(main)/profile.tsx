import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Switch, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { Card } from '@/components/card';
import { Input } from '@/components/input';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Avatar } from '@/components/avatar';
import { emptyProfileDraft, profileToDraft, type ProfileDraft } from '@/services/profile';
import { getErrorMessage } from '@/services/http';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';

const radiusOptions = [
  { label: '100 m', value: 100 },
  { label: '1 km', value: 1000 },
  { label: '10 km', value: 10000 }
];

type PhotoField = 'publicPhotoUrls' | 'matchOnlyPhotoUrls' | 'storyPhotoUrls' | 'matchOnlyStoryPhotoUrls';

function appendLine(current: string, value: string) {
  return [current.trim(), value].filter(Boolean).join('\n');
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, saveProfile, signOut } = useSession();
  const [draft, setDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!profile) {
      return;
    }

    setDraft(profileToDraft(profile));
  }, [profile]);

  const pickImage = async (field?: PhotoField) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setMessage('Permita acesso as fotos para escolher uma imagem.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85
    });

    if (result.canceled) {
      return;
    }

    const uri = result.assets[0]?.uri;

    if (!uri) {
      return;
    }

    setDraft((current) => (field ? { ...current, [field]: appendLine(current[field], uri) } : { ...current, photoUrl: uri }));
  };

  return (
    <Screen scroll>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 6 }}>
          <AppText variant="eyebrow">Perfil prime</AppText>
          <AppText variant="title">Controle o que aparece na festa.</AppText>
          <AppText variant="bodyMuted">
            Redes podem aparecer sem liberar tudo. Telefone e fotos privadas ficam para depois do match.
          </AppText>
        </View>

        <Card>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <Avatar uri={draft.photoUrl} name={draft.displayName} size={112} />
            <SecondaryButton title="Trocar foto principal" onPress={() => pickImage()} />
          </View>
        </Card>

        <Card>
          <View style={{ gap: 12 }}>
            <Input
              label="Nome"
              placeholder="Como voce quer aparecer"
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
              label="Sobre voce"
              placeholder="Uma bio curta para puxar assunto"
              value={draft.bio}
              onChangeText={(value) => setDraft((current) => ({ ...current, bio: value }))}
            />
            <Input
              label="Vibe/interesses"
              placeholder="Musica, festa, arte, viagem..."
              value={draft.professionTag}
              onChangeText={(value) => setDraft((current) => ({ ...current, professionTag: value }))}
            />
            <Input
              label="Cidade"
              placeholder="Sao Paulo"
              value={draft.city}
              onChangeText={(value) => setDraft((current) => ({ ...current, city: value }))}
            />
          </View>
        </Card>

        <Card>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <AppText variant="sectionTitle">Mostrar redes antes do match</AppText>
                <AppText variant="bodyMuted">A pessoa ve seus links, mas nao recebe acesso privado ao perfil.</AppText>
              </View>
              <Switch
                value={draft.showSocialLinks}
                onValueChange={(value) => setDraft((current) => ({ ...current, showSocialLinks: value }))}
                thumbColor={draft.showSocialLinks ? colors.accentStrong : colors.muted}
                trackColor={{ false: colors.border, true: colors.glow }}
              />
            </View>
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
          </View>
        </Card>

        <Card>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <AppText variant="sectionTitle">Liberar telefone/WhatsApp apos match</AppText>
                <AppText variant="bodyMuted">O numero so aparece para conexoes aceitas.</AppText>
              </View>
              <Switch
                value={draft.showPhoneNumber}
                onValueChange={(value) => setDraft((current) => ({ ...current, showPhoneNumber: value }))}
                thumbColor={draft.showPhoneNumber ? colors.accentStrong : colors.muted}
                trackColor={{ false: colors.border, true: colors.glow }}
              />
            </View>
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
          </View>
        </Card>

        <Card>
          <View style={{ gap: 12 }}>
            <AppText variant="sectionTitle">Fotos e stories</AppText>
            <AppText variant="bodyMuted">Organize a vitrine do seu perfil em camadas: aberto para todos, so para match e stories do momento.</AppText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Card style={{ padding: 14 }}>
                  <AppText variant="eyebrow">Story publico</AppText>
                  <AppText variant="sectionTitle">{draft.storyPhotoUrls.split('\n').filter(Boolean).length}</AppText>
                  <SecondaryButton title="Adicionar" compact onPress={() => pickImage('storyPhotoUrls')} />
                </Card>
              </View>
              <View style={{ flex: 1 }}>
                <Card style={{ padding: 14 }}>
                  <AppText variant="eyebrow">Story so match</AppText>
                  <AppText variant="sectionTitle">{draft.matchOnlyStoryPhotoUrls.split('\n').filter(Boolean).length}</AppText>
                  <SecondaryButton
                    title="Adicionar"
                    compact
                    onPress={() => pickImage('matchOnlyStoryPhotoUrls')}
                  />
                </Card>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Card style={{ padding: 14 }}>
                  <AppText variant="eyebrow">Fotos publicas</AppText>
                  <AppText variant="sectionTitle">{draft.publicPhotoUrls.split('\n').filter(Boolean).length}</AppText>
                  <SecondaryButton title="Adicionar" compact onPress={() => pickImage('publicPhotoUrls')} />
                </Card>
              </View>
              <View style={{ flex: 1 }}>
                <Card style={{ padding: 14 }}>
                  <AppText variant="eyebrow">Fotos privadas</AppText>
                  <AppText variant="sectionTitle">{draft.matchOnlyPhotoUrls.split('\n').filter(Boolean).length}</AppText>
                  <SecondaryButton title="Adicionar" compact onPress={() => pickImage('matchOnlyPhotoUrls')} />
                </Card>
              </View>
            </View>
          </View>
        </Card>

        <Card>
          <View style={{ gap: 12 }}>
            <AppText variant="sectionTitle">Raio padrao</AppText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {radiusOptions.map((option) => (
                <View key={option.value} style={{ flex: 1 }}>
                  {draft.preferredRadiusMeters === option.value ? (
                    <PrimaryButton title={option.label} compact onPress={() => undefined} />
                  ) : (
                    <SecondaryButton
                      title={option.label}
                      compact
                      onPress={() => setDraft((current) => ({ ...current, preferredRadiusMeters: option.value }))}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
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
