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

  // Cria a tabela se não existir
  await client.query(`
    CREATE TABLE IF NOT EXISTS counters (
      id SERIAL PRIMARY KEY,
      visits INTEGER DEFAULT 0,
      calculations INTEGER DEFAULT 0
    );
  `);

  // Garante que existe uma linha
  await client.query(`
    INSERT INTO counters (id, visits, calculations)
    VALUES (1, 0, 0)
    ON CONFLICT (id) DO NOTHING;
  `);

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