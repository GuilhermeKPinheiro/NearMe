import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { Input } from '@/components/input';
import { PrimaryButton, SecondaryButton } from '@/components/button';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  return (
    <Screen scroll>
      <View style={{ gap: 18 }}>
        <View style={{ gap: 8 }}>
          <AppText variant="title">Recuperar senha</AppText>
          <AppText variant="bodyMuted">Tela de base para integrar o endpoint de redefinição depois.</AppText>
        </View>

        <Input label="E-mail" placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none" />
        <PrimaryButton title="Enviar link" onPress={() => undefined} />
        <SecondaryButton title="Voltar ao login" onPress={() => router.push('/login')} />
      </View>
    </Screen>
  );
}
