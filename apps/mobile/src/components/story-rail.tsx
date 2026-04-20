import { Image, ScrollView, View } from 'react-native';
import { StoryAvatar } from '@/components/story-avatar';
import { AppText } from '@/components/text';
import { colors } from '@/theme/colors';

type StoryRailProps = {
  title: string;
  subtitle?: string;
  items: string[];
  emptyLabel?: string;
};

export function StoryRail({ title, subtitle, items, emptyLabel }: StoryRailProps) {
  if (!items.length) {
    return (
      <View
        style={{
          minHeight: 160,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surfaceAlt,
          justifyContent: 'center',
          padding: 18,
          gap: 6,
        }}
      >
        <AppText variant="eyebrow">{title}</AppText>
        <AppText variant="sectionTitle">Sem momento ativo</AppText>
        <AppText variant="bodyMuted">{emptyLabel ?? 'Publique algo do momento para aparecer aqui.'}</AppText>
      </View>
    );
  }

  const [featured, ...rest] = items;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 4 }}>
        <AppText variant="eyebrow">{title}</AppText>
        {subtitle ? <AppText variant="bodyMuted">{subtitle}</AppText> : null}
      </View>

      <View
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          backgroundColor: colors.surfaceAlt,
        }}
      >
        <Image source={{ uri: featured }} style={{ width: '100%', height: 240 }} resizeMode="cover" />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: 16,
            gap: 4,
            backgroundColor: 'rgba(13, 17, 16, 0.46)',
          }}
        >
          <AppText variant="sectionTitle">Momento</AppText>
          <AppText variant="bodyMuted">Publicado para quem está por perto.</AppText>
        </View>
      </View>

      {rest.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {rest.slice(0, 8).map((item, index) => (
            <View key={`${item}-${index}`}>
              <StoryAvatar uri={item} size={78} active label="Mais cedo" />
            </View>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
