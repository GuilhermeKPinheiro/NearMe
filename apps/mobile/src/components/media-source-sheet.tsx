import { Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/card';
import { AppText } from '@/components/text';
import { colors } from '@/theme/colors';

type MediaSourceSheetProps = {
  visible: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onPickCamera: () => void;
  onPickLibrary: () => void;
};

function SourceAction({
  icon,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 22,
        padding: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: pressed ? colors.glow : colors.surfaceAlt,
      })}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons name={icon} size={20} color={colors.accentStrong} />
      </View>
      <AppText variant="sectionTitle">{title}</AppText>
      <AppText variant="bodyMuted">{description}</AppText>
    </Pressable>
  );
}

export function MediaSourceSheet({
  visible,
  title,
  description,
  onClose,
  onPickCamera,
  onPickLibrary,
}: MediaSourceSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(6, 8, 8, 0.62)',
          padding: 16,
        }}
      >
        <Pressable onPress={() => undefined}>
          <Card style={{ padding: 18, gap: 14 }}>
            <View style={{ gap: 4 }}>
              <AppText variant="eyebrow">{title}</AppText>
              <AppText variant="sectionTitle">Escolha como publicar</AppText>
              <AppText variant="bodyMuted">{description}</AppText>
            </View>
            <SourceAction
              icon="camera"
              title="Tirar foto agora"
              description="Abra a câmera e publique algo fresco, sem depender da galeria."
              onPress={onPickCamera}
            />
            <SourceAction
              icon="images"
              title="Escolher da galeria"
              description="Use uma imagem que você já tenha separado para o perfil ou para o momento."
              onPress={onPickLibrary}
            />
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
