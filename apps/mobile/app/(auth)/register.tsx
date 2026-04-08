import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { Input } from '@/components/input';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { NearMeLogo } from '@/components/logo';
import { getErrorMessage } from '@/services/http';
import { useSession } from '@/state/session';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Screen scroll>
      <View style={{ gap: 18 }}>
        <NearMeLogo />
        <View style={{ gap: 8 }}>
          <AppText variant="title">Cadastro rapido, presenca discreta.</AppText>
          <AppText variant="bodyMuted">Entre em minutos. Depois voce decide redes, WhatsApp e fotos privadas.</AppText>
        </View>

        <Input label="Nome" placeholder="Seu nome" value={name} onChangeText={setName} />
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
        <Input
          label="Confirmar senha"
          placeholder="********"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        {error ? <AppText variant="bodyMuted">{error}</AppText> : null}

        <PrimaryButton
          title={isSubmitting ? 'Criando...' : 'Criar e entrar'}
          disabled={isSubmitting}
          onPress={async () => {
            if (password !== confirmPassword) {
              setError('As senhas precisam ser iguais.');
              return;
            }

            try {
              setIsSubmitting(true);
              setError('');
              await signUp(name, email, password);
              router.replace('/home');
            } catch (nextError) {
              setError(getErrorMessage(nextError));
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
        <SecondaryButton title="Ja tenho conta" onPress={() => router.push('/login')} />
      </View>
    </Screen>
  );
}
