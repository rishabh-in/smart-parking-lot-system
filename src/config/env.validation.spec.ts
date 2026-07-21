import { validateEnvironment } from './env.validation';

describe('validateEnvironment', () => {
  it('returns typed environment values with defaults', () => {
    expect(
      validateEnvironment({
        DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
      }),
    ).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
    });
  });

  it('rejects missing database configuration', () => {
    expect(() => validateEnvironment({})).toThrow('DATABASE_URL is required');
  });

  it('rejects invalid ports', () => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'postgresql://user:password@localhost:5432/app',
        PORT: '70000',
      }),
    ).toThrow('PORT must be an integer between 1 and 65535');
  });
});
