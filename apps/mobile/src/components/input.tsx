import type { ComponentProps } from 'react';
import { TextInput, View } from 'react-native';
import { AppText } from '@/components/text';
import { colors } from '@/theme/colors';

type InputProps = ComponentProps<typeof TextInput> & {
  label: string;
};

export function Input({ label, style, ...props }: InputProps) {
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="eyebrow" style={{ color: colors.muted }}>
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[
          {
            backgroundColor: colors.surfaceAlt,
            color: colors.text,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            paddingHorizontal: 14,
            paddingVertical: 14,
            fontSize: 16,
          },
          style,
        ]}
        {...props}
      />
    </View>
  );
}
