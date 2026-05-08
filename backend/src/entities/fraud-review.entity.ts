import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';

/**
 * Tracks a beest project's submission to the joe.fraud first-pass fraud review.
 * One row per project (unique on project_id). Created when a beest reviewer
 * approves a project — the project then sits in `fraud_pending` until the
 * background poller observes joe.fraud's verdict.
 */
@Entity('fraud_reviews')
export class FraudReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', unique: true })
  projectId: string;

  @OneToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  // joe.fraud's project UUID. Null if the create call hasn't succeeded yet —
  // the poller retries until it has one.
  @Column({ type: 'varchar', name: 'remote_project_id', length: 64, nullable: true })
  remoteProjectId: string | null;

  // 'pending' | 'complete' (mirrors joe.fraud's project.status)
  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'integer', name: 'trust_score', nullable: true })
  trustScore: number | null;

  @Column({ type: 'text', nullable: true })
  justification: string | null;

  // Whether we've already POSTed the final outcome to joe.fraud after fraud
  // passed. Skipped for fraud-rejected projects (their API forbids it).
  @Column({ type: 'boolean', name: 'outcome_recorded', default: false })
  outcomeRecorded: boolean;

  @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
