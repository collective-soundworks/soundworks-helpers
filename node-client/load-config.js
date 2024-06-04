import fs from 'node:fs';
import path from 'node:path';

import JSON5 from 'json5';
import YAML from 'yaml';

// for legacy apps
const DEFAULT_ENV_CONFIG = {
  type: 'development',
  port: 8000,
  useHttps: false,
  serverAddress: '',
};

function loadJSONConfig(ENV) {
  let env;
  let app;

  const envConfigFilepath = path.join('config', `env-${ENV}.json`);

  try {
    env = JSON5.parse(fs.readFileSync(envConfigFilepath, 'utf-8'));
  } catch(err) {
    console.info('');
    console.info('--------------------------------------------------------');
    console.info(`- Environment config file not found: "${envConfigFilepath}"`);
    console.info(`- Using default config:`);
    console.info(DEFAULT_ENV_CONFIG);
    console.info('- run `npx soundworks --create-env` to create a custom environment file');
    console.info('--------------------------------------------------------');

    env = DEFAULT_ENV_CONFIG;
  }

  const appConfigFilepath = path.join('config', 'application.json');

  try {
    app = JSON5.parse(fs.readFileSync(appConfigFilepath, 'utf-8'));
  } catch(err) {
    console.error(`Invalid app config file: ${appConfigFilepath}`);
    process.exit(1);
  }

  return { env, app };
}

function loadYAMLConfig(ENV) {
  let env;
  let app;

  const envConfigFilepath = path.join('config', `env-${ENV}.yaml`);

  try {
    env = YAML.parse(fs.readFileSync(envConfigFilepath, 'utf-8'));
  } catch(err) {
    console.error(`Invalid env config file: ${envConfigFilepath}`);
    process.exit(1);
  }

  const appConfigFilepath = path.join('config', 'application.yaml');

  try {
    app = YAML.parse(fs.readFileSync(appConfigFilepath, 'utf-8'));
  } catch(err) {
    console.error(`Invalid app config file: ${appConfigFilepath}`);
    process.exit(1);
  }

  return { env, app };
}

/**
 * Load JS config object from json5 config files located in `/config`.
 *
 * @param {String} [ENV='default'] - name of the environment. Should correspond
 *  to a file located in the `/config/env/` directory. If the file is not found
 *  the DEFAULT_CONFIG object will be used
 * @param {String} [callerURL=null] - retrieves the `role` from caller directory
 *  name for node clients.
 *
 * @returns {Object} config
 * @returns {Object} config.app - JS object of the informations contained in
 *  `/config/application.json`.
 * @returns {Object} config.env - JS object of the informations contained in
 *  `/config/env/${ENV}.json` with ENV being the first argument.
 * @returns {Object} config.role - node client only: type/role of the client
 *  as defined when the client has been created (see `/config/application.json`
 *  and directory name).
 */
export default function loadConfig(ENV = 'default', callerURL = null) {
  const projectConfig = JSON.parse(fs.readFileSync('.soundworks'));
  const configFormat = projectConfig.configFormat?.toLowerCase() || 'json';
  let config = null;

  switch (configFormat) {
    case 'json': {
      config = loadJSONConfig(ENV);
      break;
    }
    case 'yaml': {
      config = loadYAMLConfig(ENV);
      break;
    }
  }

    // retrieve role
  if (callerURL !== null) {
    // grab the role from the caller url dirname
    const dirname = path.dirname(callerURL);
    const parent = path.resolve(dirname, '..');
    const role = path.relative(parent, dirname);

    if (role !== 'server') {
      config.role = role;
    }
  }

  // override from given env variables
  if (process.env.PORT) {
    config.env.port = parseInt(process.env.PORT);
  }

  if (process.env.SERVER_ADDRESS) {
    config.env.serverAddress = process.env.SERVER_ADDRESS;
  }

  if (process.env.USE_HTTPS) {
    config.env.useHttps = !!process.env.USE_HTTPS;
  }

  return config;
}
