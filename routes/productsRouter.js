// routes/usersRouter.js
import express from 'express';
import { getProducts } from '../controllers/productsController';

const router = express.Router();

router.get('/products',getProducts);

export default router;
