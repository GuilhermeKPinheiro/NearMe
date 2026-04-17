import type { ReactNode } from 'react';
import type { RefreshControlProps } from 'react-native';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  refreshControlProps?: RefreshControlProps;
};

export function Screen({ children, scroll = false, refreshControlProps }: ScreenProps) {
  const content = (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, gap: 18 }}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          style={{ flex: 1 }}
          refreshControl={refreshControlProps ? <RefreshControl tintColor={colors.accentStrong} {...refreshControlProps} /> : undefined}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
