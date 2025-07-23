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

    // Dados dos painéis existentes
    const paineisExistentes = [
      { panel_id: '192x192', label: 'P2.5 0.5x0.5 (192x192)', pixels_largura: 192, pixels_altura: 192, largura_real_m: 0.5, altura_real_m: 0.5, grupo: 'P2.x' },
      { panel_id: '256x256', label: 'P2.0 0.5x0.5 (256x256)', pixels_largura: 256, pixels_altura: 256, largura_real_m: 0.5, altura_real_m: 0.5, grupo: 'P2.x' },
      { panel_id: '128x256', label: 'P3.9 0.5x1 (128x256)', pixels_largura: 128, pixels_altura: 256, largura_real_m: 0.5, altura_real_m: 1, grupo: 'P3.9' },
      { panel_id: '128x128', label: 'P3.9 0.5x0.5 (128x128)', pixels_largura: 128, pixels_altura: 128, largura_real_m: 0.5, altura_real_m: 0.5, grupo: 'P3.9' },
      { panel_id: '128x128_P4', label: 'P4 0.512x0.512 (128x128)', pixels_largura: 128, pixels_altura: 128, largura_real_m: 0.512, altura_real_m: 0.512, grupo: 'P4' },
      { panel_id: '192x192_P4', label: 'P4 0.768x0.768 (192x192)', pixels_largura: 192, pixels_altura: 192, largura_real_m: 0.768, altura_real_m: 0.768, grupo: 'P4' },
      { panel_id: '256x256_P4', label: 'P4 1x1 (256x256)', pixels_largura: 256, pixels_altura: 256, largura_real_m: 1, altura_real_m: 1, grupo: 'P4' },
      { panel_id: '192x192_P5', label: 'P5 0.96x0.96 (192x192)', pixels_largura: 192, pixels_altura: 192, largura_real_m: 0.96, altura_real_m: 0.96, grupo: 'P5' },
      { panel_id: '128x128_P5', label: 'P5 0.64x0.64 (128x128)', pixels_largura: 128, pixels_altura: 128, largura_real_m: 0.64, altura_real_m: 0.64, grupo: 'P5' },
      { panel_id: '160x160', label: 'P6 0.96x0.96 (160x160)', pixels_largura: 160, pixels_altura: 160, largura_real_m: 0.96, altura_real_m: 0.96, grupo: 'P6' },
      { panel_id: '96x96_P6', label: 'P6 0.576x0.576 (96x96)', pixels_largura: 96, pixels_altura: 96, largura_real_m: 0.576, altura_real_m: 0.576, grupo: 'P6' },
      { panel_id: '96x96', label: 'P10 0.96x0.96 (96x96)', pixels_largura: 96, pixels_altura: 96, largura_real_m: 0.96, altura_real_m: 0.96, grupo: 'P10' },
      { panel_id: 'manual', label: 'Manual', pixels_largura: 0, pixels_altura: 0, largura_real_m: null, altura_real_m: null, grupo: 'Manual' }
    ];

    let inseridos = 0;
    let ignorados = 0;

    for (const painel of paineisExistentes) {
      try {
        await client.query(`
          INSERT INTO panels (panel_id, label, pixels_largura, pixels_altura, largura_real_m, altura_real_m, grupo)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (panel_id) DO NOTHING
        `, [
          painel.panel_id,
          painel.label,
          painel.pixels_largura,
          painel.pixels_altura,
          painel.largura_real_m,
          painel.altura_real_m,
          painel.grupo
        ]);

        const result = await client.query('SELECT COUNT(*) FROM panels WHERE panel_id = $1', [painel.panel_id]);
        if (result.rows[0].count > 0) {
          inseridos++;
        } else {
          ignorados++;
        }
      } catch (error) {
        console.error(`Erro ao inserir painel ${painel.panel_id}:`, error);
      }
    }

    await client.end();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Migração concluída',
        inseridos,
        ignorados,
        total: inseridos + ignorados
      })
    };

  } catch (error) {
    await client.end();
    console.error('Erro na migração:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
}; 