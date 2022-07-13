import { MessagesEnum } from "src/constants/messagesEnum/messages.enum";
import { User } from "src/modules/models/user/entities/user.entity";
import { Entity, PrimaryGeneratedColumn, OneToOne, JoinColumn, OneToMany, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { HouseholdBadge } from "./householdBadge.entity";
import { HouseholdMessage } from "./householdMessage.mongoEntity";


@Entity()
export class Household {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => User, (user: User) => user.household,
    {
      eager: true,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    }
    )
  users: User[];

  @OneToMany(() => HouseholdBadge, (badge: HouseholdBadge) => badge.household, {
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  badges: HouseholdBadge[]


  @CreateDateColumn()
  createdAt: number;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: number;

  @Column({nullable: false, default: false})
  hasSecondParent: boolean;
}