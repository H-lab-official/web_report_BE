// routes/countRouter.js
import express from 'express';
import { countRanks, countContent } from '../controllers/countController.js';

const router = express.Router();

router.get('/countrank', countRanks);
router.get('/countcontent', countContent);

export default router;
