import 'dotenv/config';
import { buildApp } from './app.js';

const server = buildApp();

const start = async () => {
  try {
    const port = Number(process.env.PORT ?? 3000);
    await server.listen({ port, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
