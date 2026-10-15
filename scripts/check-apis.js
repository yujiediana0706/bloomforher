const { GoogleAuth } = require('google-auth-library');

const keyPath = '/Users/yujiejiang/gcp-keys/rebloom-backend.json';
const projectId = 'buildercup2026-511504';

const candidates = [
  'agent.googleapis.com',
  'agents.googleapis.com',
  'dialogflow.googleapis.com',
  'discoveryengine.googleapis.com',
  'generativelanguage.googleapis.com',
];

async function main() {
  const auth = new GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/cloud-platform.read-only'],
  });
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;

  for (const api of candidates) {
    const url = `https://serviceusage.googleapis.com/v1/projects/${projectId}/services/${api}`;
    try {
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      const state = data.state || 'UNKNOWN';
      const icon = state === 'ENABLED' ? '✅' : '❌';
      console.log(`${icon} ${api}: ${state}`);
    } catch (e) {
      console.log(`❌ ${api}: req fail`);
    }
  }
  process.exit(0);
}

main();
