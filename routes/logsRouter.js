// routes/logsRouter.js
import express from 'express';
import { getLogs } from '../controllers/logsController.js';

const router = express.Router();

router.get('/logs', getLogs);

export default router;
