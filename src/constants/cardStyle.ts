import type { ThemeColors } from '../theme/colors';

export function getCardSurface(colors: ThemeColors) {
  return {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  } as const;
}

export const CARD_MARGIN_BOTTOM = 12;
