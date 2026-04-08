import type { StyleProp, ViewProps, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { colors } from '@/theme/colors';

export function Card({ style, ...props }: ViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 24,
          padding: 16,
          gap: 12
        },
        style as StyleProp<ViewStyle>
      ]}
      {...props}
    />
  );
}
