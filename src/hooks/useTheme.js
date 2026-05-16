import { useApp } from '../context/AppContext';
import { COLORS } from '../constants/theme';

export function useTheme() {
  const { settings } = useApp();
  const isDark = settings.darkMode !== false;
  const C = isDark ? COLORS.dark : COLORS.light;
  return { C, isDark };
}
