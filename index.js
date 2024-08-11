// index.js
import express from 'express';
import cors from 'cors';
import logsRouter from './routes/logsRouter.js';
import usersRouter from './routes/usersRouter.js';
import countRouter from './routes/countRouter.js';
import contentPopupRouter from './routes/contentPopupsRouter.js'
import myGoalRouter from './routes/myGoalRouter.js'
import { updateCache } from './controllers/logsController.js';
import { updateUserCache } from './controllers/usersController.js';
import { updateLogContentCache } from './controllers/contentPopupsController.js'
import { updateGoalCache } from './controllers/myGoalController.js'
const app = express();

app.use(cors());
app.use(express.json());

app.use(logsRouter);
app.use(usersRouter);
app.use(countRouter);
app.use(contentPopupRouter)
app.use(myGoalRouter)
updateGoalCache()
setInterval(updateGoalCache, 1 * 24 * 60 * 60 * 1000)

updateLogContentCache()
setInterval(updateLogContentCache, 1 * 24 * 60 * 60 * 1000)

updateCache();
setInterval(updateCache, 600000);

updateUserCache();
setInterval(updateUserCache, 7 * 24 * 60 * 60 * 1000);

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
