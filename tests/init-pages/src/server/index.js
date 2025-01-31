import '@soundworks/helpers/polyfills.js';
import { Server, ServerPlugin } from '@soundworks/core/server.js';
import ServerPluginPlatformInit from '@soundworks/plugin-platform-init/server.js';
import ServerPluginPosition from '@soundworks/plugin-position/server.js';

import { loadConfig, configureHttpRouter } from '@soundworks/helpers/server.js';

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

const server = new Server(config);
configureHttpRouter(server);

server.pluginManager.register('platform-init', ServerPluginPlatformInit);

server.pluginManager.register('default-inited', class DefaultPlugin extends ServerPlugin {});

server.pluginManager.register('default-errored', class DefaultPlugin extends ServerPlugin {});

server.pluginManager.register('default-sync', class PluginSync extends ServerPlugin {});
server.pluginManager.register('default-audio-buffer-loader', class PluginAudioBufferLoader extends ServerPlugin {});
server.pluginManager.register('default-checkin-errored', class PluginCheckin extends ServerPlugin {});

// small test to just make sure the screen stays on the error page
server.pluginManager.register('failing-plugin', class FailingPlugin extends ServerPlugin {});

server.pluginManager.register('position-default', ServerPluginPosition);

server.pluginManager.register('position-xrange', ServerPluginPosition, {
  xRange: [0.25, 0.75],
  yRange: [0, 1],
});

server.pluginManager.register('position-yrange', ServerPluginPosition, {
  xRange: [0, 1],
  yRange: [0.25, 0.75],
});

server.pluginManager.register('position-background', ServerPluginPosition, {
  backgroundImage: 'images/seating-map.png',
});
await server.start();


