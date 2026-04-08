import { View } from 'react-native';
import { AppText } from '@/components/text';
import { colors } from '@/theme/colors';

type LogoProps = {
  compact?: boolean;
};

export function NearMeLogo({ compact = false }: LogoProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          width: compact ? 34 : 48,
          height: compact ? 34 : 48,
          borderRadius: compact ? 17 : 24,
          backgroundColor: colors.surfaceAlt,
          borderWidth: 1,
          borderColor: colors.accent,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000000',
          shadowOpacity: 0.22,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 }
        }}
      >
        <View
          style={{
            width: compact ? 18 : 25,
            height: compact ? 18 : 25,
            borderRadius: 999,
            borderWidth: compact ? 2 : 3,
            borderColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <View
            style={{
              width: compact ? 6 : 8,
              height: compact ? 6 : 8,
              borderRadius: 999,
              backgroundColor: colors.text
            }}
          />
        </View>
      </View>
      {!compact ? (
        <View>
          <AppText variant="eyebrow" style={{ color: colors.accentWarm }}>
            NearMe
          </AppText>
          <AppText variant="bodyMuted">social prime nearby</AppText>
        </View>
      ) : null}
    </View>
  );
}
