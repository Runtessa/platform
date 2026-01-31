import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';
import { withApiHandler } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { AppDataSource, ensureSchema } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { Account, AccountRole } from '@idp/shared';

export default withApiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    await requireAdmin(req);
    await ensureSchema();
    const repo = AppDataSource.getRepository(Account);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [accounts, total] = await repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit
    });

    res.status(200).json({ users: accounts, total });
    return;
  }

  if (req.method === 'POST') {
    await requireAdmin(req);
    const { email, role = 'user', password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const accountRole = role === 'admin' ? AccountRole.ADMIN : AccountRole.DEVELOPER;

    await ensureSchema();
    const repo = AppDataSource.getRepository(Account);
    const passwordHash = await hashPassword(password);

    let account = await repo.findOne({ where: { email } });
    if (!account) {
      account = repo.create({
        email,
        passwordHash,
        role: accountRole,
        tenantId: undefined // TODO: Handle tenant assignment if needed
      });
    } else {
      account.passwordHash = passwordHash;
      account.role = accountRole;
    }

    await repo.save(account);

    res.status(201).json({ user: { email: account.email, role: account.role } });
    return;
  }

  if (req.method === 'PUT') {
    await requireAdmin(req);
    const { email, role, password } = req.body || {};
    if (!email) {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    await ensureSchema();
    const repo = AppDataSource.getRepository(Account);
    const existing = await repo.findOne({ where: { email } });
    if (!existing) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    if (role) {
       existing.role = role === 'admin' ? AccountRole.ADMIN : AccountRole.DEVELOPER;
    }

    // Token updates removed

    if (password) {
      const passwordHash = await hashPassword(password);
      existing.passwordHash = passwordHash;
    }

    const saved = await repo.save(existing);
    res.status(200).json({
      user: { email: saved.email, role: saved.role, createdAt: saved.createdAt }
    });
    return;
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT']);
  res.status(405).end();
});
