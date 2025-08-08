import { Router } from 'express';

import controller from './debug.controller';

const debugRouter = Router();

debugRouter.get('/errors', controller.simulateError);
debugRouter.get('/env', controller.getEnv);

export default debugRouter;
