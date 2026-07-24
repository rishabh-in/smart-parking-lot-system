import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApplication } from './app.setup';
import { AppEnvironment } from './config/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppEnvironment>);
  const nodeEnv =
    config.get<AppEnvironment['NODE_ENV']>('NODE_ENV') ?? 'development';
  const port = config.get<number>('PORT') ?? 3000;

  configureApplication(app, nodeEnv);

  await app.listen(port);
}
void bootstrap();
