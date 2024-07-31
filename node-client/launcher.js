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

  return child;
}

const nodeScriptsStackTraceRe = /at(.*)data:text\/javascript;base64/m;
function isScriptingError(err) {
  return nodeScriptsStackTraceRe.test(err.stack);
}

// note that the launcher top level doc is removed from generated types:
// https://github.com/microsoft/TypeScript/issues/46010
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
   * @param {function} bootstrap - Bootstrap function to execute.
   * @param {object} options - Configuration object.
   * @param {string} options.moduleURL - Module url of the calling file, used as
   *  current worink directory of the subprocesses.
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
    // In this function `process` refers to the parent orchestrator process
    // or to restartable childProcesses if process.argv[2] === '--child'

    if (!Number.isInteger(numClients) || numClients < 1) {
      throw new Error('[launcher] `numClients` option should be a positive integer');
    }

    if (typeof moduleURL !== 'string') {
      throw new Error('[launcher] `moduleURL` option is mandatory');
    }

    if (process.argv[2] === '--child') {
      // restartable child processes branch
      bootstrap();
    } else {
      // parent process branch
      for (let i = 0; i < numClients; i++) {
        const child = forkRestartableProcess(fileURLToPath(moduleURL));

        // if `register#exitParentProcess` option is set to true, wait for a message
        // from the child process to exit the main process
        child.on('message', msg => {
          if (msg === 'launcher:exit-parent-process') {
            console.log(chalk.cyan('[launcher] exit parent process'));
            childProcesses.forEach(child => child.kill('SIGKILL'));
            childProcesses.clear();
            // force the "main" process to exit even if some async stuff is running
            process.exit(1);
          }
        });

      }

      process.on('exit', () => {
        console.log(chalk.cyan('[launcher] main process exit'));
      });

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
   * @param {boolean} [options.exitOnAll=false] - If true, exit the parent "launcher"
   *  process on both error and socket close, may be usefull in production settings
   *  if the application is e.g. managed by a daemon at the system level.
   * @example
   * launcher.register(client);
   */
  async register(client, {
    restartOnError = false,
    restartOnSocketClose = true,
    exitParentProcess = false,
  } = {}) {
    // In this function `process` refers to the restartable child processes
    // as they are the only ones that execute the `bootstrap` given in `execute`
    const { useHttps, serverAddress, port } = client.config.env;
    const url = `${useHttps ? 'https' : 'http'}://${serverAddress || '127.0.0.1'}:${port}`;

    console.log(chalk.cyan(`[launcher][client ${client.role}] connecting to ${url}`));

    client.onStatusChange(status => {
      if (status === 'inited') {
        console.log(chalk.cyan(`[launcher][client ${client.role}(${client.id})] connected`));
      }
    });

    async function exitHandler(msg, err, exitCode) {
      // Note 2024/07
      // We try to guess if the error comes for inside a script generated by the
      // plugin scripting. In such case, we do not terminate the process has the
      // user wants to be notified to update the script.
      // @todo - See if this can be cleaned somehow.
      if (err && isScriptingError(err)) {
        return;
      }

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

        if (exitParentProcess === true) {
          process.send('launcher:exit-parent-process');
        } else {
          debugger;
          await client.stop();
          process.exit(exitCode);
        }
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
