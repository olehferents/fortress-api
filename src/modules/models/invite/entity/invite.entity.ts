import { Exclude } from "class-transformer";
import { Roles } from "src/constants/roles.enum";
import { Device } from "src/modules/notification/entity/device.entity";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Household } from "../../household/entity/household.entity";
import { ContactReq } from "../../request/entity/request.entity";
import { User } from "../../user/entities/user.entity";

@Entity()
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({nullable: false})
  phoneNumber: string

  @Column({nullable: false, unique: false})
  role: string = Roles.OTHER;

  @ManyToOne(() => User, { eager: false, cascade: false })
  invitedBy: User;

  @CreateDateColumn()
  createdAt: number;
}
