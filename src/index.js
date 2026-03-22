import 'dotenv/config';
import { createApp } from './app.js';
import { registerGenerateEndpoint } from './bazaar.js';

const port = process.env.PORT ?? 3000;
const app = createApp();

app.listen(port, () => {
  console.log(`Spectopus listening on port ${port}`);
  registerGenerateEndpoint().catch(err => {
    console.warn('Bazaar registration warning:', err.message);
  });
});
