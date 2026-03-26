import 'dotenv/config';
import { createApp } from './app.js';
import { getSynapse } from './synapse.js';

const port = process.env.PORT ?? 3000;
const app = createApp();

app.listen(port, () => {
  console.log(`Spectopus listening on port ${port}`);
});

// Warm up storage in production
if (process.env.NODE_ENV === 'production') {
  await getSynapse().catch(console.error);
}