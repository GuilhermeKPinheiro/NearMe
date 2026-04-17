import { View } from 'react-native';
import { AppText } from '@/components/text';
import { colors } from '@/theme/colors';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
};

export function SectionHeader({ eyebrow, title, description, align = 'left' }: SectionHeaderProps) {
  const textAlign = align;

  return (
    <View style={{ gap: 6, alignItems: align === 'center' ? 'center' : 'flex-start' }}>
      {eyebrow ? (
        <AppText variant="eyebrow" style={{ color: colors.accentWarm, textAlign }}>
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant="title" style={{ textAlign }}>
        {title}
      </AppText>
      {description ? (
        <AppText variant="bodyMuted" style={{ textAlign }}>
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
