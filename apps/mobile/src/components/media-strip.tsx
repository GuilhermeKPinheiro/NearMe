import { Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/text';
import { colors } from '@/theme/colors';

type MediaStripProps = {
  title: string;
  items: string[];
  emptyLabel?: string;
  tall?: boolean;
  onRemoveItem?: (item: string) => void;
};

export function MediaStrip({ title, items, emptyLabel, tall = false, onRemoveItem }: MediaStripProps) {
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="eyebrow">{title}</AppText>
      {items.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {items.map((photo) => (
            <View key={photo} style={{ position: 'relative' }}>
              <Image
                source={{ uri: photo }}
                style={{
                  width: tall ? 92 : 84,
                  height: tall ? 132 : 84,
                  borderRadius: 22,
                  backgroundColor: colors.surfaceAlt,
                }}
              />
              {onRemoveItem ? (
                <Pressable
                  onPress={() => onRemoveItem(photo)}
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(13, 17, 16, 0.72)',
                    borderWidth: 1,
                    borderColor: 'rgba(244, 241, 234, 0.12)',
                  }}
                >
                  <Ionicons name="close" size={14} color={colors.text} />
                </Pressable>
              ) : null}
            </View>
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
            {emptyLabel ?? 'Nada publicado ainda.'}
          </AppText>
        </View>
      )}
    </View>
  );
}
