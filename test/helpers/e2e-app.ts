import { type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { type App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApplication } from '../../src/app.setup';

export async function createE2eApp(): Promise<INestApplication<App>> {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ??
    'postgresql://smart_parking:smart_parking_password@localhost:5432/smart_parking?schema=public';
  process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app: INestApplication<App> = moduleFixture.createNestApplication();

  configureApplication(app, process.env.NODE_ENV);
  await app.init();

  return app;
}
