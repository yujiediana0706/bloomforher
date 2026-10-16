// Test the Agent Platform Reasoning Engine call
// Usage: npx tsx scripts/test-agent.ts

import { readFileSync } from 'fs';
import { join } from 'path';

// Manually load .env.local
const envPath = join(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join('=');
      }
    }
  });
} catch {
  console.log('.env.local not found; using system environment variables');
}

import { callAgentEndpoint } from '../src/lib/agent-client';

async function testAgent(name: string, endpoint: string) {
  console.log(`\n🧪 Testing agent: ${name}`);
  console.log(`   Endpoint: ${endpoint.slice(0, 60)}...`);

  try {
    const res = await callAgentEndpoint(endpoint, {
      input: 'Hello, please reply with "Agent connection OK" to confirm.',
    });

    if (res) {
      console.log(`   ✅ Success, response: ${res.text.slice(0, 100)}${res.text.length > 100 ? '...' : ''}`);
      return true;
    } else {
      console.log(`   ❌ Returned null (agent call failed)`);
      return false;
    }
  } catch (e: any) {
    console.log(`   ❌ Exception: ${e.message}`);
    return false;
  }
}

async function main() {
  const agents = [
    { name: 'rebloom-assessment', env: 'AGENT_ENDPOINT_ASSESSMENT' },
    { name: 'rebloom-coach', env: 'AGENT_ENDPOINT_COACH' },
    { name: 'rebloom-memory', env: 'AGENT_ENDPOINT_MEMORY' },
    { name: 'rebloom-proactive', env: 'AGENT_ENDPOINT_PROACTIVE' },
    { name: 'rebloom-mentor-match', env: 'AGENT_ENDPOINT_MENTOR_MATCH' },
  ];

  console.log('=== ReBloom AI agent connection test ===');

  let passed = 0;
  let failed = 0;

  for (const { name, env } of agents) {
    const endpoint = process.env[env];
    if (!endpoint) {
      console.log(`\n⏭️  ${name}: ${env} not configured, skipping`);
      continue;
    }

    const ok = await testAgent(name, endpoint);
    if (ok) passed++;
    else failed++;
  }

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
