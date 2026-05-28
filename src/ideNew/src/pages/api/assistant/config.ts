import type { NextApiRequest, NextApiResponse } from 'next';
import { withApiHandler } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { CODEX_SYSTEM_INSTRUCTIONS, resolveCodexModelFromEnv } from '@/lib/assistant/codex';
import { ASSISTANT_SYSTEM_INSTRUCTIONS } from '@/lib/assistant/agent';
import { resolveCodexGatewayBase, resolveCodexGatewayProvider } from '@/lib/assistant/gateway';

export default withApiHandler(async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).end();
    return;
  }

  await requireUser(req);

  const agentType = (process.env.AGENT_TYPE || 'orchestrator').trim().toLowerCase();
  if (agentType === 'codex') {
    const gatewayUrl = resolveCodexGatewayBase();
    res.status(200).json({
      agentType,
      allowClientConfig: false,
      baseUrl: '',
      model: resolveCodexModelFromEnv() ?? '',
      provider: gatewayUrl ? resolveCodexGatewayProvider() : 'codex-cli',
      hasApiKey: false,
      systemPrompt: CODEX_SYSTEM_INSTRUCTIONS,
      watchPreviewExceptions: false,
    });
    return;
  }

  const hermesMode = agentType === 'hermes';
  res.status(200).json({
    agentType,
    allowClientConfig: process.env.AI_ALLOW_CLIENT_CONFIG === 'true',
    baseUrl: hermesMode ? (process.env.HERMES_BASE_URL ?? process.env.AI_BASE_URL ?? '') : (process.env.AI_BASE_URL ?? ''),
    model: hermesMode ? (process.env.HERMES_MODEL ?? process.env.AI_MODEL ?? '') : (process.env.AI_MODEL ?? ''),
    provider: hermesMode ? 'hermes' : (process.env.AI_PROVIDER ?? ''),
    hasApiKey: hermesMode ? Boolean(process.env.HERMES_API_TOKEN || process.env.AI_API_KEY) : Boolean(process.env.AI_API_KEY),
    systemPrompt: ASSISTANT_SYSTEM_INSTRUCTIONS,
    watchPreviewExceptions: false,
  });
});
