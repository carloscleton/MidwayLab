import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modelo, diretorioCarga, nomeArquivo, conteudo, pedidos } = body;

    // Se receber múltiplos arquivos em lote (batch)
    if (Array.isArray(pedidos) && pedidos.length > 0) {
      const resultados = [];
      for (const item of pedidos) {
        const itemModelo = (item.modelo || modelo || 'SYSMEX_UF_1500').toUpperCase().trim();
        const targetDir = (item.diretorioCarga || diretorioCarga && diretorioCarga.trim().length > 0)
          ? (item.diretorioCarga || diretorioCarga).trim()
          : path.join('C:\\MidwayLab', 'Equipamentos', itemModelo, 'Carga');

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const fullPath = path.join(targetDir, item.nomeArquivo);
        fs.writeFileSync(fullPath, item.conteudo ?? item.arquivo ?? '', 'utf8');

        resultados.push({
          pedido: item.pedido,
          nomeArquivo: item.nomeArquivo,
          caminhoCompleto: fullPath,
          pasta: targetDir,
          sucesso: true
        });
      }

      return NextResponse.json({
        success: true,
        total: resultados.length,
        arquivos: resultados,
        mensagem: `${resultados.length} carga(s) gravada(s) diretamente na pasta do equipamento!`
      });
    }

    if (!nomeArquivo || conteudo === undefined) {
      return NextResponse.json(
        { success: false, error: 'nomeArquivo e conteudo são obrigatórios' },
        { status: 400 }
      );
    }

    const mod = (modelo || 'SYSMEX_UF_1500').toUpperCase().trim();
    const targetDir = (diretorioCarga && diretorioCarga.trim().length > 0)
      ? diretorioCarga.trim()
      : path.join('C:\\MidwayLab', 'Equipamentos', mod, 'Carga');

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fullPath = path.join(targetDir, nomeArquivo);
    fs.writeFileSync(fullPath, conteudo, 'utf8');

    return NextResponse.json({
      success: true,
      nomeArquivo,
      caminhoCompleto: fullPath,
      pasta: targetDir,
      mensagem: `Arquivo salvo com sucesso diretamente em: ${fullPath}`
    });
  } catch (error: any) {
    console.error('[save-worklist-direct] Erro ao salvar arquivo:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao gravar arquivo na pasta de carga' },
      { status: 500 }
    );
  }
}
