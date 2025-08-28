import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import connectDB from './config/database.js';
import path from "path";
import { fileURLToPath } from "url";



// Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import contactRoutes from './routes/contact.routes.js';
import passwordResetRoutes from './routes/passwordReset.routes.js';

import errorMiddleware from './middlewares/error.middleware.js';

const app = express();

// Helmet (désactiver CORP pour éviter le blocage NotSameOrigin côté images)
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

await connectDB();
// 📂 Rendre le dossier uploads accessible (et autoriser la lecture cross-origin)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', contactRoutes);
app.use('/api/password-reset', passwordResetRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route introuvable' }));
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Serveur (ESM) sur http://localhost:${PORT}`));
//app.listen(PORT, () => console.log("✅ serveur lancé sur https://electro-pro-guinee.onrender.com"));

