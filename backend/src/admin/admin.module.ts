import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { RsvpModule } from '../rsvp/rsvp.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { User } from '../entities/user.entity';
import { Session } from '../entities/session.entity';
import { Project } from '../entities/project.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { NewsItem } from '../entities/news-item.entity';
import { ProjectReview } from '../entities/project-review.entity';
import { ShopItem } from '../entities/shop-item.entity';
import { Order } from '../entities/order.entity';
import { Submission } from '../entities/submission.entity';
import { Event } from '../entities/event.entity';
import { ShopModule } from '../shop/shop.module';
import { HcaModule } from '../hca/hca.module';
import { DevlogsModule } from '../devlogs/devlogs.module';
import { FraudReviewModule } from '../fraud-review/fraud-review.module';
import { ProjectAirtableSyncModule } from '../projects/project-airtable-sync.module';
import { SlackModule } from '../slack/slack.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';
import { SuperAdminGuard } from './super-admin.guard';
import { ReviewerGuard } from './reviewer.guard';
import { FraudReviewerGuard } from './fraud-reviewer.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, Project, AuditLog, NewsItem, ProjectReview, ShopItem, Order, Submission, Event]),
    AuthModule,
    RsvpModule,
    AuditLogModule,
    ShopModule,
    HcaModule,
    DevlogsModule,
    FraudReviewModule,
    ProjectAirtableSyncModule,
    SlackModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AuditService, SuperAdminGuard, ReviewerGuard, FraudReviewerGuard],
})
export class AdminModule {}
