import '@soundworks/helpers/polyfills.js';
import { Client } from '@soundworks/core/client.js';
import launcher from '../../../../../node-client/launcher.js';

import { loadConfig } from '../../utils/load-config.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

async function bootstrap() {
  const config = loadConfig(process.env.ENV, import.meta.url);
  const client = new Client(config);

  launcher.register(client);

  await client.start();

  console.log(`[client ${client.role}(${client.id})] started`);

  // Default behavior
  //
  // Test Case 1: Error thrown
  // - should stop client and wait for new file changes
  //
  // Test Case 2: Socket disconnect, e.g. server restart
  // - should restart client after small timeout

  const testCase = 1;

  switch (testCase) {
    case 1: {
      let counter = 0;

      setInterval(() => {
        console.log(`[client ${client.role}(${client.id})] counter: ${counter++}`);

        // test case 1 error throw - should stop client and wait for new file changes
        if (counter === 5) {
          throw new Error(`[client ${client.role}(${client.id})] Error occured`);
        }
      }, 200);

      break;
    }
    case 2: {
      let counter = 0;

      setInterval(() => {
        console.log(`[client ${client.role}(${client.id})] counter: ${counter++}`);
      }, 1000);

      break;
    }
  }
}

// The launcher allows to fork multiple clients in the same terminal window
// by defining the `EMULATE` env process variable
// e.g. `EMULATE=10 npm run watch-process thing` to run 10 clients side-by-side
launcher.execute(bootstrap, {
  numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
  moduleURL: import.meta.url,
});
