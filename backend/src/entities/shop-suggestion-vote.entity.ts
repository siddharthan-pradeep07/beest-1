import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { ShopSuggestion } from './shop-suggestion.entity';

@Entity('shop_suggestion_votes')
@Unique('UQ_shop_suggestion_votes_user_suggestion', ['userId', 'suggestionId'])
export class ShopSuggestionVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'suggestion_id' })
  suggestionId: string;

  @ManyToOne(() => ShopSuggestion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'suggestion_id' })
  suggestion: ShopSuggestion;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
