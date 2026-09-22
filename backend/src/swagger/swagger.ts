import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
    const config = new DocumentBuilder()
        .setTitle('Salici Chess API')
        .setDescription('API documentation for the Salici chess backend')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const documentFactory = () =>
        SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('api', app, documentFactory);
}