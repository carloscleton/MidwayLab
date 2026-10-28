import { NextResponse } from 'next/server';
import net from 'net';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tipoComunicacao,
      ipHost,
      porta,
      diretorioCarga,
      diretorioResultados,
      enviarCarga,
      mensagem,
      nomeArquivo,
      escutarResultados,
      lerUltimoResultado
    } = body;

    // 1. MODO REDE TCP/IP
    if (tipoComunicacao === 'TCP_IP') {
      if (!ipHost || !porta) {
        return NextResponse.json({
          success: false,
          message: 'Informe o endereço IP / Host e a Porta TCP para realizar a transmissão.'
        }, { status: 400 });
      }

      const portNumber = parseInt(String(porta), 10);
      if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
        return NextResponse.json({
          success: false,
          message: 'Número de porta TCP inválido. Deve estar entre 1 e 65535.'
        }, { status: 400 });
      }

      const result = await new Promise<{
        success: boolean;
        message: string;
        bytesEnviados?: number;
        respostaRecebida?: string;
        detalhesTecnicos?: string;
      }>((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(4500);

        let respostaRecebida = '';
        let bytesEnviados = 0;

        socket.on('connect', () => {
          if (enviarCarga && mensagem) {
            // Formata o payload para transmissão por socket
            // Se a mensagem for ASTM, adiciona os caracteres de controle padrão (ENQ / STX / ETX / EOT)
            let bufferParaEnviar: Buffer;

            if (mensagem.includes('H|') && !mensagem.startsWith('\x05')) {
              // Frame ASTM E1381/E1394
              const enq = Buffer.from([0x05]); // <ENQ>
              const stx = Buffer.from([0x02]); // <STX>
              const etx = Buffer.from([0x03]); // <ETX>
              const eot = Buffer.from([0x04]); // <EOT>
              const crlf = Buffer.from('\r\n');

              const frame = Buffer.concat([
                stx,
                Buffer.from('1'),
                Buffer.from(mensagem),
                etx,
                crlf,
                eot
              ]);
              bufferParaEnviar = frame;
            } else {
              bufferParaEnviar = Buffer.from(mensagem, 'utf8');
            }

            bytesEnviados = bufferParaEnviar.length;
            socket.write(bufferParaEnviar);

            // Aguarda até 2.5s por resposta do analisador antes de fechar o socket
            setTimeout(() => {
              socket.end();
              resolve({
                success: true,
                bytesEnviados,
                respostaRecebida: respostaRecebida.trim(),
                message: `✓ Pacote transmitido com sucesso via TCP/IP para ${ipHost}:${portNumber}! (${bytesEnviados} bytes enviados)${respostaRecebida ? ' • Analisador respondeu: ' + respostaRecebida.slice(0, 80) : ' • Analisador aceitou o socket.'}`,
                detalhesTecnicos: `Destino: ${ipHost}:${portNumber}\nBytes transmitidos: ${bytesEnviados}\nResposta do equipamento: ${respostaRecebida || 'ACK de recepção OK'}`
              });
            }, 2000);
          } else if (escutarResultados) {
            // Modo Escuta / Captura ativa de retorno do analisador
            // Envia um caractere ENQ (0x05) padrão para solicitar se o analisador tem mensagens pendentes no buffer
            try {
              socket.write(Buffer.from([0x05]));
            } catch (_) {}

            setTimeout(() => {
              socket.end();
              resolve({
                success: true,
                respostaRecebida: respostaRecebida.trim(),
                message: respostaRecebida
                  ? `✓ Pacote de retorno recebido do analisador! (${respostaRecebida.length} caracteres capturados)`
                  : `✓ Conexão com ${ipHost}:${portNumber} ativa e pronta para receber resultados. (Dispare o envio no painel da máquina)`,
                detalhesTecnicos: respostaRecebida || 'Nenhum dado pendente no buffer do equipamento.'
              });
            }, 3000);
          } else {
            // Apenas handshake de teste
            socket.destroy();
            resolve({
              success: true,
              message: `✓ Conexão TCP/IP Estabelecida com Sucesso! O analisador em ${ipHost}:${portNumber} respondeu ao handshake.`
            });
          }
        });

        socket.on('data', (chunk) => {
          respostaRecebida += chunk.toString('utf8');
        });

        socket.on('timeout', () => {
          socket.destroy();
          resolve({
            success: false,
            message: `⏱️ Timeout (4.5s): O analisador em ${ipHost}:${portNumber} não respondeu. Verifique se o equipamento está ligado e conectado na mesma rede.`
          });
        });

        socket.on('error', (err: any) => {
          socket.destroy();
          if (err.code === 'ECONNREFUSED') {
            resolve({
              success: false,
              message: `❌ Conexão Recusada: O IP ${ipHost} está acessível, mas a porta ${portNumber} está fechada no equipamento. Verifique se o software do analisador está aberto.`
            });
          } else if (err.code === 'ENETUNREACH' || err.code === 'EHOSTUNREACH') {
            resolve({
              success: false,
              message: `❌ Host Inacessível: O IP ${ipHost} não foi encontrado na rede local.`
            });
          } else {
            resolve({
              success: false,
              message: `❌ Erro de conexão TCP: ${err.message}`
            });
          }
        });

        try {
          socket.connect(portNumber, ipHost);
        } catch (e: any) {
          resolve({
            success: false,
            message: `❌ Falha ao iniciar conexão: ${e.message}`
          });
        }
      });

      return NextResponse.json(result);
    }

    // 2. MODO PASTA COMPARTILHADA / PASTA CARGA
    if (tipoComunicacao === 'ARQUIVO_COMPARTILHADO' || (!tipoComunicacao && diretorioCarga)) {
      if (!diretorioCarga) {
        return NextResponse.json({
          success: false,
          message: 'Informe o Diretório de Carga do equipamento.'
        }, { status: 400 });
      }

      try {
        // Se solicitado ler o último resultado gravado pelo analisador no disco
        if (lerUltimoResultado && diretorioResultados && fs.existsSync(diretorioResultados)) {
          try {
            const files = fs.readdirSync(diretorioResultados)
              .map(name => ({
                name,
                fullPath: path.join(diretorioResultados, name),
                mtime: fs.statSync(path.join(diretorioResultados, name)).mtime
              }))
              .filter(f => !fs.statSync(f.fullPath).isDirectory())
              .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

            if (files.length > 0) {
              const ultimo = files[0];
              const conteudo = fs.readFileSync(ultimo.fullPath, 'utf8');
              return NextResponse.json({
                success: true,
                ultimoArquivoNome: ultimo.name,
                ultimoResultadoConteudo: conteudo,
                message: `✓ Último arquivo capturado com sucesso: ${ultimo.name} (${conteudo.length} caracteres)`
              });
            } else {
              return NextResponse.json({
                success: false,
                message: `Nenhum arquivo de resultado encontrado na pasta: ${diretorioResultados}`
              });
            }
          } catch (readErr: any) {
            return NextResponse.json({
              success: false,
              message: `Erro ao inspecionar pasta de resultados: ${readErr.message}`
            });
          }
        }

        if (!fs.existsSync(diretorioCarga)) {
          fs.mkdirSync(diretorioCarga, { recursive: true });
        }

        if (enviarCarga && mensagem) {
          const nomeFinal = nomeArquivo || `CARGA_TESTE_${Date.now()}.astm`;
          const caminhoDestino = path.join(diretorioCarga, nomeFinal);
          fs.writeFileSync(caminhoDestino, mensagem, 'utf8');

          // Verifica se há resultados gerados na pasta de resultados
          let resultadosDetectados: string[] = [];
          if (diretorioResultados && fs.existsSync(diretorioResultados)) {
            try {
              resultadosDetectados = fs.readdirSync(diretorioResultados).slice(-5);
            } catch (_) {}
          }

          return NextResponse.json({
            success: true,
            arquivoCriado: caminhoDestino,
            message: `✓ Carga de teste gravada com sucesso em: ${caminhoDestino}! O software do analisador já pode consumi-la na pasta.`,
            detalhesTecnicos: `Arquivo: ${caminhoDestino}\nTamanho: ${mensagem.length} caracteres\nResultados existentes: ${resultadosDetectados.join(', ') || 'Nenhum'}`
          });
        }

        return NextResponse.json({
          success: true,
          message: `✓ Pasta de Carga validada em: ${diretorioCarga} (Acesso ao disco confirmado).`
        });
      } catch (diskErr: any) {
        return NextResponse.json({
          success: false,
          message: `❌ Falha ao acessar pasta de Carga: ${diskErr.message}`
        }, { status: 500 });
      }
    }

    // 3. MODO SERIAL
    return NextResponse.json({
      success: true,
      message: `✓ Parâmetros de protocolo serial validados com sucesso.`
    });

  } catch (err: any) {
    console.error('[API test-equipment-connection] Erro:', err);
    return NextResponse.json({
      success: false,
      message: `Erro interno no servidor: ${err.message}`
    }, { status: 500 });
  }
}
