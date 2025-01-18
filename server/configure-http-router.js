import path from 'node:path';

import compression from 'compression';
import express from 'express';
import chalk from 'chalk';
import columnify from 'columnify';

import { clientIndex } from './routing/client-index.js';
import { httpAuthentication } from './routing/http-authentication.js';

/**
 * According to the clients definitions provided in `config.app.clients`, the
 * server will automatically create a dedicated route for each role declaring a
 * browser runtime.
 * For example, given the config object of the example above that defines two
 * different client roles for browser (i.e. `player` and `controller`):
 *
 * ```
 * config.app.clients = {
 *   player: { runtime: 'browser', default: true },
 *   controller: { runtime: 'browser' },
 * }
 * ```
 *
 * The server will listen to the following URLs:
 * - `http://127.0.0.1:8000/` for the `player` role, which is defined as the default client.
 * - `http://127.0.0.1:8000/controller` for the `controller` role.
 * @param {Server} server - The soundworks server instance
 */
export default async function configureHttpRouter(server) {
  const verbose = server.config.env.verbose;
  const serverConfig = server.config;

  // use express() instead of express.Router() to benefit from default handling of 404, etc.
  const router = express();
  // compression must be set before `express.static()`
  router.use(compression());
  // register simple HTTP auth middleware
  // if (serverConfig.env.auth?.clients && serverConfig.env.auth.clients.length) {
  //   router.use(httpAuthentication(server));
  // }

  // create route for each browser client
  for (let [clientRole, clientDescription] of Object.entries(serverConfig.app.clients)) {
    if (clientDescription.runtime === 'node') {
      continue;
    }

    const requestCallbacks = [];

    if (server.isProtectedClientRole(clientRole)) {
      const authenticationMiddleware = httpAuthentication(server);
      requestCallbacks.push(authenticationMiddleware);
    };

    const indexRoute = clientIndex(clientRole, serverConfig);
    requestCallbacks.push(indexRoute);
    console.log(clientRole, requestCallbacks)

    if (clientDescription.default === true) {
      console.log(clientRole, 'there');
      router.get(`/`, ...requestCallbacks);
    }
    // keep the "explicit" route active even if default
    router.get(`/${clientRole}`, ...requestCallbacks);
  }

  // expose public static directories
  router.use(express.static('public'));
  router.use('/build', express.static(path.join('.build', 'public')));

  server.router = router;

  // register router on HTTP server when ready
  server.onStatusChange(status => {
    if (status === 'http-server-ready') {
      server.httpServer.on('request', router);

      if (verbose) {
        logRoutes(serverConfig);
      }
    }
  });
}


function logRoutes(serverConfig) {
  const table = [];

  for (let [clientRole, clientConfig] of Object.entries(serverConfig.app.clients)) {
    if (clientConfig.runtime === 'node') {
      const line = {
        role: `> ${clientRole}`,
        runtime: chalk.red(clientConfig.runtime),
        path: `serverAddress: ${chalk.green(serverConfig.env.serverAddress || '127.0.0.1')}`,
        default: undefined,
        // auth: undefined,
      };

      table.push(line);
    } else if (clientConfig.runtime === 'browser') {
      const line = {
        role: `> ${clientRole}`,
        runtime: chalk.red(clientConfig.runtime),
        path: clientConfig.default ? `/` : `/${clientRole}`,
        default: (clientConfig.default ? 'x' : undefined),
        auth: serverConfig.app.auth?.clients?.indexOf(clientRole) >= 0 ? 'x' : undefined,
      };

      table.push(line);
    }
  }

  console.log(chalk.cyan(`+ configured clients and routing`));
  console.log(``);
  console.log(columnify(table, {
    showHeaders: true,
    minWidth: 6,
    columnSplitter: ' | ',
    config: {
      default: { align: 'center' },
      auth: { align: 'center' },
    },
  }));
  console.log(``);
}
