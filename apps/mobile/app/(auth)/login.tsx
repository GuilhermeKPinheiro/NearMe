import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Input } from '@/components/input';
import { NearMeLogo } from '@/components/logo';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { signInWithGoogleNative, getGoogleSignInAvailability } from '@/services/google-auth';
import { getErrorMessage } from '@/services/http';
import { useSession } from '@/state/session';
import { colors } from '@/theme/colors';

function GoogleAccessButton({
  disabled,
  busy,
  helperText,
  onPress,
}: {
  disabled: boolean;
  busy: boolean;
  helperText: string;
  onPress: () => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
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
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <Ionicons name="logo-google" size={18} color={colors.text} />
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{busy ? 'Entrando com Google…' : 'Entrar com Google'}</Text>
      </Pressable>
      <AppText variant="bodyMuted">{helperText}</AppText>
    </View>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const googleAvailability = useMemo(() => getGoogleSignInAvailability(), []);

  const googleHelperText = googleAvailability.isAvailable
    ? 'Entre com Google neste dispositivo.'
    : 'Google indisponível neste ambiente. Use seu e-mail.';

  return (
    <Screen scroll>
      <View style={{ gap: 18 }}>
        <NearMeLogo />
        <View style={{ gap: 8 }}>
          <AppText variant="title">Volte para o radar.</AppText>
          <AppText variant="bodyMuted">Entre para ver quem está por perto e levar a conversa para fora quando fizer sentido.</AppText>
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
          autoCapitalize="none"
          autoComplete="off"
          textContentType="oneTimeCode"
          value={password}
          onChangeText={setPassword}
        />

        {error ? <AppText variant="bodyMuted">{error}</AppText> : null}

        <PrimaryButton
          title={isSubmitting ? 'Entrando…' : 'Entrar'}
          disabled={isSubmitting || isGoogleSubmitting}
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

        <GoogleAccessButton
          disabled={!googleAvailability.isAvailable || isSubmitting || isGoogleSubmitting}
          busy={isGoogleSubmitting}
          helperText={googleHelperText}
          onPress={() => {
            setIsGoogleSubmitting(true);
            setError('');

            signInWithGoogleNative()
              .then(({ idToken }) => signInWithGoogle(idToken))
              .then(() => router.replace('/home'))
              .catch((nextError) => setError(getErrorMessage(nextError)))
              .finally(() => setIsGoogleSubmitting(false));
          }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <SecondaryButton title="Criar conta" onPress={() => router.push('/register')} compact />
          <SecondaryButton title="Esqueci minha senha" onPress={() => router.push('/forgot-password')} compact />
        </View>
      </View>
    </Screen>
  );
}
