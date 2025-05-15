import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { DocumentProcessorService } from './processors/document-processor.service';
import { DocumentQueueProducer } from './producers/document-queue.producer';
import { QueueController } from './controllers/queue.controller';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD', undefined),
        },
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'document-processing',
    }),
  ],
  controllers: [QueueController],
  providers: [DocumentProcessorService, DocumentQueueProducer],
  exports: [DocumentQueueProducer],
})
export class QueueModule {}