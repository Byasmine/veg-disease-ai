/**
 * Natural palette — Plant Health Scanner
 * Olive #777E49 | Cream #E7DCC9 | Taupe #8C7C63
 */
export const colors = {
  olive: '#777E49',
  cream: '#E7DCC9',
  taupe: '#8C7C63',
  background: '#E7DCC9',
  card: '#FFFFFF',
  cardMuted: 'rgba(255,255,255,0.9)',
  accentPrimary: '#777E49',
  accentSecondary: '#8C7C63',
  success: '#2D8A6E',
  warning: '#C9A227',
  danger: '#C75C5C',
  textPrimary: '#2C2C2C',
  textSecondary: '#8C7C63',
  textOnOlive: '#FFFFFF',
  border: 'rgba(140, 124, 99, 0.35)',
} as const;

/** Gradient: olive → darker olive/taupe */
export const accentGradient = ['#777E49', '#5E6539'] as const;
