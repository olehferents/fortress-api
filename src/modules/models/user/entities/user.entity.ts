import { Exclude } from 'class-transformer';
import moment from 'moment';
import { Roles } from 'src/constants/roles.enum';
import { Household } from 'src/modules/models/household/entity/household.entity';
import { Device } from 'src/modules/notification/entity/device.entity';
import { ContactReq } from 'src/modules/models/request/entity/request.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  Column,
  OneToOne,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Contact } from '../../contact/entity/contact.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    nullable: false,
    unique: true,
  })
  username: string;

  @Column({
    nullable: false,
  })
  firstName: string;

  @Column({
    nullable: false,
  })
  lastName: string;

  @Column({
    unique: true,
    nullable: true,
  })
  email: string;

  @Column({
    nullable: false,
  })
  @Exclude({toPlainOnly: true})
  password: string;

  @Column({
    length: 15,
    unique: true,
    nullable: true,
  })
  phoneNumber: string;

  @Column({
    nullable: true,
  })
  profileImage: string;

  @Column({
    nullable: false,
  })
  birthday: string;

  @Column({
    nullable: false,
    default: Roles.OTHER,
  })
  role: string;

  @ManyToOne(() => Household, (household: Household) => household.users, {
    eager: false,
    cascade: true,
  })
  household: Household;

  @OneToMany(() => Device, (device: Device) => device.user, { 
    eager: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @Exclude()
  devices: Device[];

  @ManyToMany(() => ContactReq, { eager: false, cascade: true })
  @JoinTable()
  inReq: ContactReq[];

  @ManyToMany(() => ContactReq, { eager: false, cascade: true })
  @JoinTable()
  outReq: ContactReq[];

  @ManyToMany(() => Contact, (contact) => contact.users, {
    eager: false,
    cascade: ['remove', 'update', 'insert'],
  })
  @JoinTable({
    name: 'contact_users',
    joinColumn: { name: 'userId' },
    inverseJoinColumn: { name: 'contactId' },
  })
  contacts: Contact[];

  @ManyToOne(() => User, { eager: false, cascade: true })
  primaryAccount: User;

  @CreateDateColumn()
  @Exclude({toPlainOnly: true})
  createdAt: number;

  @UpdateDateColumn({ type: 'timestamp' })
  @Exclude({toPlainOnly: true})
  updatedAt: number;

  @Column()
  @Exclude({toPlainOnly: true})
  isActive: boolean = false;

  @Column()
  @Exclude({toPlainOnly: true})
  isSuspended: boolean = false;
}
