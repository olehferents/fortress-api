import { Entity, ObjectIdColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class ContactMessage{
  @ObjectIdColumn()
  id: number;

  @Column()
  contactId: string;

  @Column()
  type: 'message' | 'missedCall' = 'message';

  @Column()
  userId: string;

  @Column({nullable: true})
  temporaryId: string;

  @Column({nullable: true})
  body: string;

  @Column("simple-array", {nullable: true})
  messageImages?: string[];

  @Column("simple-array", {nullable: true})
  messageDocuments: string[];

  @Column({nullable: true})
  messageVoice: string;
  
  @CreateDateColumn()
  createdAt: number;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: number;
}