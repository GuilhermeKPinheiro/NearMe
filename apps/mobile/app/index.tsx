import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { NearMeLogo } from '@/components/logo';
import { useSession } from '@/state/session';

export default function Index() {
  const { isAuthenticated, hasSeenOnboarding, isBootstrapped } = useSession();

  if (!isBootstrapped) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <NearMeLogo />
          <AppText variant="bodyMuted">Preparando quem esta por perto...</AppText>
        </View>
      </Screen>
    );
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/home" />;
}
