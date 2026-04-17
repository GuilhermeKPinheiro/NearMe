import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { colors } from '@/theme/colors';

type CardProps = ViewProps & {
  tone?: 'default' | 'soft';
};

export function Card({ style, tone = 'default', ...props }: CardProps) {
  const baseStyle =
    tone === 'soft'
      ? {
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          borderRadius: 24,
          padding: 16,
          gap: 12,
        }
      : {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 28,
          padding: 18,
          gap: 12,
        };

  return (
    <View
      style={[
        baseStyle,
        style as StyleProp<ViewStyle>,
      ]}
      {...props}
    />
  );
}
