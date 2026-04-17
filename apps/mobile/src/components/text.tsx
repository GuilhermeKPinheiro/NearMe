import type { TextProps } from 'react-native';
import { Text } from 'react-native';
import { colors } from '@/theme/colors';

type Variant = 'title' | 'sectionTitle' | 'body' | 'bodyMuted' | 'eyebrow';

type AppTextProps = TextProps & {
  variant?: Variant;
};

const variantStyles: Record<Variant, object> = {
  title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: '900' },
  sectionTitle: { color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  body: { color: colors.text, fontSize: 16, lineHeight: 24 },
  bodyMuted: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  eyebrow: { color: colors.accent, fontSize: 12, lineHeight: 16, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '800' }
};

export function AppText({ variant = 'body', style, children, ...props }: AppTextProps) {
  return (
    <Text style={[variantStyles[variant], style]} {...props}>
      {children}
    </Text>
  );
}
