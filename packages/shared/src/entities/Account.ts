import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum AccountRole {
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  AUDITOR = 'AUDITOR',
}

@Entity({ name: 'accounts' })
@Unique(['email', 'tenantId'])
export class Account {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'uuid', generated: 'uuid', unique: true })
  uuid!: string;

  @Column()
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ type: 'enum', enum: AccountRole, default: AccountRole.DEVELOPER })
  role!: AccountRole;

  @Column({ type: 'jsonb', nullable: true })
  groups?: string[];

  // Decoupled from Tenant entity to allow split databases
  @Column({ nullable: true })
  tenantId?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
