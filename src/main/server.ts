import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { pool } from '../config/config';
import customerRoutes from '../routes/customerRoutes';
import productRoutes from '../routes/productRoutes';
import adminAuthRoutes from '../routes/adminAuthRoutes';
import adminRoutes from '../routes/adminRoutes';
import authRoutes from '../routes/authRoutes';
import cartRoutes from '../routes/cartRoutes';
import orderRoutes from '../routes/orderRoutes';
import paymentRoutes from '../routes/paymentRoutes';
import webhookRoutes from '../routes/webhookRoutes';

const app = express();
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use('/api', customerRoutes);
app.use('/api', productRoutes);
app.use('/api', adminAuthRoutes);
app.use('/api', adminRoutes);
app.use('/api', authRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', paymentRoutes);
app.use('/api', webhookRoutes);

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
