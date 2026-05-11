import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  // Setup RabbitMQ microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672'],
      queue: 'bookings_queue',
      queueOptions: {
        durable: true,
      },
    },
  });

  // Setup Swagger UI
  const config = new DocumentBuilder()
    .setTitle('JONGTOH API')
    .setDescription('The JONGTOH Table Reservation System API description')
    .setVersion('1.0')
    .addTag('bookings')
    .addTag('tables')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 3000, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
