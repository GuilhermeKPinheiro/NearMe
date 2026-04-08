import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentStrong,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Agora',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: 'Pessoas',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Eventos',
          tabBarIcon: ({ color, size }) => <Ionicons name="ticket-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="connections"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Eu',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="venue-entry"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="event-editor"
        options={{
          href: null
        }}
      />
    </Tabs>
  );
}
