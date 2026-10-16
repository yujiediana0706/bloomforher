const { GoogleAuth } = require('google-auth-library');
const { readFileSync } = require('fs');

async function test() {
  try {
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    console.log('Key path:', keyPath);

    const key = JSON.parse(readFileSync(keyPath, 'utf8'));
    console.log('Project ID:', key.project_id);

    const auth = new GoogleAuth({ credentials: key, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;
    console.log('Token acquired successfully');

    const url = 'https://us-west1-aiplatform.googleapis.com/v1/projects/107927033625/locations/us-west1/reasoningEngines';
    console.log('Fetching:', url);

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response:', text.slice(0, 500));
  } catch(e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
}

test();
