import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { autolacWsRouter } from './routes/autolac-ws-router';
import { ResultPollerWorker } from './workers/result-poller';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors());
app.use(express.text({ type: ['text/xml', 'application/xml', 'application/soap+xml', 'text/plain'] }));
app.use(express.json());

// Rota de Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'MidwayLab SaaS Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// SOAP Listener do Autolac (escuta na raiz / e /api/v1/autolac/ws)
app.use('/api/v1/autolac/ws', autolacWsRouter);
app.use('/ProcessaApoioApoiado', autolacWsRouter);

// Inicia o Poller de Resultados do Softlab em segundo plano (a cada 60s)
ResultPollerWorker.startScheduler(60000);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  🚀 MidwayLab SaaS Engine Rodando na Porta ${PORT}`);
    console.log(`  - Endpoint SOAP Autolac: http://localhost:${PORT}/`);
    console.log(`  - Health Check: http://localhost:${PORT}/health`);
    console.log(`====================================================`);
  });
}

export default app;
