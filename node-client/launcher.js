import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import chalk from 'chalk';


// by default, we want the process to restart automatically when the socket close
// - in dev, this is handy when the  server restarts
// - in prod, this is handy too because the client will re-appear fast
// but not when an error occurs
// - in dev, this just creates noise in the console, and it will restart on next save anyway
// - in prod, the service should handle the restart

// EXIT CODES
// + 10 - restart, e.g. connection lost, we can restart
// + 11 - do not restart, e.g. uncaught error

const RESTART_TIMEOUT = 500; // ms

function forkRestartableProcess(modulePath) {
  const child = fork(modulePath, ['child'], {});

  child.on('exit', (code) => {
    if (code === 10) {
      console.log(chalk.cyan(`[launcher] restarting process in ${RESTART_TIMEOUT}ms`));
      setTimeout(() => forkRestartableProcess(modulePath), RESTART_TIMEOUT);
    }
  });
}

/**
 * Launcher for clients running in Node.js runtime.
 *
 * @example
 * import launcher from '@soundworks/helpers/launcher.js'
 */
const nodeLauncher = {
  /**
   * The "execute" function allows to fork multiple clients in the same terminal window
   * by defining the `EMULATE` env process variable
   * e.g. `EMULATE=10 npm run watch-process thing` to run 10 clients side-by-side
   *
   * @param {Function} bootstrap - Bootstrap function to execute.
   * @param {object} options - Configuration object.
   * @param {string} options.moduleURL - Module url of the calling filr.
   * @param {number} [options.numClients=1] - Number of parallel clients.
   * @example
   * launcher.execute(bootstrap, {
   *   numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
   *   moduleURL: import.meta.url,
   * });
   */
  async execute(bootstrap, {
    numClients = 1,
    moduleURL = null,
  } = {}) {
    if (!Number.isInteger(numClients)) {
      throw new Error('[launcher] `numClients` options is mandatory and should be an integer');
    }

    if (moduleURL === null) {
      throw new Error('[launcher] `moduleURL` option is mandatory');
    }

    if (process.argv[2] === 'child') {
      bootstrap();
    } else {
      for (let i = 0; i < numClients; i++) {
        forkRestartableProcess(fileURLToPath(moduleURL));
      }
    }
  },

  /**
   * Register the soundworks client into the launcher
   *
   * Automatically restarts the process when the socket closes or when an
   * uncaught error occurs in the program.
   *
   * @param {Function} client - The soundworks client.
   * @param {object} options - Configuration object.
   * @param {boolean} [options.restartOnError=true] - Define if the client should
   *  restart when on uncaught and socket errors.
   * @example
   * launcher.register(client);
   */
  async register(client, {
    restartOnError = false,
    restartOnSocketClose = true,
  } = {}) {
    const { useHttps, serverAddress, port } = client.config.env;
    const url = `${useHttps ? 'https' : 'http'}://${serverAddress}:${port}`;

    console.log(chalk.cyan(`[launcher][client ${client.role}] connecting to ${url}`));

    client.onStatusChange(status => {
      if (status === 'inited') {
        console.log(chalk.cyan(`[launcher][client ${client.role}(${client.id})] connected`));
      }
    });

    async function exitHandler(err, exitCode) {
      console.log(chalk.cyan(`[launcher][client ${client.role}(${client.id})] closing due to error...`));

      if (err && err.message) {
        console.error(chalk.red(`> ${err.type} ${err.message}`));
      } else {
        console.error(chalk.red(`> ${err}`));
      }

      try {
        // make sure we can't receive another error while stopping the client
        process.removeAllListeners('uncaughtException');
        process.removeAllListeners('unhandledRejection');

        await client.stop();

        console.log(chalk.cyan(`[launcher][client ${client.role}(${client.id})] exiting process...`));
        process.exit(exitCode);
      } catch(err) {
        // just crash the process
        console.error(chalk.red('> error in exitHandler'));
        console.error(err);
        process.exit(1);
      }
    }

    const socketExitCode = restartOnSocketClose ? 10 : 11;
    client.socket.addListener('close', () => exitHandler('socket closed', socketExitCode));
    client.socket.addListener('error', () => exitHandler('socket errored', socketExitCode));

    const errorExitCode = restartOnError ? 10 : 11;
    process.addListener('uncaughtException', err => exitHandler(err, errorExitCode));
    process.addListener('unhandledRejection', err => exitHandler(err, errorExitCode));
  },
};

export default nodeLauncher;
