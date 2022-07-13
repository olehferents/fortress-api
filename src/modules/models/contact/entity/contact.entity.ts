import { Exclude } from 'class-transformer';
import { Roles } from 'src/constants/roles.enum';
import { Household } from 'src/modules/models/household/entity/household.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ContactBadge } from './contactBadge.entity';

@Entity()
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => ContactBadge, (badge: ContactBadge) => badge.contact, {
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  badges: ContactBadge[]

  @ManyToMany(() => User, (user) => user.contacts, {
    cascade: ['insert', 'update'],
    eager: true,
  })
  users: User[];

  @Column({ nullable: false })
  text: boolean;

  @Column({ nullable: false })
  media: boolean;

  @Column({ nullable: false })
  voiceCall: boolean;

  @Column({ nullable: false })
  videoCall: boolean;

  @CreateDateColumn()
  @Exclude({toPlainOnly: true})
  createdAt: number;

  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude({toPlainOnly: true})
  updatedAt: number;
}
