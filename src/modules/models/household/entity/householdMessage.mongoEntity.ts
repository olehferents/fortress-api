import { Household } from './household.entity';
import { User } from 'src/modules/models/user/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn, ObjectIdColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class HouseholdMessage{
  @ObjectIdColumn()
  id: number;

  @Column()
  householdId: string;

  @Column()
  userId: string;

  @Column()
  type: 'message' | 'missedCall' = 'message';

  @Column({nullable: true})
  temporaryId : string;

  @Column({nullable: true})
  body: string;

  @Column("simple-array", {nullable: true})
  messageImages: string[];

  @Column("simple-array", {nullable: true})
  messageDocuments: string[];

  @Column({nullable: true})
  messageVoice: string;
  

  @CreateDateColumn()
  createdAt: number;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: number;
}