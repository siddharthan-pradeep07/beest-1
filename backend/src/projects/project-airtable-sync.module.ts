import { Module } from '@nestjs/common';
import { RsvpModule } from '../rsvp/rsvp.module';
import { HcaModule } from '../hca/hca.module';
import { ProjectAirtableSyncService } from './project-airtable-sync.service';

@Module({
  imports: [RsvpModule, HcaModule],
  providers: [ProjectAirtableSyncService],
  exports: [ProjectAirtableSyncService],
})
export class ProjectAirtableSyncModule {}
