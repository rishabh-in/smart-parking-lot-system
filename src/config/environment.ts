export const NODE_ENV_VALUES = ['development', 'test', 'production'] as const;

export type NodeEnvironment = (typeof NODE_ENV_VALUES)[number];

export interface AppEnvironment {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  DATABASE_URL: string;
}
