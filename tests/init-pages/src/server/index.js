import '@soundworks/helpers/polyfills.js';
import { Server } from '@soundworks/core/server.js';
import platformInitPlugin from '@soundworks/plugin-platform-init/server.js';
import pluginPosition from '@soundworks/plugin-position/server.js';

import { loadConfig } from '../utils/load-config.js';
import '../utils/catch-unhandled-errors.js';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

const config = loadConfig(process.env.ENV, import.meta.url);

console.log(`
--------------------------------------------------------
- launching "${config.app.name}" in "${process.env.ENV || 'default'}" environment
- [pid: ${process.pid}]
--------------------------------------------------------
`);

/**
 * Create the soundworks server
 */
const server = new Server(config);
// configure the server for usage within this application template
server.useDefaultApplicationTemplate();

/**
 * Register plugins and schemas
 */
server.pluginManager.register('platform-init', platformInitPlugin);

server.pluginManager.register('default-inited', (Plugin) => {
  return class DefaultPlugin extends Plugin {};
});

server.pluginManager.register('default-errored', (Plugin) => {
  return class DefaultPlugin extends Plugin {};
});

server.pluginManager.register('default-sync', (Plugin) => {
  return class PluginSync extends Plugin {};
});
server.pluginManager.register('default-audio-buffer-loader', (Plugin) => {
  return class PluginAudioBufferLoader extends Plugin {};
});
server.pluginManager.register('default-checkin-errored', (Plugin) => {
  return class PluginCheckin extends Plugin {};
});

// small test to just make sure the screen stays on the error page
server.pluginManager.register('failing-plugin', (Plugin) => {
  return class FailingPlugin extends Plugin {};
});

server.pluginManager.register('position-default', pluginPosition);

server.pluginManager.register('position-xrange', pluginPosition, {
  xRange: [0.25, 0.75],
  yRange: [0, 1],
});

server.pluginManager.register('position-yrange', pluginPosition, {
  xRange: [0, 1],
  yRange: [0.25, 0.75],
});

server.pluginManager.register('position-background', pluginPosition, {
  backgroundImage: 'images/seating-map.png',
});

/**
 * Launch application (init plugins, http server, etc.)
 */
await server.start();

// and do your own stuff!

