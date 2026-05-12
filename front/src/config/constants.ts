/**
 * Shared constants for the application
 * These constants are used across multiple admin pages to ensure consistency
 */

export const GENDER_OPTIONS = [
  { value: 'men', label: 'Hombre' },
  { value: 'women', label: 'Mujer' },
  { value: 'kid', label: 'Niño' },
  { value: 'unisex', label: 'Unisex' },
] as const;

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;

export const STATUS_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
] as const;

export type GenderValue = (typeof GENDER_OPTIONS)[number]['value'];
export type SizeValue = (typeof SIZE_OPTIONS)[number];
export type StatusValue = (typeof STATUS_OPTIONS)[number]['value'];
