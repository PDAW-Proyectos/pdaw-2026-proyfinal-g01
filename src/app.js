//seccion de usuarios
import express from 'express';
import userRoutes from './routes/userRoutes.js';

const app = express();

app.use(express.json());

app.use('/api', userRoutes);

export default app;
//termina seccion de usuarios