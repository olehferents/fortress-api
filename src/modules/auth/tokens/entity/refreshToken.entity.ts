import { User } from "src/modules/models/user/entities/user.entity";
import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn, ManyToOne } from "typeorm";

@Entity()
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  isRevoked: boolean

  @Column()
  expires: Date;
}