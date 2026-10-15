// 测试 Agent Platform Reasoning Engine 调用
// 用法：node --env-file=.env.local scripts/test-agent.js

const { callAgentEndpoint } = require('../src/lib/agent-client');

async function testAgent(name, endpoint) {
  console.log(`\n🧪 测试 Agent: ${name}`);
  console.log(`   Endpoint: ${endpoint.slice(0, 60)}...`);

  try {
    const res = await callAgentEndpoint(endpoint, {
      input: '你好，请回复「Agent 连接正常」即可。',
    });

    if (res) {
      console.log(`   ✅ 成功，返回: ${res.text.slice(0, 100)}${res.text.length > 100 ? '...' : ''}`);
      return true;
    } else {
      console.log(`   ❌ 返回 null（Agent 调用失败）`);
      return false;
    }
  } catch (e) {
    console.log(`   ❌ 异常: ${e.message}`);
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

  console.log('=== ReBloom AI Agent 连接测试 ===');

  let passed = 0;
  let failed = 0;

  for (const { name, env } of agents) {
    const endpoint = process.env[env];
    if (!endpoint) {
      console.log(`\n⏭️  ${name}: 未配置 ${env}，跳过`);
      continue;
    }

    const ok = await testAgent(name, endpoint);
    if (ok) passed++;
    else failed++;
  }

  console.log(`\n=== 结果: ${passed} 通过, ${failed} 失败 ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
