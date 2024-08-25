// routes/usersRouter.js
import express from 'express';
import { getappointments } from '../controllers/appointmentsController.js';

const router = express.Router();

router.get('/appointments', getappointments);

export default router;
