import express from 'express';
import { pool } from '../config/config';
import { userRoutes } from '../routes/userRoutes';

const app = express();
app.use(express.json());

app.use('/api/users', userRoutes);

app.get('/health', async (_, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now');
    res.json({ status: 'ok', db: 'connected', now: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

const port = Number(process.env.PORT) || 3000;

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Conectado ao postgresql');
  } catch (err) {
    console.error('Erro ao conectar no postgresql', err);
    process.exit(1); 
  }

  app.listen(port, () => console.log(`server running on ${port}`));
}

start();