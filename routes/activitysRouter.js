// routes/usersRouter.js
import express from 'express';
import {getactivitys } from '../controllers/activitysController.js';

const router = express.Router();

router.get('/activitys',getactivitys);

export default router;
