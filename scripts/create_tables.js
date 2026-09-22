const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createTables() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('ERRO: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados no arquivo .env!');
        console.log('\nExemplo no arquivo .env:');
        console.log('SUPABASE_URL=https://seu-projeto.supabase.co');
        console.log('SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...');
        return;
    }

    console.log('Conectando ao Supabase:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const sqlPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executando a criação das tabelas...');

    // Execute via RPC or Postgres REST endpoint if enabled, or alert user
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
        if (error) {
            console.log('Aviso ao executar via RPC (pode exigir a função exec_sql no Supabase):', error.message);
            console.log('\nVocê também pode copiar o arquivo sql/schema.sql diretamente no SQL Editor do Dashboard do Supabase!');
        } else {
            console.log('SUCESSO! Tabelas criadas no Supabase com êxito!');
        }
    } catch (e) {
        console.error('Erro na conexão:', e.message);
    }
}

createTables();
