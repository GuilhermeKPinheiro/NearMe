import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/screen';
import { AppText } from '@/components/text';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { NearMeLogo } from '@/components/logo';
import { colors } from '@/theme/colors';
import { useSession } from '@/state/session';

const steps = [
  {
    title: 'Entre no radar do momento',
    description: 'Escolha o raio e apareça só quando fizer sentido.',
  },
  {
    title: 'Mostre o suficiente',
    description: 'Momentos, fotos públicas e uma frase curta ajudam sem expor seu perfil inteiro.',
  },
  {
    title: 'Construa sua rede por perto',
    description: 'Quem cruzar seu momento pode pedir conexão. O restante acontece dentro do NearMe.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { markOnboardingSeen } = useSession();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'space-between', gap: 28 }}>
        <View style={{ gap: 22 }}>
          <NearMeLogo />
          <View
            style={{
              height: 260,
              borderRadius: 34,
              backgroundColor: colors.surface,
              overflow: 'hidden',
              justifyContent: 'flex-end',
              padding: 22,
            }}
          >
            <View
              style={{
                position: 'absolute',
                width: 220,
                height: 220,
                borderRadius: 140,
                backgroundColor: colors.glow,
                top: -42,
                right: -36,
                opacity: 0.95,
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: 170,
                height: 170,
                borderRadius: 120,
                backgroundColor: colors.surfaceAlt,
                bottom: 22,
                left: -34,
                opacity: 0.9,
              }}
            />
            <AppText variant="eyebrow" style={{ color: colors.accentWarm }}>
              Perto agora
            </AppText>
            <AppText variant="title">Rede social por proximidade, no ritmo certo.</AppText>
          </View>
        </View>

        <View style={{ gap: 16 }}>
          {steps.map((step) => (
            <View key={step.title} style={{ gap: 6 }}>
              <AppText variant="sectionTitle">{step.title}</AppText>
              <AppText variant="bodyMuted">{step.description}</AppText>
            </View>
          ))}
        </View>

        <View style={{ gap: 12 }}>
          <PrimaryButton
            title="Começar cadastro"
            onPress={async () => {
              await markOnboardingSeen();
              router.replace('/register');
            }}
          />
          <SecondaryButton title="Já tenho conta" onPress={() => router.push('/login')} />
        </View>
      </View>
    </Screen>
  );
}
