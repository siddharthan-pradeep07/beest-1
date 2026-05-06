import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';

/**
 * A user's hourly devlog entry. Optionally linked to one of their projects so
 * reviewers can see hour-by-hour progress on the project review screen.
 */
@Entity('devlogs')
export class Devlog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'project_id', nullable: true })
  projectId: string | null;

  @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project | null;

  @Column({ length: 120 })
  title: string;

  @Column({ type: 'text' })
  text: string;

  /**
   * CDN URLs for any uploaded images. Stored as a JSON-serialised string
   * for portability (matches the pattern used by Project.hackatimeProjectName).
   */
  @Column({
    type: 'text',
    name: 'image_urls',
    nullable: true,
    transformer: {
      to: (value: string[] | null) =>
        value && value.length > 0 ? JSON.stringify(value) : null,
      from: (value: string | null) => {
        if (!value) return [];
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      },
    },
  })
  imageUrls: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
