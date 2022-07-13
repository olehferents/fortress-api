import { Exclude } from 'class-transformer';
import { Roles } from 'src/constants/roles.enum';
import { Household } from 'src/modules/models/household/entity/household.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class HouseholdBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Household, (household: Household) => household.badges, { cascade: true })
  household: Household;

  @ManyToOne(() => User, {
    cascade: ['insert', 'update'],
    eager: true,
  })
  user: User;

  @Column()
  count: number;

  @CreateDateColumn()
  @Exclude({toPlainOnly: true})
  createdAt: number;

  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude({toPlainOnly: true})
  updatedAt: number;
}
