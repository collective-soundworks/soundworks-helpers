# `soundworks-template-helpers`

> Set of common helpers for applications based on the [`soundworks-template`](https://github.com/collective-soundworks/soundworks-template)

## `renderInitializationScreens`

Display generic initialization screens for plugins

### Usage

```
import { Experience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

class ControllerExperience extends Experience {
  constructor(client, config, $container) {
    super(client);

    this.config = config;
    this.$container = $container;

    renderInitializationScreens(client, config, $container);
  }

  // ...
}
```

## `initQoS`

Initialize generic quality of service strategies.

For now, reload application when socket close or on visibility change.
__These strategies will be refined / completed over time.__

### Usage

```
import { Client } from '@soundworks/core/client';
import initQoS from '@soundworks/helpers/client/init-qos.js';

async function launch() {
  try {
    const client = new Client();
    await client.init(window.soundworksConfig);
    initQoS(client);

    // ...
  } catch(err) {
    console.error(err);
  }
}

launch();
```

## License

BSD-3-Clause
