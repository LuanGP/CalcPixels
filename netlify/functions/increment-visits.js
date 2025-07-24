const { Client } = require('pg');

exports.handler = async function(event, context) {
  // Suporte ao CORS preflight
  if (event.method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL });
  await client.connect();

  await client.query('UPDATE counters SET visits = visits + 1 WHERE id=1');
  const res = await client.query('SELECT visits, calculations FROM counters WHERE id=1');
  await client.end();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify(res.rows[0])
  };
}; 