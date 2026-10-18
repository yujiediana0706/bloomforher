// Test the Agent Platform Reasoning Engine call
// Usage: node --env-file=.env.local scripts/test-agent.js

const { callAgentEndpoint } = require('../src/lib/agent-client');

async function testAgent(name, endpoint) {
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
  } catch (e) {
    console.log(`   ❌ Exception: ${e.message}`);
    return false;
  }
}

async function main() {
  const agents = [
    { name: 'herrise-assessment', env: 'AGENT_ENDPOINT_ASSESSMENT' },
    { name: 'herrise-coach', env: 'AGENT_ENDPOINT_COACH' },
    { name: 'herrise-memory', env: 'AGENT_ENDPOINT_MEMORY' },
    { name: 'herrise-proactive', env: 'AGENT_ENDPOINT_PROACTIVE' },
    { name: 'herrise-mentor-match', env: 'AGENT_ENDPOINT_MENTOR_MATCH' },
  ];

  console.log('=== HerRise agent connection test ===');

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
