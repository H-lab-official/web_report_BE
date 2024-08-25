// index.js
import express from 'express';
import cors from 'cors';
import logsRouter from './routes/logsRouter.js';
import usersRouter from './routes/usersRouter.js';
import countRouter from './routes/countRouter.js';
import contentPopupRouter from './routes/contentPopupsRouter.js'
import myGoalRouter from './routes/myGoalRouter.js'
import trainings from './routes/trainingRouter.js'
import calendars from './routes/calendarsRouter.js'
import products from './routes/productsRouter.js'
import news from './routes/newsRouter.js'
import activitys from './routes/activitysRouter.js'
import appointments from './routes/appointmentsRouter.js'
import { updateCache } from './controllers/logsController.js';
import { updateUserCache } from './controllers/usersController.js';
import { updateLogContentCache } from './controllers/contentPopupsController.js'
import { updateGoalCache } from './controllers/myGoalController.js'
import { updateTrainingsCache } from './controllers/trainingController.js'
import { updateCalendarsCache } from './controllers/calendarsController.js'
import { updateProductsCache } from './controllers/productsController.js'
import { updatenewsCache } from './controllers/newsController.js'
import { updateactivitysCache } from './controllers/activitysController.js'
import { updateappointmentsCache } from './controllers/appointmentsController.js'
const app = express();

app.use(cors());
app.use(express.json());

app.use(logsRouter);
app.use(usersRouter);
app.use(countRouter);
app.use(contentPopupRouter)
app.use(myGoalRouter)
app.use(trainings)
app.use(calendars)
app.use(products)
app.use(news)
app.use(activitys)
app.use(appointments)


updateGoalCache()
setInterval(updateGoalCache, 1 * 24 * 60 * 60 * 1000)

updateLogContentCache()
setInterval(updateLogContentCache, 1 * 24 * 60 * 60 * 1000)

updateCache();
setInterval(updateCache, 600000);

updateUserCache();
setInterval(updateUserCache, 1 * 24 * 60 * 60 * 1000);

updateTrainingsCache()
setInterval(updateTrainingsCache, 1 * 24 * 60 * 60 * 1000)

updateCalendarsCache()
setInterval(updateCalendarsCache, 1 * 24 * 60 * 60 * 1000)

updateProductsCache()
setInterval(updateProductsCache, 1 * 24 * 60 * 60 * 100)

updatenewsCache()
setInterval(updatenewsCache, 1 * 24 * 60 * 60 * 1000)

updateactivitysCache()
setInterval(updateactivitysCache, 1 * 24 * 60 * 60 * 1000)

updateappointmentsCache()
setInterval(updateappointmentsCache, 1 * 24 * 60 * 60 * 1000)
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
