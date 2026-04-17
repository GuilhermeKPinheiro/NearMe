import { useEffect, useState } from 'react';
import { Image, Linking, ScrollView, View } from 'react-native';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { Card } from '@/components/card';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Avatar } from '@/components/avatar';
import { MediaStrip } from '@/components/media-strip';
import { SectionHeader } from '@/components/section-header';
import { acceptConnectionRequest, listConnectionState, rejectConnectionRequest } from '@/services/connections';
import { getErrorMessage } from '@/services/http';
import { useSession } from '@/state/session';
import type { ConnectionState } from '@/types/domain';

function splitPhotos(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function LinkLine({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return null;
  }

  return <SecondaryButton title={label} compact onPress={() => Linking.openURL(url)} />;
}

export default function ConnectionsScreen() {
  const { refreshDashboard } = useSession();
  const [state, setState] = useState<ConnectionState>({
    received: [],
    sent: [],
    connections: []
  });
  const [error, setError] = useState('');

  const load = async () => {
    const nextState = await listConnectionState();
    setState(nextState);
  };

  useEffect(() => {
    load().catch((nextError) => {
      setError(getErrorMessage(nextError));
    });
  }, []);

  return (
    <Screen scroll>
      <View style={{ gap: 18 }}>
        <SectionHeader
          eyebrow="Matches"
          title="Matches para levar para suas redes."
          description="Aqui nao vira chat pesado: aceite e continue pelo Instagram, TikTok ou WhatsApp."
        />

        {error ? <AppText variant="bodyMuted">{error}</AppText> : null}

        <Card tone="soft">
          <AppText variant="sectionTitle">Querem te conhecer</AppText>
          {state.received.map((item) => (
            <View key={item.id} style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar uri={item.fromUser.photoUrl} name={item.fromUser.displayName} size={58} />
                <View style={{ flex: 1 }}>
                  <AppText variant="sectionTitle">{item.fromUser.displayName}</AppText>
                  <AppText variant="bodyMuted">{item.fromUser.headline || 'Te encontrou por perto'}</AppText>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <SecondaryButton
                    title="Agora nao"
                    onPress={() => {
                      rejectConnectionRequest(item.id)
                        .then(async () => {
                          await load();
                          await refreshDashboard();
                        })
                        .catch((nextError) => setError(getErrorMessage(nextError)));
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title="Dar match"
                    onPress={() => {
                      acceptConnectionRequest(item.id)
                        .then(async () => {
                          await load();
                          await refreshDashboard();
                        })
                        .catch((nextError) => setError(getErrorMessage(nextError)));
                    }}
                  />
                </View>
              </View>
            </View>
          ))}
          {state.received.length === 0 ? <AppText variant="bodyMuted">Nenhum pedido novo por enquanto.</AppText> : null}
        </Card>

        <Card>
          <AppText variant="sectionTitle">Seus matches</AppText>
          {state.connections.map((item) => {
            const privatePhotos = splitPhotos(item.user.matchOnlyPhotoUrls);
            const privateStories = splitPhotos(item.user.matchOnlyStoryPhotoUrls);

            return (
              <View key={item.id} style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <Avatar uri={item.user.photoUrl} name={item.user.displayName} size={58} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="sectionTitle">{item.user.displayName}</AppText>
                    <AppText variant="bodyMuted">{item.user.headline || 'Contato liberado'}</AppText>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <LinkLine label="Instagram" url={item.user.instagramUrl} />
                  <LinkLine label="TikTok" url={item.user.tiktokUrl} />
                  <LinkLine label="Snapchat" url={item.user.snapchatUrl} />
                  <LinkLine label="Outro link" url={item.user.otherSocialUrl} />
                  <LinkLine label="WhatsApp" url={item.user.whatsappUrl} />
                </View>
                {privatePhotos.length ? <MediaStrip title="Fotos privadas" items={privatePhotos} /> : null}
                {privateStories.length ? <MediaStrip title="Stories reservados" items={privateStories} tall /> : null}
              </View>
            );
          })}
          {state.connections.length === 0 ? <AppText variant="bodyMuted">Ainda nenhum match aceito.</AppText> : null}
        </Card>

        <Card tone="soft">
          <AppText variant="sectionTitle">Curtidas enviadas</AppText>
          {state.sent.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar uri={item.toUser.photoUrl} name={item.toUser.displayName} size={48} />
              <View style={{ flex: 1 }}>
                <AppText variant="body">{item.toUser.displayName}</AppText>
                <AppText variant="bodyMuted">Status: {item.status}</AppText>
              </View>
            </View>
          ))}
          {state.sent.length === 0 ? <AppText variant="bodyMuted">Nenhuma curtida enviada.</AppText> : null}
        </Card>
      </View>
    </Screen>
  );
}
