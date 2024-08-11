// routes/usersRouter.js
import express from 'express';
import { getLogContent } from '../controllers/contentPopupsController.js';

const router = express.Router();

router.get('/contentpopup', getLogContent);

export default router;
