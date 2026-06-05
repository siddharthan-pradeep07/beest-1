import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { encryptedTransformer } from '../crypto.util';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, name: 'hca_sub' })
  hcaSub: string;

  @Column({ type: 'text', transformer: encryptedTransformer })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  nickname: string;

  @Column({ nullable: true, name: 'slack_id' })
  slackId: string;

  @Column({ nullable: true, name: 'reviewer_user_note', type: 'text' })
  reviewerUserNote: string | null;

  @Column({ name: 'two_emails', default: false })
  twoEmails: boolean;

  @Column({ name: 'has_address', default: false })
  hasAddress: boolean;

  @Column({ name: 'has_birthdate', default: false })
  hasBirthdate: boolean;

  @Column({ nullable: true, name: 'hackatime_user_id' })
  hackatimeUserId: string;

  @Column({ nullable: true })
  gender: string;

  @Column({
    nullable: true,
    name: 'hackatime_token',
    type: 'text',
    transformer: encryptedTransformer,
  })
  hackatimeToken: string;

  @Column({
    nullable: true,
    name: 'hca_access_token',
    type: 'text',
    transformer: encryptedTransformer,
  })
  hcaAccessToken: string;

  @Column({
    nullable: true,
    name: 'hca_refresh_token',
    type: 'text',
    transformer: encryptedTransformer,
  })
  hcaRefreshToken: string;

  @Column({ type: 'integer', default: 0 })
  pipes: number;

  @Column({ nullable: true, name: 'utm_source' })
  utmSource: string;

  @Column({ nullable: true, name: 'utm_medium' })
  utmMedium: string;

  @Column({ nullable: true, name: 'utm_campaign' })
  utmCampaign: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ nullable: true, name: 'landing_path' })
  landingPath: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
