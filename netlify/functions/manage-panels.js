const { Client } = require('pg');

exports.handler = async function(event, context) {
  const client = new Client({ connectionString: process.env.NETLIFY_DATABASE_URL });
  await client.connect();

  try {
    // Criar tabela se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS panels (
        id SERIAL PRIMARY KEY,
        panel_id VARCHAR(50) UNIQUE NOT NULL,
        label VARCHAR(200) NOT NULL,
        pixels_largura INTEGER NOT NULL,
        pixels_altura INTEGER NOT NULL,
        largura_real_m DECIMAL(10,3),
        altura_real_m DECIMAL(10,3),
        grupo VARCHAR(50) NOT NULL,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

    let result;

    switch (method) {
      case 'GET':
        // Listar todos os painéis ativos
        const res = await client.query('SELECT * FROM panels WHERE ativo = true ORDER BY grupo, label');
        result = res.rows;
        break;

      case 'POST':
        // Criar novo painel
        const { panel_id, label, pixels_largura, pixels_altura, largura_real_m, altura_real_m, grupo } = data;
        
        if (!panel_id || !label || !pixels_largura || !pixels_altura || !grupo) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Campos obrigatórios: panel_id, label, pixels_largura, pixels_altura, grupo' })
          };
        }

        const insertRes = await client.query(`
          INSERT INTO panels (panel_id, label, pixels_largura, pixels_altura, largura_real_m, altura_real_m, grupo)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [panel_id, label, pixels_largura, pixels_altura, largura_real_m, altura_real_m, grupo]);
        
        result = insertRes.rows[0];
        break;

      case 'PUT':
        // Atualizar painel
        const { id, ...updateData } = data;
        
        if (!id) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'ID é obrigatório para atualização' })
          };
        }

        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;

        Object.keys(updateData).forEach(key => {
          if (updateData[key] !== undefined) {
            updateFields.push(`${key} = $${paramCount}`);
            updateValues.push(updateData[key]);
            paramCount++;
          }
        });

        if (updateFields.length === 0) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Nenhum campo para atualizar' })
          };
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(id);

        const updateRes = await client.query(`
          UPDATE panels 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `, updateValues);

        if (updateRes.rows.length === 0) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Painel não encontrado' })
          };
        }

        result = updateRes.rows[0];
        break;

      case 'DELETE':
        // Deletar painel (soft delete)
        const { id: deleteId } = data;
        
        if (!deleteId) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'ID é obrigatório para exclusão' })
          };
        }

        const deleteRes = await client.query(`
          UPDATE panels 
          SET ativo = false, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING *
        `, [deleteId]);

        if (deleteRes.rows.length === 0) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Painel não encontrado' })
          };
        }

        result = { message: 'Painel deletado com sucesso' };
        break;

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Método não permitido' })
        };
    }

    await client.end();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify(result)
    };

  } catch (error) {
    await client.end();
    console.error('Erro:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
}; 