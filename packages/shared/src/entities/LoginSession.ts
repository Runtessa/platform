import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Account } from "./Account";

@Entity("login_sessions")
export class LoginSession {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'uuid', generated: 'uuid', unique: true })
  uuid!: string;

  @Column({ name: "account_id" })
  accountId!: string;

  @ManyToOne(() => Account, { onDelete: "CASCADE" })
  @JoinColumn({ name: "account_id" })
  account!: Account;

  @Column({ unique: true, type: "varchar" })
  token!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
