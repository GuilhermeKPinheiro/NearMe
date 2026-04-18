import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Input } from '@/components/input';
import { NearMeLogo } from '@/components/logo';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { getErrorMessage } from '@/services/http';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';

function GoogleUnavailableButton() {
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        disabled
        style={{
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          minHeight: 52,
          paddingHorizontal: 16,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          opacity: 0.45,
        }}
      >
        <Ionicons name="logo-google" size={18} color={colors.text} />
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>Entrar com Google</Text>
      </Pressable>
      <AppText variant="bodyMuted">
        Login com Google temporariamente indisponivel neste runtime do Expo Go. Use login com e-mail agora.
      </AppText>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const [email, setEmail] = useState('demo@nearme.app');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        <GoogleUnavailableButton />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <SecondaryButton title="Cadastro rapido" onPress={() => router.push('/register')} compact />
          <SecondaryButton title="Esqueci minha senha" onPress={() => router.push('/forgot-password')} compact />
        </View>
      </View>
    </Screen>
  );
}
