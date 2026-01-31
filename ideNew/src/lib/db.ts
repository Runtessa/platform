import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { Account, AccountRole } from '@idp/shared';
import { LoginSession } from '@idp/shared';
import { SystemLog } from '@idp/shared';
import { hashPassword } from "./password";

const dbType = (process.env.DB_TYPE || "postgres") as DataSourceOptions["type"];
const dbName = process.env.DB_NAME;
const normalizeDatabaseUrl = (rawUrl?: string, name?: string) => {
  if (!rawUrl || !name) return rawUrl;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.pathname && parsed.pathname !== "/") {
      return rawUrl;
    }
    parsed.pathname = `/${name}`;
    return parsed.toString();
  } catch {
    return rawUrl;
  }
};
// Use USER_DATABASE_URL or fallback to DATABASE_URL
const databaseUrl = normalizeDatabaseUrl(process.env.USER_DATABASE_URL || process.env.DATABASE_URL, dbName);

const baseOptions = {
  type: dbType,
  url: databaseUrl,
  database: dbName,
  synchronize: true,
  logging: false,
  entities: [Account, LoginSession, SystemLog],
} as DataSourceOptions;

export const AppDataSource = new DataSource(baseOptions);

let initialized = false;

export const ensureSchema = async () => {
  if (!initialized) {
    await AppDataSource.initialize();
    initialized = true;
    console.log(`Data Source has been initialized (${dbType})!`);
  }
};

export const ensureAdminUser = async () => {
  await ensureSchema();
  const repo = AppDataSource.getRepository(Account);
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD;

  if (!password) throw new Error("ADMIN_PASSWORD is required to bootstrap the admin user.");

  let admin = await repo.findOne({ where: { email } });
  const passwordHash = await hashPassword(password);

  // For IDE admin, we assume null tenantId or a system tenant
  if (!admin) {
    admin = repo.create({
      email,
      passwordHash,
      role: AccountRole.ADMIN,
      tenantId: undefined // Platform admin has no tenant? Or nullable?
    });
  } else {
    admin.passwordHash = passwordHash;
    admin.role = AccountRole.ADMIN;
  }
  await repo.save(admin);
};

export const getDataSource = () => AppDataSource;
