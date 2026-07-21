import {
  AppEnvironment,
  NODE_ENV_VALUES,
  NodeEnvironment,
} from './environment';

const DEFAULT_PORT = 3000;

export function validateEnvironment(
  config: Record<string, unknown>,
): AppEnvironment {
  const nodeEnv = parseNodeEnvironment(config.NODE_ENV);
  const port = parsePort(config.PORT);
  const databaseUrl = parseRequiredString(config.DATABASE_URL, 'DATABASE_URL');

  return {
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
  };
}

function parseNodeEnvironment(value: unknown): NodeEnvironment {
  if (value === undefined || value === null || value === '') {
    return 'development';
  }

  if (typeof value !== 'string') {
    throw new Error('NODE_ENV must be a string');
  }

  if (NODE_ENV_VALUES.includes(value as NodeEnvironment)) {
    return value as NodeEnvironment;
  }

  throw new Error(`NODE_ENV must be one of: ${NODE_ENV_VALUES.join(', ')}`);
}

function parsePort(value: unknown): number {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_PORT;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return parsed;
}

function parseRequiredString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }

  return value.trim();
}
