import { Image, ScrollView, View } from 'react-native';
import { AppText } from '@/components/text';
import { colors } from '@/theme/colors';

type MediaStripProps = {
  title: string;
  items: string[];
  emptyLabel?: string;
  tall?: boolean;
};

export function MediaStrip({ title, items, emptyLabel, tall = false }: MediaStripProps) {
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="eyebrow">{title}</AppText>
      {items.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {items.map((photo) => (
            <Image
              key={photo}
              source={{ uri: photo }}
              style={{
                width: tall ? 92 : 84,
                height: tall ? 132 : 84,
                borderRadius: 22,
                backgroundColor: colors.surfaceAlt,
              }}
            />
          ))}
        </ScrollView>
      ) : (
        <View
          style={{
            minHeight: tall ? 132 : 84,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surfaceAlt,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 16,
          }}
        >
          <AppText variant="bodyMuted" style={{ textAlign: 'center' }}>
            {emptyLabel ?? 'Nada por aqui ainda.'}
          </AppText>
        </View>
      )}
    </View>
  );
}
