export const COLORS = {
  dark: {
    bg:           '#0A0A0F',
    bgCard:       '#16161F',
    bgInput:      '#1E1E2E',
    bgCardAlt:    '#1A1A26',
    border:       'rgba(255,255,255,0.07)',
    borderActive: '#9B7FD4',
    text:         '#FFFFFF',
    textSub:      '#888899',
    textMuted:    '#444455',
    accent:       '#9B7FD4',
    accentLight:  '#B89FE8',
    accentDark:   '#7B5FB4',
    accentGlow:   'rgba(155,127,212,0.25)',
    income:       '#22C55E',
    expense:      '#FF6B6B',
    warning:      '#F59E0B',
    danger:       '#EF4444',
    gradientCard: ['#1a1a2e', '#0f0f1a'],
  },
  light: {
    bg:           '#F2F2F7',
    bgCard:       '#FFFFFF',
    bgInput:      '#F2F2F7',
    bgCardAlt:    '#FAFAFA',
    border:       'rgba(0,0,0,0.08)',
    borderActive: '#9B7FD4',
    text:         '#0A0A0F',
    textSub:      '#6B6B80',
    textMuted:    '#AAAABC',
    accent:       '#9B7FD4',
    accentLight:  '#B89FE8',
    accentDark:   '#7B5FB4',
    accentGlow:   'rgba(155,127,212,0.15)',
    income:       '#16A34A',
    expense:      '#DC2626',
    warning:      '#D97706',
    danger:       '#DC2626',
    gradientCard: ['#9B7FD4', '#7B5FB4'],
  },
};

export const CATEGORIES = [
  { id: 'food',          label: 'Food & Drink',   emoji: '🍔', color: '#FF6B35' },
  { id: 'transport',     label: 'Transport',       emoji: '🚇', color: '#4ECDC4' },
  { id: 'shopping',      label: 'Shopping',        emoji: '🛍️', color: '#A855F7' },
  { id: 'health',        label: 'Health',          emoji: '💊', color: '#EC4899' },
  { id: 'entertainment', label: 'Entertainment',   emoji: '🎬', color: '#F59E0B' },
  { id: 'groceries',     label: 'Groceries',       emoji: '🛒', color: '#22C55E' },
  { id: 'bills',         label: 'Bills',           emoji: '📄', color: '#64748B' },
  { id: 'travel',        label: 'Travel',          emoji: '✈️', color: '#3B82F6' },
  { id: 'fitness',       label: 'Fitness',         emoji: '🏋️', color: '#EF4444' },
  { id: 'rent',          label: 'Rent',            emoji: '🏠', color: '#8B5CF6' },
  { id: 'education',     label: 'Education',       emoji: '📚', color: '#06B6D4' },
  { id: 'income',        label: 'Income',          emoji: '💰', color: '#22C55E' },
  { id: 'other',         label: 'Other',           emoji: '💳', color: '#94A3B8' },
];

export const TYPOGRAPHY = {
  xs:   { fontSize: 11, lineHeight: 16 },
  sm:   { fontSize: 13, lineHeight: 18 },
  base: { fontSize: 15, lineHeight: 22 },
  md:   { fontSize: 17, lineHeight: 24 },
  lg:   { fontSize: 20, lineHeight: 28 },
  xl:   { fontSize: 24, lineHeight: 32 },
  xxl:  { fontSize: 32, lineHeight: 40 },
  xxxl: { fontSize: 42, lineHeight: 50 },
};

export const SPACING = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const RADIUS = {
  sm: 10, md: 14, lg: 20, xl: 24, xxl: 28, full: 999,
};
