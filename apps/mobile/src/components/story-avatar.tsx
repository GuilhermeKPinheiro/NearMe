import { Image, Pressable, View } from 'react-native';
import { AppText } from '@/components/text';
import { colors } from '@/theme/colors';

type StoryAvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  label?: string;
  active?: boolean;
  onPress?: () => void;
};

function getInitials(name?: string | null) {
  return (
    name
      ?.split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'NM'
  );
}

export function StoryAvatar({ uri, name, size = 72, label, active = false, onPress }: StoryAvatarProps) {
  const initials = getInitials(name);
  const ringSize = size + (active ? 8 : 0);
  const innerSize = size - 6;

  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ alignItems: 'center', gap: 8, opacity: onPress ? 1 : 0.92 }}>
      <View
        style={{
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? colors.accentStrong : colors.surfaceAlt,
          padding: active ? 3 : 0,
          borderWidth: active ? 0 : 1,
          borderColor: colors.borderSubtle,
        }}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              borderWidth: 3,
              borderColor: colors.background,
              backgroundColor: colors.surfaceAlt,
            }}
          />
        ) : (
          <View
            style={{
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 3,
              borderColor: colors.background,
              backgroundColor: colors.surface,
            }}
          >
            <AppText variant="sectionTitle" style={{ color: colors.accentWarm }}>
              {initials}
            </AppText>
          </View>
        )}
      </View>
      {label ? (
        <AppText variant="bodyMuted" numberOfLines={1} style={{ maxWidth: size + 24, textAlign: 'center' }}>
          {label}
        </AppText>
      ) : null}
    </Pressable>
  );
}
