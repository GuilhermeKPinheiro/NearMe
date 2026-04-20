import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { listNotifications } from '@/services/notifications';
import { realtimeClient } from '@/services/realtime';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';

export default function MainLayout() {
  const { isAuthenticated } = useSession();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifications(0);
      return;
    }

    let isMounted = true;

    const refreshNotifications = async () => {
      try {
        const items = await listNotifications();

        if (!isMounted) {
          return;
        }

        setUnreadNotifications(items.filter((item) => !item.readAt).length);
      } catch {
        if (isMounted) {
          setUnreadNotifications(0);
        }
      }
    };

    void refreshNotifications();
    const interval = setInterval(() => {
      void refreshNotifications();
    }, 30000);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshNotifications();
      }
    });
    const unsubscribeRealtime = realtimeClient.subscribe('notifications:updated', () => {
      void refreshNotifications();
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      subscription.remove();
      unsubscribeRealtime();
    };
  }, [isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentStrong,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Agora',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: 'Pessoas',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => <Ionicons name="ticket-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: 'Conexões',
          tabBarBadge: unreadNotifications > 0 ? unreadNotifications : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Eu',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="venue-entry"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="event-editor"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
