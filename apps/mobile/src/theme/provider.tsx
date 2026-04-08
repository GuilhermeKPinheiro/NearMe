import type { ReactNode } from 'react';
import { View } from 'react-native';
import { colors } from '@/theme/colors';

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, backgroundColor: colors.background }}>{children}</View>;
}
