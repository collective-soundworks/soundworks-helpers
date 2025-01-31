import '@soundworks/helpers/polyfills.js';
import { Client, ClientPlugin } from '@soundworks/core/client.js';
import ClientPluginPlatformInit from '@soundworks/plugin-platform-init/client.js';
import ClientPluginPosition from '@soundworks/plugin-position/client.js';

import { launcher } from '../../../../../browser-client/browser.js';

import { html, render } from 'lit';

// - General documentation: https://soundworks.dev/
// - API documentation:     https://soundworks.dev/api
// - Issue Tracker:         https://github.com/collective-soundworks/soundworks/issues
// - Wizard & Tools:        `npx soundworks`

/**
 * Grab the configuration object written by the server in the `index.html`
 */
const config = window.SOUNDWORKS_CONFIG;

/**
 * If multiple clients are emulated you might to want to share some resources
 */
const audioContext = new AudioContext();

const searchParams = new URLSearchParams(window.location.search);

const lang = searchParams.get('lang') || 'en'
const testCase = searchParams.get('case') || 'platform-inited';

console.log('> configure the view you want to test with:');
console.log('> http://127.0.0.1:8000?lang=fr&case=platform-inited');

async function main($container) {
  const client = new Client(config);

  const kBasePluginStatus = Symbol.for('soundworks:base-plugin-status')
  launcher.language = lang;

  // -------------------------------------------------------------------
  // register plugins
  // -------------------------------------------------------------------
  if (testCase.startsWith('platform')) {
    client.pluginManager.register('platform-init', ClientPluginPlatformInit, { audioContext });
  }

  if (testCase === 'position-default') {
    client.pluginManager.register('position-default', ClientPluginPosition);
  } else if (testCase === 'position-xrange') {
    client.pluginManager.register('position-xrange', ClientPluginPosition);
  } else if (testCase === 'position-yrange') {
    client.pluginManager.register('position-yrange', ClientPluginPosition);
  } else if (testCase === 'position-background') {
    client.pluginManager.register('position-background', ClientPluginPosition);
  }

  if (testCase === 'default-inited') {
    client.pluginManager.register('default-inited', class PluginDefault extends ClientPlugin {});
  } else if (testCase === 'default-errored') {
    client.pluginManager.register('default-errored', class PluginDefault extends ClientPlugin {});
  } else if (testCase === 'default-sync') {
    client.pluginManager.register('default-sync', class PluginSync extends ClientPlugin {});
  } else if (testCase === 'default-audio-buffer-loader') {
    client.pluginManager.register('default-audio-buffer-loader', class PluginAudioBufferLoader extends ClientPlugin {});
  } else if (testCase === 'default-checkin-errored') {
    client.pluginManager.register('default-checkin-errored', class PluginCheckin extends ClientPlugin {});
  }


  // small test to just make sure the screen stays on the error page
  if (testCase === 'failing-plugin') {
    client.pluginManager.register('failing-plugin', class FailingPlugin extends ClientPlugin {
      async start() {
        await super.start();
        throw new Error('failing-plugin has failed');
      }
    });
  }

  client.pluginManager.onStateChange(plugins => {
    switch (testCase) {
      case 'platform-inited': { // landing page do nothing
        break;
      }
      case 'platform-errored-1': { // first plugin error screen, before click
        if (plugins['platform-init'].state.check !== null) {
          plugins['platform-init'].state.check.result = false;
          plugins['platform-init'][kBasePluginStatus] = 'errored';
        }
        break;
      }
      case 'platform-errored-2': { // second plugin error screen, after click
        if (plugins['platform-init'].state.activate !== null) {
          plugins['platform-init'].state.activate.result = false;
          plugins['platform-init'][kBasePluginStatus] = 'errored';
        }
        break;
      }

      // default view
      case 'default-inited': {
        // prevent the plugin to go to started
        plugins['default-inited'][kBasePluginStatus] = 'inited';
        break;
      }
      case 'default-errored': {
        // force plugin to errored status
        plugins['default-errored'][kBasePluginStatus] = 'errored';
        break;
      }
      case 'default-sync': {
        plugins['default-sync'][kBasePluginStatus] = 'inited';
        break;
      }
      case 'default-audio-buffer-loader': {
        plugins['default-audio-buffer-loader'][kBasePluginStatus] = 'inited';
        break;
      }
      case 'default-checkin-errored': {
        plugins['default-checkin-errored'][kBasePluginStatus] = 'errored';
        break;
      }

      case 'failing-plugin': {
        console.log(plugins['failing-plugin']);
      }
    }
  });


  launcher.register(client, { initScreensContainer: $container });

  await client.init();

  // @note we do not `start()` as the errors are faked and that `client.init()`
  // would resolve normally, 'failing-plugin' shows that it will behave correctly
  // in a real failure situation as nothing will be rendered after `launcher.render`
  // await client.start();

  // small test to just make sure the screen stays on the error page
  if (testCase === 'failing-plugin') {
    console.log('should never pass here');
    await client.start();
    render(html`<h1>Damn...</h1>`)
  }
}

// The launcher enables instanciation of multiple clients in the same page to
// facilitate development and testing.
// e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients side-by-side
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
});
