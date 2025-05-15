import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { StorageModule } from '../storage/storage.module';
import { DocumentService } from './services/document.service';
import { DocumentController } from './controllers/document.controller';
import { DocumentProcessingController } from './controllers/document-processing.controller';

@Module({
  imports: [
    PrismaModule,
    QueueModule,
    StorageModule,
  ],
  controllers: [
    DocumentController,
    DocumentProcessingController,
  ],
  providers: [
    DocumentService,
  ],
  exports: [
    DocumentService,
  ],
})
export class DocumentModule {}