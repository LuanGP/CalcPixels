const { Client } = require('pg');

const { Client } = require('pg');

exports.handler = async function(event, context) {
  const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL });
  await client.connect();

  await client.query('UPDATE counters SET calculations = calculations + 1 WHERE id=1');
  const res = await client.query('SELECT visits, calculations FROM counters WHERE id=1');
  await client.end();

  return {
    statusCode: 200,
    body: JSON.stringify(res.rows[0])
  };
}; 