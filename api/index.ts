import express from 'express';
import apiRouter from '../server/index';

const app = express();
app.use(apiRouter);

export default app;
