/**
 * Logger utility for R2 upload scripts
 * Provides consistent colored output matching existing project conventions
 */

export const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
} as const;

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

const levelColors: Record<LogLevel, string> = {
  info: colors.blue,
  success: colors.green,
  warning: colors.yellow,
  error: colors.red,
  debug: colors.gray,
};

const levelPrefixes: Record<LogLevel, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  error: '✗',
  debug: '›',
};

export function log(level: LogLevel, message: string): void {
  const color = levelColors[level] || colors.reset;
  const prefix = levelPrefixes[level];
  console.log(`${color}  ${prefix} ${message}${colors.reset}`);
}

export function logRaw(message: string): void {
  console.log(message);
}

export function logHeader(title: string): void {
  const width = 60;
  const padding = Math.max(0, width - title.length - 2);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  
  console.log('\n' + colors.blue + '╔' + '═'.repeat(width) + '╗' + colors.reset);
  console.log(colors.blue + '║' + ' '.repeat(leftPad) + colors.cyan + title + colors.blue + ' '.repeat(rightPad) + '║' + colors.reset);
  console.log(colors.blue + '╚' + '═'.repeat(width) + '╝' + colors.reset + '\n');
}

export function logSection(title: string): void {
  console.log('\n' + colors.cyan + `📋 ${title}...` + colors.reset);
}

export function logDivider(): void {
  console.log(colors.gray + '  ' + '─'.repeat(58) + colors.reset);
}
