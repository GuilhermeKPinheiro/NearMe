import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Input } from '@/components/input';
import { NearMeLogo } from '@/components/logo';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { env } from '@/config/env';
import { getErrorMessage } from '@/services/http';
import { useSession } from '@/state/session';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useSession();
  const [email, setEmail] = useState('demo@nearme.app');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: env.googleAndroidClientId,
    iosClientId: env.googleIosClientId,
    webClientId: env.googleWebClientId,
    selectAccount: true,
  });

  const handleGoogleLogin = async () => {
    if (!env.googleAndroidClientId || !env.googleIosClientId || !env.googleWebClientId) {
      throw new Error('Configure os client IDs do Google no app antes de continuar.');
    }

    const result = await promptAsync();

    if (result.type !== 'success') {
      return;
    }

    const idToken =
      (result.type === 'success' ? result.params?.id_token : '') ||
      (response?.type === 'success' ? response.params?.id_token : '') ||
      '';

    if (!idToken) {
      throw new Error('Google nao retornou um ID token valido.');
    }

    await signInWithGoogle(idToken);
  };

  return (
    <Screen scroll>
      <View style={{ gap: 18 }}>
        <NearMeLogo />
        <View style={{ gap: 8 }}>
          <AppText variant="title">Voltar para o radar.</AppText>
          <AppText variant="bodyMuted">
            Acesso rapido para aparecer na festa, ver quem esta perto e seguir a conversa nas redes.
          </AppText>
        </View>

        <Input
          label="E-mail"
          placeholder="voce@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Senha"
          placeholder="********"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <AppText variant="bodyMuted">{error}</AppText> : null}

        <PrimaryButton
          title={isSubmitting ? 'Entrando...' : 'Entrar'}
          disabled={isSubmitting}
          onPress={async () => {
            try {
              setIsSubmitting(true);
              setError('');
              await signIn(email, password);
              router.replace('/home');
            } catch (nextError) {
              setError(getErrorMessage(nextError));
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
        <SecondaryButton
          title="Entrar com Google"
          disabled={isSubmitting || !request}
          onPress={async () => {
            try {
              setIsSubmitting(true);
              setError('');
              await handleGoogleLogin();
              router.replace('/home');
            } catch (nextError) {
              setError(getErrorMessage(nextError));
            } finally {
              setIsSubmitting(false);
            }
          }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <SecondaryButton title="Cadastro rapido" onPress={() => router.push('/register')} compact />
          <SecondaryButton title="Esqueci minha senha" onPress={() => router.push('/forgot-password')} compact />
        </View>
      </View>
    </Screen>
  );
}
