import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/text';
import { colors } from '@/theme/colors';

type StoryViewerModalProps = {
  visible: boolean;
  name: string;
  items: string[];
  subtitle?: string | null;
  onClose: () => void;
};

export function StoryViewerModal({ visible, name, items, subtitle, onClose }: StoryViewerModalProps) {
  const [index, setIndex] = useState(0);
  const safeIndex = useMemo(() => Math.min(index, Math.max(items.length - 1, 0)), [index, items.length]);
  const currentItem = items[safeIndex];

  const goNext = () => {
    if (safeIndex >= items.length - 1) {
      onClose();
      return;
    }

    setIndex((current) => current + 1);
  };

  const goPrev = () => {
    if (safeIndex <= 0) {
      return;
    }

    setIndex((current) => current - 1);
  };

  return (
    <Modal
      visible={visible && items.length > 0}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      onShow={() => setIndex(0)}
    >
      <View style={{ flex: 1, backgroundColor: '#050606' }}>
        {currentItem ? <Image source={{ uri: currentItem }} style={{ flex: 1 }} resizeMode="cover" /> : null}

        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            paddingTop: 18,
            paddingHorizontal: 16,
            gap: 14,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {items.map((_, itemIndex) => (
              <View
                key={itemIndex}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 999,
                  backgroundColor: itemIndex <= safeIndex ? colors.text : 'rgba(244, 241, 234, 0.26)',
                }}
              />
            ))}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ gap: 2 }}>
              <AppText variant="sectionTitle">{name}</AppText>
              <AppText variant="bodyMuted">{subtitle || 'Momento publicado'}</AppText>
            </View>
            <Pressable
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(13, 17, 16, 0.6)',
                borderWidth: 1,
                borderColor: 'rgba(244, 241, 234, 0.12)',
              }}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <View style={{ position: 'absolute', inset: 0, flexDirection: 'row' }}>
          <Pressable style={{ flex: 1 }} onPress={goPrev} />
          <Pressable style={{ flex: 1 }} onPress={goNext} />
        </View>
      </View>
    </Modal>
  );
}
