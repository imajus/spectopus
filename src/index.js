import 'dotenv/config';
import { createApp } from './app.js';
import { initStorage } from './storage.js';

const port = process.env.PORT ?? 3000;
const app = createApp();

await initStorage();
app.listen(port, () => {
  console.log(`Spectopus listening on port ${port}`);
});
