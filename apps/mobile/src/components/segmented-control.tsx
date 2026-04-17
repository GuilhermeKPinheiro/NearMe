import { Pressable, View } from 'react-native';
import { AppText } from '@/components/text';
import { colors } from '@/theme/colors';

type Option<T extends string | number> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string | number> = {
  options: Option<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string | number>({
  options,
  selectedValue,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        padding: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.surface,
      }}
    >
      {options.map((option) => {
        const selected = option.value === selectedValue;

        return (
          <Pressable
            key={String(option.value)}
            onPress={() => {
              if (!selected) {
                onChange(option.value);
              }
            }}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 42,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              backgroundColor: selected ? colors.surfaceAlt : 'transparent',
              borderWidth: selected ? 1 : 0,
              borderColor: selected ? colors.border : 'transparent',
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <AppText variant="body" style={{ color: selected ? colors.text : colors.muted, fontWeight: selected ? '700' : '600' }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
