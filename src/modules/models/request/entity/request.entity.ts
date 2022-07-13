import { Exclude } from "class-transformer";
import { Roles } from "src/constants/roles.enum";
import { Household } from "src/modules/models/household/entity/household.entity";
import { User } from "src/modules/models/user/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm";

@Entity()
export class ContactReq{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, {eager: true, cascade: true})
  target: User;

  @ManyToOne(() => User, {eager: true, cascade: true})
  sender: User;

  @Column({
    nullable: false
  })
  message: string;

  @Column({
    nullable: false,
    default: true
  })
  text: boolean;

  @Column({
    nullable: false,
    default: true
  })
  media: boolean;

  @Column({
    nullable: false,
    default: true
  })
  voiceCall: boolean;

  @Column({
    nullable: false,
    default: true
  })
  videoCall: boolean;
  

  @CreateDateColumn()
  @Exclude({toPlainOnly: true})
  createdAt: number;
}