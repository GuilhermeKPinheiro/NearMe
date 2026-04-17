import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { Input } from '@/components/input';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { requestPasswordReset } from '@/services/auth';
import { getErrorMessage } from '@/services/http';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Screen scroll>
      <View style={{ gap: 18 }}>
        <View style={{ gap: 8 }}>
          <AppText variant="title">Recuperar senha</AppText>
          <AppText variant="bodyMuted">Digite seu e-mail. Se ele existir, enviaremos o link de redefinição.</AppText>
        </View>

        <Input
          label="E-mail"
          placeholder="voce@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {error ? <AppText variant="bodyMuted">{error}</AppText> : null}
        {message ? <AppText variant="bodyMuted">{message}</AppText> : null}
        <PrimaryButton
          title={isSubmitting ? 'Enviando...' : 'Enviar link'}
          disabled={isSubmitting}
          onPress={async () => {
            try {
              setIsSubmitting(true);
              setError('');
              const result = await requestPasswordReset(email);
              setMessage(result.message);
            } catch (nextError) {
              setError(getErrorMessage(nextError));
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
        <SecondaryButton title="Voltar ao login" onPress={() => router.push('/login')} />
      </View>
    </Screen>
  );
}
