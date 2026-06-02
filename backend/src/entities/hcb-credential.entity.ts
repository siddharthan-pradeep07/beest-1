import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { encryptedTransformer } from '../crypto.util';

/**
 * Single-row store for the HCB OAuth connection used to issue card grants.
 *
 * There is exactly one connection for the whole app (one fixed issuing org),
 * so the row is keyed by a constant id. Tokens are stored encrypted at rest
 * via the AES-256-GCM column transformer — they must never be logged or sent
 * to the browser.
 */
@Entity('hcb_credentials')
export class HcbCredential {
  // Constant primary key — there is only ever one connection.
  static readonly SINGLETON_ID = 'singleton';

  @PrimaryColumn({ type: 'varchar', length: 32 })
  id: string;

  @Column({ name: 'access_token', type: 'text', transformer: encryptedTransformer })
  accessToken: string;

  @Column({ name: 'refresh_token', type: 'text', transformer: encryptedTransformer })
  refreshToken: string;

  // When the current access token expires (UTC).
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  scope: string | null;

  // Audit trail: which super admin established / last refreshed the connection.
  @Column({ name: 'connected_by_user_id', type: 'uuid', nullable: true })
  connectedByUserId: string | null;

  @Column({ name: 'connected_by_email', type: 'varchar', length: 320, nullable: true })
  connectedByEmail: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
