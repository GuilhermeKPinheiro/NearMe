import { useCallback, useMemo, useState } from 'react';
import { AppState, Linking, Modal, Pressable, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { Card } from '@/components/card';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { StoryAvatar } from '@/components/story-avatar';
import { MediaStrip } from '@/components/media-strip';
import { SectionHeader } from '@/components/section-header';
import { SegmentedControl } from '@/components/segmented-control';
import {
  acceptConnectionRequest,
  blockUser,
  disconnectConnection,
  listConnectionState,
  rejectConnectionRequest,
} from '@/services/connections';
import { getErrorMessage } from '@/services/http';
import { listNotifications, markNotificationsAsRead } from '@/services/notifications';
import { realtimeClient } from '@/services/realtime';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';
import type { Connection, ConnectionState, NotificationItem, ReceivedConnectionRequest } from '@/types/domain';
import { formatRelativeTime } from '@/utils/time';

type TabValue = 'received' | 'connections' | 'sent';

function splitPhotos(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeConnectionState(nextState: ConnectionState): ConnectionState {
  const seenConnectionUsers = new Set<string>();
  const connections: Connection[] = [];

  for (const item of nextState.connections) {
    if (seenConnectionUsers.has(item.user.id)) {
      continue;
    }

    seenConnectionUsers.add(item.user.id);
    connections.push(item);
  }

  const received: ReceivedConnectionRequest[] = nextState.received.filter(
    (item) => item.status === 'PENDING' && !seenConnectionUsers.has(item.fromUser.id)
  );

  return {
    received,
    sent: nextState.sent,
    connections,
  };
}

function LinkLine({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return null;
  }

  return <SecondaryButton title={label} compact onPress={() => Linking.openURL(url)} />;
}

type ConnectionDetailModalProps = {
  item: Connection | null;
  onClose: () => void;
  onDisconnect: (item: Connection) => void;
  onBlock: (item: Connection) => void;
  pendingAction: 'disconnect' | 'block' | null;
};

function ConnectionDetailModal({
  item,
  onClose,
  onDisconnect,
  onBlock,
  pendingAction,
}: ConnectionDetailModalProps) {
  const privatePhotos = splitPhotos(item?.user.matchOnlyPhotoUrls ?? '');
  const privateStories = splitPhotos(item?.user.matchOnlyStoryPhotoUrls ?? '');
  const connectedLabel = item?.createdAt ? formatRelativeTime(item.createdAt) : null;

  return (
    <Modal visible={Boolean(item)} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <Screen scroll>
        <View style={{ gap: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="sectionTitle">Conexão</AppText>
            <Pressable
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surfaceAlt,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>

          {item ? (
            <>
              <Card style={{ padding: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <StoryAvatar uri={item.user.photoUrl} name={item.user.displayName} size={84} active={privateStories.length > 0} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <AppText variant="title" style={{ fontSize: 24, lineHeight: 30 }}>
                      {item.user.displayName}
                    </AppText>
                    <AppText variant="bodyMuted">{item.user.headline || 'Conectados no tempo certo.'}</AppText>
                    {connectedLabel ? <AppText variant="bodyMuted">Conectados {connectedLabel}</AppText> : null}
                  </View>
                </View>
              </Card>

              {privateStories.length ? <MediaStrip title="Momentos" items={privateStories} tall /> : null}
              {privatePhotos.length ? <MediaStrip title="Fotos" items={privatePhotos} /> : null}

              <Card tone="soft">
                <AppText variant="sectionTitle">Dentro do app</AppText>
                <AppText variant="bodyMuted">Veja o que essa conexão abriu para você sem sair do NearMe.</AppText>
              </Card>

              <Card>
                <AppText variant="sectionTitle">Links liberados</AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <LinkLine label="Instagram" url={item.user.instagramUrl} />
                  <LinkLine label="TikTok" url={item.user.tiktokUrl} />
                  <LinkLine label="Snapchat" url={item.user.snapchatUrl} />
                  <LinkLine label="Outro link" url={item.user.otherSocialUrl} />
                  <LinkLine label="WhatsApp" url={item.user.whatsappUrl} />
                </View>
                {!item.user.instagramUrl &&
                !item.user.tiktokUrl &&
                !item.user.snapchatUrl &&
                !item.user.otherSocialUrl &&
                !item.user.whatsappUrl ? (
                  <AppText variant="bodyMuted">Essa conexão ainda não liberou links diretos.</AppText>
                ) : null}
              </Card>

              <Card tone="soft">
                <AppText variant="sectionTitle">Controle da conexão</AppText>
                <AppText variant="bodyMuted">
                  Você pode encerrar essa conexão ou bloquear essa pessoa para ela não aparecer mais no seu radar.
                </AppText>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton
                      title={pendingAction === 'disconnect' ? 'Desconectando...' : 'Desconectar'}
                      disabled={pendingAction !== null}
                      onPress={() => onDisconnect(item)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton
                      title={pendingAction === 'block' ? 'Bloqueando...' : 'Bloquear'}
                      disabled={pendingAction !== null}
                      style={{ borderColor: colors.danger }}
                      onPress={() => onBlock(item)}
                    />
                  </View>
                </View>
              </Card>
            </>
          ) : null}
        </View>
      </Screen>
    </Modal>
  );
}

export default function ConnectionsScreen() {
  const { refreshDashboard } = useSession();
  const [state, setState] = useState<ConnectionState>({
    received: [],
    sent: [],
    connections: [],
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabValue>('connections');
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [pendingDetailAction, setPendingDetailAction] = useState<'disconnect' | 'block' | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [nextState, nextNotifications] = await Promise.all([listConnectionState(), listNotifications()]);
    setState(normalizeConnectionState(nextState));
    setNotifications(nextNotifications);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const refresh = async () => {
        try {
          const [nextState, nextNotifications] = await Promise.all([listConnectionState(), listNotifications()]);

          if (!active) {
            return;
          }

          setState(normalizeConnectionState(nextState));
          setNotifications(nextNotifications);

          if (nextNotifications.some((item) => !item.readAt)) {
            await markNotificationsAsRead();

            if (!active) {
              return;
            }

            setNotifications((current) =>
              current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() }))
            );
          }
        } catch (nextError) {
          if (active) {
            setError(getErrorMessage(nextError));
          }
        }
      };

      void refresh();
      const unsubscribeConnections = realtimeClient.subscribe('connections:updated', () => {
        void refresh();
      });
      const unsubscribeNotifications = realtimeClient.subscribe('notifications:updated', () => {
        void refresh();
      });
      const appStateSubscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          void refresh();
        }
      });

      return () => {
        active = false;
        unsubscribeConnections();
        unsubscribeNotifications();
        appStateSubscription.remove();
      };
    }, [load])
  );

  const tabOptions = useMemo(
    () => [
      { label: `Recebidos ${state.received.length}`, value: 'received' as TabValue },
      { label: `Conexões ${state.connections.length}`, value: 'connections' as TabValue },
      { label: `Enviados ${state.sent.length}`, value: 'sent' as TabValue },
    ],
    [state.connections.length, state.received.length, state.sent.length]
  );

  const unreadNotifications = notifications.filter((item) => !item.readAt);

  return (
    <Screen scroll>
      <View style={{ gap: 18 }}>
        <SectionHeader
          eyebrow="Conexões"
          title="Sua rede por proximidade."
          description="Pedidos, conexões ativas e atualizações do seu círculo ficam organizados para a conversa continuar dentro do NearMe."
        />

        {unreadNotifications.length ? (
          <Card tone="soft">
            <AppText variant="sectionTitle">Atualizações do seu círculo</AppText>
            {unreadNotifications.slice(0, 3).map((item) => (
              <View key={item.id} style={{ gap: 4 }}>
                <AppText variant="body">{item.title}</AppText>
                <AppText variant="bodyMuted">
                  {item.body}
                  {item.createdAt ? ` · ${formatRelativeTime(item.createdAt)}` : ''}
                </AppText>
              </View>
            ))}
          </Card>
        ) : null}

        <SegmentedControl options={tabOptions} selectedValue={selectedTab} onChange={setSelectedTab} />

        {error ? <AppText variant="bodyMuted">{error}</AppText> : null}

        {selectedTab === 'received' ? (
          <Card tone="soft">
            <AppText variant="sectionTitle">Pedidos recebidos</AppText>
            {state.received.map((item) => (
              <View key={item.id} style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <StoryAvatar uri={item.fromUser.photoUrl} name={item.fromUser.displayName} size={58} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="sectionTitle">{item.fromUser.displayName}</AppText>
                    <AppText variant="bodyMuted">{item.fromUser.headline || 'Encontrou você por perto'}</AppText>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <SecondaryButton
                      title="Agora não"
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
                      title="Aceitar"
                      onPress={() => {
                        acceptConnectionRequest(item.id)
                          .then(async () => {
                            await load();
                            await refreshDashboard();
                            setSelectedTab('connections');
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
        ) : null}

        {selectedTab === 'connections' ? (
          <>
            <Card tone="soft">
              <AppText variant="sectionTitle">Conexões ativas</AppText>
              <AppText variant="bodyMuted">Toque em uma conexão para ver momentos, fotos e o que foi liberado dentro do app.</AppText>
            </Card>
            {state.connections.map((item) => {
              const privateStories = splitPhotos(item.user.matchOnlyStoryPhotoUrls);
              const privatePhotos = splitPhotos(item.user.matchOnlyPhotoUrls);
              const connectedLabel = formatRelativeTime(item.createdAt);

              return (
                <Pressable key={item.id} onPress={() => setSelectedConnection(item)}>
                  <Card style={{ padding: 18 }}>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      <StoryAvatar uri={item.user.photoUrl} name={item.user.displayName} size={62} active={privateStories.length > 0} />
                      <View style={{ flex: 1, gap: 4 }}>
                        <AppText variant="sectionTitle">{item.user.displayName}</AppText>
                        <AppText variant="bodyMuted">{item.user.headline || 'Conexão ativa'}</AppText>
                        {connectedLabel ? <AppText variant="bodyMuted">Conectados {connectedLabel}</AppText> : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                    </View>
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
                        <AppText variant="bodyMuted">{privateStories.length} momentos liberados</AppText>
                      </View>
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
                        <AppText variant="bodyMuted">{privatePhotos.length} fotos liberadas</AppText>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
            {state.connections.length === 0 ? <AppText variant="bodyMuted">Nenhuma conexão ativa ainda.</AppText> : null}
          </>
        ) : null}

        {selectedTab === 'sent' ? (
          <Card tone="soft">
            <AppText variant="sectionTitle">Pedidos enviados</AppText>
            {state.sent.map((item) => (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <StoryAvatar uri={item.toUser.photoUrl} name={item.toUser.displayName} size={48} />
                <View style={{ flex: 1 }}>
                  <AppText variant="body">{item.toUser.displayName}</AppText>
                  <AppText variant="bodyMuted">Status: {item.status === 'PENDING' ? 'Aguardando resposta' : item.status}</AppText>
                </View>
              </View>
            ))}
            {state.sent.length === 0 ? <AppText variant="bodyMuted">Nenhum pedido enviado.</AppText> : null}
          </Card>
        ) : null}
      </View>

      <ConnectionDetailModal
        item={selectedConnection}
        onClose={() => {
          setSelectedConnection(null);
          setPendingDetailAction(null);
        }}
        pendingAction={pendingDetailAction}
        onDisconnect={(item) => {
          setPendingDetailAction('disconnect');
          disconnectConnection(item.id)
            .then(async () => {
              await load();
              await refreshDashboard();
              setSelectedConnection(null);
            })
            .catch((nextError) => setError(getErrorMessage(nextError)))
            .finally(() => setPendingDetailAction(null));
        }}
        onBlock={(item) => {
          setPendingDetailAction('block');
          blockUser(item.user.id)
            .then(async () => {
              await load();
              await refreshDashboard();
              setSelectedConnection(null);
            })
            .catch((nextError) => setError(getErrorMessage(nextError)))
            .finally(() => setPendingDetailAction(null));
        }}
      />
    </Screen>
  );
}
