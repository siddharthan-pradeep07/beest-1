import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export const AUDIT_ACTIONS = [
  'project_created',
  'project_updated',
  'project_submitted',
  'project_deleted',
  'hackatime_connected',
  'hackatime_ownership_failed',
  'rsvp_submitted',
  'admin_ban',
  'admin_perms_change',
  'admin_pipes_adjust',
  'project_reviewed',
  'admin_impersonate',
  'admin_resync_airtable',
  'shop_purchase',
  'order_fulfilled',
  'order_refunded',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 50 })
  action: string;

  @Column({ length: 255 })
  label: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
