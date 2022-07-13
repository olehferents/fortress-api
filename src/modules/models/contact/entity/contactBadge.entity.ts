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
import { Contact } from './contact.entity';

@Entity()
export class ContactBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Contact, (contact: Contact) => contact.badges, { cascade: true })
  // @Exclude({toPlainOnly: true})
  contact: Contact;

  @ManyToOne(() => User, {
    cascade: ['insert', 'update'],
    eager: true,
  })
  user: User;

  @Column()
  count: number;

  @CreateDateColumn()
  // @Exclude({toPlainOnly: true})
  createdAt: number;

  @UpdateDateColumn({ type: 'timestamp' })
  // @Exclude({toPlainOnly: true})
  updatedAt: number;
}
