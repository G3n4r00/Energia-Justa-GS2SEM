// Paleta, tipografia, espaçamento e bordas do EnergiaJusta
// Importar de qualquer componente: import { colors, type } from './tokens'

export const colors = {
  // Identidade
  brand:        '#1C2526',
  accent:       '#F5A623',
  accentDark:   '#C47A1E',

  // Semânticas — status de orçamento
  success:      '#3D9142',
  successBg:    '#EBF5EC',
  warning:      '#E08C00',
  warningBg:    '#FFF3CD',
  danger:       '#CC2929',
  dangerBg:     '#FDECEA',

  // Superfícies
  background:   '#F4F5F7',
  surface:      '#FFFFFF',
  surfaceVariant: '#ECEEF2',

  // Texto
  textPrimary:   '#111827',
  textSecondary: '#6B7280',
  textCaption:   '#9CA3AF',
  textInverse:   '#FFFFFF',

  // Bordas
  border:        '#D1D5DB',
  borderFocus:   '#F5A623',
} as const;

export const type = {
  // Tamanho + peso
  display:  { fontSize: 40, fontWeight: '700' as const, letterSpacing: -1 },
  headline: { fontSize: 20, fontWeight: '700' as const },
  title:    { fontSize: 17, fontWeight: '600' as const },
  body:     { fontSize: 15, fontWeight: '400' as const },
  label:    { fontSize: 13, fontWeight: '500' as const },
  caption:  { fontSize: 12, fontWeight: '400' as const },
} as const;

export const space = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const radius = {
  sm:   6,
  md:   12,
  lg:   20,
  pill: 999,
} as const;
