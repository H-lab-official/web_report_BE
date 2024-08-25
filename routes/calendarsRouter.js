// routes/usersRouter.js
import express from 'express';
import { getcalendars } from '../controllers/calendarsController.js';

const router = express.Router();

router.get('/calendars', getcalendars);

export default router;
