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
      <AppText variant="sectionTitle">{label}</AppText>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[
          {
            backgroundColor: colors.surface,
            color: colors.text,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            paddingVertical: 14,
            fontSize: 16
          },
          style
        ]}
        {...props}
      />
    </View>
  );
}
