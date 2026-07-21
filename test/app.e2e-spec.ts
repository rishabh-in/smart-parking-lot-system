import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

interface HealthResponseBody {
  status?: string;
  info?: Record<string, unknown>;
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ??
      'postgresql://smart_parking:smart_parking_password@localhost:5432/smart_parking?schema=public';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((response) => {
        const body = response.body as HealthResponseBody;

        expect(body).toHaveProperty('status', 'ok');
        expect(body.info).toHaveProperty('application');
        expect(body.info).toHaveProperty('database');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
