// routes/usersRouter.js
import express from 'express';
import { getTrainings } from '../controllers/trainingController.js';

const router = express.Router();

router.get('/training', getTrainings);

export default router;
