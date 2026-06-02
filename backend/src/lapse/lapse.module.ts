import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RsvpModule } from '../rsvp/rsvp.module';
import { Project } from '../entities/project.entity';
import { LapseService } from './lapse.service';
import { LapseController } from './lapse.controller';
import { ReviewerGuard } from '../admin/reviewer.guard';

@Module({
  imports: [AuthModule, RsvpModule, TypeOrmModule.forFeature([Project])],
  controllers: [LapseController],
  providers: [LapseService, ReviewerGuard],
  exports: [LapseService],
})
export class LapseModule {}
