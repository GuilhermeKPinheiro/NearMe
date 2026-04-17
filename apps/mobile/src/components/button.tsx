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
          minHeight: compact ? 42 : 52,
          paddingHorizontal: 16,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.accentStrong,
          opacity: props.disabled ? 0.45 : pressed ? 0.88 : 1,
        },
        style as StyleProp<ViewStyle>,
      ]}
      {...props}
    >
      <Text style={{ color: colors.background, fontWeight: '800', fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ title, compact = false, style, ...props }: ButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        {
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.borderSubtle,
          borderWidth: 1,
          minHeight: compact ? 42 : 52,
          paddingHorizontal: 16,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: props.disabled ? 0.45 : pressed ? 0.88 : 1,
        },
        style as StyleProp<ViewStyle>,
      ]}
      {...props}
    >
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}
