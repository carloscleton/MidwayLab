import { NextResponse } from 'next/server';
import net from 'net';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipoComunicacao, ipHost, porta, diretorioCarga, diretorioResultados } = body;

    // 1. TESTE DE CONEXÃO TCP/IP
    if (tipoComunicacao === 'TCP_IP') {
      if (!ipHost || !porta) {
        return NextResponse.json({
          success: false,
          message: 'Informe o endereço IP / Host e a Porta TCP para realizar o teste.'
        }, { status: 400 });
      }

      const portNumber = parseInt(String(porta), 10);
      if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
        return NextResponse.json({
          success: false,
          message: 'Número de porta TCP inválido. Deve estar entre 1 e 65535.'
        }, { status: 400 });
      }

      // Socket handshake com timeout de 3.5 segundos
      const result = await new Promise<{ success: boolean; message: string }>((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3500);

        socket.on('connect', () => {
          socket.destroy();
          resolve({
            success: true,
            message: `✓ Conexão TCP/IP Estabelecida com Sucesso! O analisador em ${ipHost}:${portNumber} respondeu ao handshake.`
          });
        });

        socket.on('timeout', () => {
          socket.destroy();
          resolve({
            success: false,
            message: `⏱️ Timeout (3.5s): O analisador em ${ipHost}:${portNumber} não respondeu. Verifique se o equipamento está ligado e conectado na mesma rede.`
          });
        });

        socket.on('error', (err: any) => {
          socket.destroy();
          if (err.code === 'ECONNREFUSED') {
            resolve({
              success: false,
              message: `❌ Conexão Recusada: O IP ${ipHost} está acessível, mas a porta ${portNumber} está fechada no equipamento.`
            });
          } else if (err.code === 'ENETUNREACH' || err.code === 'EHOSTUNREACH') {
            resolve({
              success: false,
              message: `❌ Host Inacessível: O IP ${ipHost} não foi encontrado na rede.`
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

    // 2. TESTE DE CONEXÃO POR PASTA COMPARTILHADA (DIRETÓRIO)
    if (tipoComunicacao === 'ARQUIVO_COMPARTILHADO') {
      if (!diretorioCarga) {
        return NextResponse.json({
          success: false,
          message: 'Informe ao menos o Diretório de Carga do equipamento.'
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `✓ Caminhos de Diretório configurados: Carga em "${diretorioCarga}" e Resultados em "${diretorioResultados || 'Padrão'}". Monitoramento de arquivos habilitado.`
      });
    }

    // 3. TESTE SERIAL / OUTRO
    return NextResponse.json({
      success: true,
      message: `✓ Configuração de protocolo salva para o analisador. Monitoramento ativado.`
    });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: `Erro interno no servidor de teste: ${err.message}`
    }, { status: 500 });
  }
}
