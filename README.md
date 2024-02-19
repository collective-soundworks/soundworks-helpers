# soundworks | helpers

Set of common helpers for [`soundworks`](https://soundworks.dev) applications.

## Manual Installation

Note that the `@soundworks/helpers` package is automatically installed when you create an application using the `@soundworks/create` wizard, so most of the time you should not care to install this package manually. See [https://soundworks.dev/guides/getting-started.html](https://soundworks.dev/guides/getting-started.html) for more informations on the `soundworks` wizard.

```
npm install --save @soundworks/helpers
```

## API

<!-- api -->
<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

*   [browserLauncher][1]
    *   [Examples][2]
    *   [execute][3]
    *   [register][4]
    *   [language][5]
    *   [language][6]
    *   [setLanguageData][7]
    *   [getLanguageData][8]
*   [nodeLauncher][9]
    *   [Examples][10]
    *   [execute][11]
    *   [register][12]

## browserLauncher

Launcher for clients running in browser runtime.

### Examples

```javascript
import launcher from '@soundworks/helpers/launcher.js'
```

### execute

Allow to launch multiple clients at once in the same brwoser window by
adding `?emulate=numberOfClient` at the end of the url
e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients in parallel

#### Parameters

*   `bootstrap` **[Function][13]** Bootstrap function to execute.
*   `options` **[object][14]** Configuration object. (optional, default `{}`)

    *   `options.numClients` **[number][15]** Number of parallel clients. (optional, default `1`)
    *   `options.width` **[string][16]** If numClient > 1, width of the container. (optional, default `'20%'`)
    *   `options.height` **[string][16]** If numClient > 1, height of the container. (optional, default `'500px'`)

#### Examples

```javascript
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
});
```

### register

Register the client in the launcher.

The launcher will do a bunch of stuff for you:

*   Display default initialization screens. If you want to change the provided
    initialization screens, you can import all the helpers directly in your
    application by doing `npx soundworks --eject-helpers`. You can also
    customise some global syles variables (background-color, text color etc.)
    in `src/clients/components/css/app.scss`.
    You can also change the default language of the intialization screen by
    setting, the `launcher.language` property, e.g.:
    `launcher.language = 'fr'`
*   By default the launcher automatically reloads the client when the socket
    closes or when the page is hidden. Such behavior can be quite important in
    performance situation where you don't want some phone getting stuck making
    noise without having any way left to stop it... Also be aware that a page
    in a background tab will have all its timers (setTimeout, etc.) put in very
    low priority, messing any scheduled events.

#### Parameters

*   `client` **[Function][13]** The soundworks client.
*   `options` **[object][14]** Configuration object. (optional, default `{}`)

    *   `options.initScreensContainer` **[HTMLElement][17]** The HTML container for
        the initialization screens. (optional, default `null`)
    *   `options.reloadOnVisibilityChange` **[boolean][18]** Define if the client
        should reload on visibility change. (optional, default `true`)
    *   `options.reloadOnSocketError` **[boolean][18]** Define if the client
        should reload on socket error and disconnection. (optional, default `true`)

#### Examples

```javascript
launcher.register(client, { initScreensContainer: $container });
```

### language

Return the locale strings

Type: [object][14]

### language

Set the language to be used in the initialization screens. By default, picks
language from the browser and fallback to english if not supported.
For now, available languages are 'fr' and 'en'.

Type: [string][16]

#### Parameters

*   `lang` &#x20;

### setLanguageData

Set the text to be used for a given language. Allows to override an existing
language as well as define a new one.

#### Parameters

*   `lang` **[string][16]** Key correspondig to the language (e.g. 'fr', 'en', 'es')
*   `data` **[object][14]** Key/value pairs defining the text strings to be used.

### getLanguageData

Retrieve the data for a given language.

#### Parameters

*   `lang` **[string][16]** Key correspondig to the language (e.g. 'fr', 'en', 'es') (optional, default `null`)

## nodeLauncher

Launcher for clients running in Node.js runtime.

### Examples

```javascript
import launcher from '@soundworks/helpers/launcher.js'
```

### execute

The "execute" function allows to fork multiple clients in the same terminal window
by defining the `EMULATE` env process variable
e.g. `EMULATE=10 npm run watch-process thing` to run 10 clients side-by-side

#### Parameters

*   `bootstrap` **[Function][13]** Bootstrap function to execute.
*   `options` **[object][14]** Configuration object. (optional, default `{}`)

    *   `options.numClients` **[number][15]** Number of parallel clients. (optional, default `1`)
    *   `options.moduleURL` **[string][16]** Module url of the calling filr. (optional, default `null`)

#### Examples

```javascript
launcher.execute(bootstrap, {
  numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
  moduleURL: import.meta.url,
});
```

### register

Register the soundworks client into the launcher

Automatically restarts the process when the socket closes or when an
uncaught error occurs in the program.

#### Parameters

*   `client` **[Function][13]** The soundworks client.
*   `options` **[object][14]** Configuration object. (optional, default `{}`)

    *   `options.restartOnError` **[boolean][18]** Define if the client should
        restart on uncaught errors. (optional, default `false`)
    *   `options.restartOnSocketClose` **[boolean][18]** Define if the client should
        restart on socket disconnection. (optional, default `true`)

#### Examples

```javascript
launcher.register(client);
```

[1]: #browserlauncher

[2]: #examples

[3]: #execute

[4]: #register

[5]: #language

[6]: #language-1

[7]: #setlanguagedata

[8]: #getlanguagedata

[9]: #nodelauncher

[10]: #examples-3

[11]: #execute-1

[12]: #register-1

[13]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function

[14]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[15]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number

[16]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[17]: https://developer.mozilla.org/docs/Web/HTML/Element

[18]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean

<!-- apistop -->

## Credits

[https://soundworks.dev/credits.html](https://soundworks.dev/credits.html)

## License

[BSD-3-Clause](./LICENSE)
