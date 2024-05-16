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
const RESTART_EXIT_CODE = 10;
const DO_NOT_RESTART_EXIT_CODE = 11;

const childProcesses = new Set();

function forkRestartableProcess(modulePath) {
  const child = fork(modulePath, ['--child'], {});
  childProcesses.add(child);

  child.on('exit', (code) => {
    childProcesses.delete(child);

    if (code === RESTART_EXIT_CODE) {
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
      throw new Error('[launcher] `numClients` option should be an integer');
    }

    if (moduleURL === null) {
      throw new Error('[launcher] `moduleURL` option is mandatory');
    }

    if (process.argv[2] === '--child') {
      // restartable childProcesses branch executed as "main" branch child process
      bootstrap();
    } else {
      // "main" branch
      for (let i = 0; i < numClients; i++) {
        forkRestartableProcess(fileURLToPath(moduleURL));
      }

      // --watch flag sends a SIGTERM event
      // cf. https://github.com/nodejs/node/issues/47990#issuecomment-1546839090
      process.once('SIGTERM', () => {
        childProcesses.forEach(child => child.kill('SIGKILL'));
        childProcesses.clear();
        // force the "main" process to exit even if some async stuff is running
        // e.g. if not present an AudioContext created globaly, i.e. outside `bootstrap`,
        // can block the exit of the main process
        process.exit(0);
      });

      // ctrl+c sends a SIGINT event
      process.once('SIGINT', () => {
        childProcesses.forEach(child => child.kill('SIGKILL'));
        childProcesses.clear();
        // force the "main" process to exit even if some async stuff is running
        // e.g. if not present an AudioContext created globaly, i.e. outside `bootstrap`,
        // can block the exit of the main process
        process.exit(0);
      });
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
   * @param {boolean} [options.restartOnError=false] - Define if the client should
   *  restart on uncaught errors.
   * @param {boolean} [options.restartOnSocketClose=true] - Define if the client should
   *  restart on socket disconnection.
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

    async function exitHandler(msg, err, exitCode) {
      if (msg !== null) {
        console.error(chalk.yellow(`> ${msg}`));
      } else {
        console.error(chalk.red(`> Uncaught Error:`));
        console.error(err);
      }

      console.log(chalk.cyan(`[launcher][client ${client.role}(${client.id})] exiting process...`));

      try {
        // make sure we don't try to stop the client twice
        process.removeAllListeners('uncaughtException');
        process.removeAllListeners('unhandledRejection');
        client.socket.removeAllListeners('close');
        client.socket.removeAllListeners('error');

        await client.stop();
        process.exit(exitCode);
      } catch(err) {
        // just crash the process
        console.error(chalk.red('> error in exitHandler'));
        console.error(err);
        process.exit(1);
      }
    }

    const socketExitCode = restartOnSocketClose ? RESTART_EXIT_CODE : DO_NOT_RESTART_EXIT_CODE;
    client.socket.addListener('close', () => exitHandler('Socket closed', null, socketExitCode));
    client.socket.addListener('error', () => exitHandler('Socket errored', null, socketExitCode));

    const errorExitCode = restartOnError ? RESTART_EXIT_CODE : DO_NOT_RESTART_EXIT_CODE;
    process.addListener('uncaughtException', err => exitHandler(null, err, errorExitCode));
    process.addListener('unhandledRejection', err => exitHandler(null, err, errorExitCode));
  },
};

export default nodeLauncher;
