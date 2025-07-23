const { Client } = require('pg');

exports.handler = async function(event, context) {
  const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL });
  await client.connect();

  try {
    // Criar tabela de usuários se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Verificar se existe usuário admin padrão
    const userCheck = await client.query('SELECT COUNT(*) FROM admin_users');
    if (userCheck.rows[0].count == 0) {
      // Criar usuário admin padrão (senha: admin123)
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(`
        INSERT INTO admin_users (username, password_hash)
        VALUES ('admin', $1)
      `, [hashedPassword]);
    }

    const { method, body } = event;
    let data = {};
    
    if (body) {
      try {
        data = JSON.parse(body);
      } catch (e) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid JSON' })
        };
      }
    }

    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: ''
      };
    }

    if (method === 'POST') {
      const { username, password } = data;
      
      if (!username || !password) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Username e password são obrigatórios' })
        };
      }

      // Buscar usuário
      const userRes = await client.query('SELECT * FROM admin_users WHERE username = $1', [username]);
      
      if (userRes.rows.length === 0) {
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Usuário ou senha inválidos' })
        };
      }

      const user = userRes.rows[0];
      const bcrypt = require('bcrypt');
      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Usuário ou senha inválidos' })
        };
      }

      // Gerar token simples (em produção, use JWT)
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

      await client.end();

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          success: true, 
          token,
          message: 'Login realizado com sucesso'
        })
      };
    }

    await client.end();

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' })
    };

  } catch (error) {
    await client.end();
    console.error('Erro na autenticação:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
}; 