import { Entity, PrimaryGeneratedColumn, CreateDateColumn, Column, ManyToOne } from "typeorm";
import { User } from "../../user/entities/user.entity";

@Entity()
export class MissedCall {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({nullable: false})
  type: 'contact' | 'household'

  @ManyToOne(() => User, {eager: true, cascade: true})
  from: User;

  @CreateDateColumn()
  createdAt: number;
}
