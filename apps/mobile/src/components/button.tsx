import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, Text } from 'react-native';
import { colors } from '@/theme/colors';

type ButtonProps = PressableProps & {
  title: string;
  compact?: boolean;
};

export function PrimaryButton({ title, compact = false, style, ...props }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        {
          backgroundColor: colors.accentStrong,
          paddingVertical: compact ? 10 : 14,
          paddingHorizontal: 16,
          borderRadius: 999,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.accentStrong,
          opacity: pressed ? 0.88 : 1
        },
        style as StyleProp<ViewStyle>
      ]}
      {...props}
    >
      <Text style={{ color: colors.background, fontWeight: '800' }}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ title, compact = false, style, ...props }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        {
          backgroundColor: 'transparent',
          borderColor: colors.border,
          borderWidth: 1,
          paddingVertical: compact ? 10 : 14,
          paddingHorizontal: 16,
          borderRadius: 999,
          alignItems: 'center',
          opacity: pressed ? 0.88 : 1
        },
        style as StyleProp<ViewStyle>
      ]}
      {...props}
    >
      <Text style={{ color: colors.text, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}
