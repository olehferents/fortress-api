import { Roles } from "src/constants/roles.enum";
import { User } from "src/modules/models/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({nullable: false, default: true})
  notify: boolean = true;

  @ManyToOne(() => User, (user: User) => user.devices)
  @JoinColumn({
    name: 'userId',
  })
  user: User;

  @Column({nullable: false})
  os: string;

  @Column({nullable: false})
  token: string;

  @CreateDateColumn()
  createdAt: number;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: number;
}