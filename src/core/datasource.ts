import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Tenant } from '@idp/shared';
import { Account } from '@idp/shared';
import { Secret } from '@idp/shared';
import { ModuleEntity } from '@idp/shared';
import { UIPackage } from '@idp/shared';
import { ModuleRevision } from '@idp/shared';
import { UIPackageRevision } from '@idp/shared';
import { GlobalUIPackage } from '@idp/shared';
import { GlobalUIPackageFile } from '@idp/shared';
import { LoginSession } from '@idp/shared';
import { SystemLog } from '@idp/shared';

// Core DB Options (Tenants, Modules)
const coreConnectionOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.CORE_DATABASE_URL || process.env.DATABASE_URL,
  host: process.env.CORE_DB_HOST || process.env.DB_HOST,
  port: (process.env.CORE_DB_PORT || process.env.DB_PORT) ? parseInt(process.env.CORE_DB_PORT || process.env.DB_PORT!, 10) : 5432,
  username: process.env.CORE_DB_USER || process.env.DB_USER,
  password: process.env.CORE_DB_PASS || process.env.DB_PASS,
  database: process.env.CORE_DB_NAME || process.env.DB_NAME,
  synchronize: true,
  logging: process.env.DB_LOGGING === 'true',
  entities: [
    Tenant,
    Secret,
    ModuleEntity,
    UIPackage,
    GlobalUIPackage,
    GlobalUIPackageFile,
    ModuleRevision,
    UIPackageRevision,
  ],
  subscribers: [],
  migrations: [],
};

// User DB Options (Accounts, Sessions, Logs)
const userConnectionOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.USER_DATABASE_URL || process.env.DATABASE_URL,
  host: process.env.USER_DB_HOST || process.env.DB_HOST,
  port: (process.env.USER_DB_PORT || process.env.DB_PORT) ? parseInt(process.env.USER_DB_PORT || process.env.DB_PORT!, 10) : 5432,
  username: process.env.USER_DB_USER || process.env.DB_USER,
  password: process.env.USER_DB_PASS || process.env.DB_PASS,
  database: process.env.USER_DB_NAME || process.env.DB_NAME,
  synchronize: true,
  logging: process.env.DB_LOGGING === 'true',
  entities: [
    Account,
    LoginSession,
    SystemLog,
  ],
  subscribers: [],
  migrations: [],
};

export const CoreDataSource = new DataSource(coreConnectionOptions);
export const UserDataSource = new DataSource(userConnectionOptions);

export const initializeDataSources = async (): Promise<{ core: DataSource, user: DataSource }> => {
  const inits = [];

  if (!CoreDataSource.isInitialized) {
    inits.push(CoreDataSource.initialize().catch(err => {
      console.error('Failed to initialize CoreDataSource:', err);
      throw err;
    }));
  }

  if (!UserDataSource.isInitialized) {
    inits.push(UserDataSource.initialize().catch(err => {
      console.error('Failed to initialize UserDataSource:', err);
      throw err;
    }));
  }

  await Promise.all(inits);
  return { core: CoreDataSource, user: UserDataSource };
};

// Legacy export to force compile errors where AppDataSource is used
// export const AppDataSource = CoreDataSource;
