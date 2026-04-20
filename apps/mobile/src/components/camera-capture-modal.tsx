import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, View } from 'react-native';
import { CameraView, type CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton, SecondaryButton } from '@/components/button';
import { AppText } from '@/components/text';
import { colors } from '@/theme/colors';

type CameraCaptureModalProps = {
  visible: boolean;
  title: string;
  description: string;
  aspectLabel: string;
  uploading?: boolean;
  onClose: () => void;
  onCapture: (uri: string) => Promise<void> | void;
};

export function CameraCaptureModal({
  visible,
  title,
  description,
  aspectLabel,
  uploading = false,
  onClose,
  onCapture,
}: CameraCaptureModalProps) {
  const cameraRef = useRef<CameraView | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClose = () => {
    if (uploading || isProcessing) {
      return;
    }

    setCapturedUri(null);
    onClose();
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || isProcessing || uploading) {
      return;
    }

    setIsProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      });

      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUsePhoto = async () => {
    if (!capturedUri || isProcessing || uploading) {
      return;
    }

    setIsProcessing(true);

    try {
      await onCapture(capturedUri);
      setCapturedUri(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {capturedUri ? (
          <Image source={{ uri: capturedUri }} style={{ flex: 1 }} resizeMode="cover" />
        ) : (
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} mute />
        )}

        <View
          style={{
            position: 'absolute',
            inset: 0,
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 28,
            backgroundColor: 'rgba(8, 10, 9, 0.16)',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <AppText variant="eyebrow">{title}</AppText>
              <AppText variant="sectionTitle">{description}</AppText>
              <AppText variant="bodyMuted">Enquadramento sugerido: {aspectLabel}</AppText>
            </View>
            <Pressable
              onPress={handleClose}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(13, 17, 16, 0.86)',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {capturedUri ? (
            <View style={{ gap: 12 }}>
              <SecondaryButton title="Tirar outra" onPress={() => setCapturedUri(null)} />
              <PrimaryButton title={uploading ? 'Enviando foto...' : 'Usar esta foto'} onPress={() => void handleUsePhoto()} disabled={uploading || isProcessing} />
            </View>
          ) : (
            <View style={{ alignItems: 'center', gap: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                <Pressable
                  onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(13, 17, 16, 0.86)',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="camera-reverse" size={24} color={colors.text} />
                </Pressable>
                <Pressable
                  onPress={() => void handleTakePicture()}
                  style={{
                    width: 86,
                    height: 86,
                    borderRadius: 43,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.text,
                    borderWidth: 8,
                    borderColor: 'rgba(255,255,255,0.22)',
                  }}
                  disabled={isProcessing || uploading}
                >
                  {isProcessing ? <ActivityIndicator color={colors.background} /> : <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.background }} />}
                </Pressable>
                <View style={{ width: 56, height: 56 }} />
              </View>
              <AppText variant="bodyMuted" style={{ textAlign: 'center' }}>
                Use a camera para capturar o momento sem sair do fluxo do NearMe.
              </AppText>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
