// routes/usersRouter.js
import express from 'express';
import { getMyGoal } from '../controllers/myGoalController.js';

const router = express.Router();

router.get('/mygoal', getMyGoal);

export default router;
