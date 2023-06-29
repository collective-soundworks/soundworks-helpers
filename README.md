# soundworks | helpers

Set of common helpers for [`soundworks`](https://soundworks.dev) applications.

## Manual Installation

Note that the `@soundworks/helpers` package is automatically installed when you create an application using the `@soundworks/create` wizard, so most of the time you should not care to install this package manually. See [https://soundworks.dev/guides/getting-started.html](https://soundworks.dev/guides/getting-started.html) for more informations on the `soundworks` wizard.

```
npm install --save @soundworks/helpers
```

## API

<!-- api -->

### Constants

<dl>
<dt><a href="#browserLauncher">browserLauncher</a></dt>
<dd><p>Launcher for clients running in browser runtime.</p>
</dd>
<dt><a href="#nodeLauncher">nodeLauncher</a></dt>
<dd><p>Launcher for clients running in Node.js runtime.</p>
</dd>
</dl>

<a name="browserLauncher"></a>

### browserLauncher
Launcher for clients running in browser runtime.

**Kind**: global constant  
**Example**  
```js
import launcher from '@soundworks/helpers/launcher.js'
```

* [browserLauncher](#browserLauncher)
    * [.language](#browserLauncher.language) : <code>string</code>
    * [.execute(bootstrap, options)](#browserLauncher.execute)
    * [.register(client, options)](#browserLauncher.register)
    * [.setLanguageData(lang, data)](#browserLauncher.setLanguageData)
    * [.getLanguageData(lang)](#browserLauncher.getLanguageData)

<a name="browserLauncher.language"></a>

#### browserLauncher.language : <code>string</code>
Language to be used in the initialization screens. By default, pick language
from the browser and fallback to english if not supported.

For now, available languages are 'fr' and 'en'.

**Kind**: static property of [<code>browserLauncher</code>](#browserLauncher)  
<a name="browserLauncher.execute"></a>

#### browserLauncher.execute(bootstrap, options)
Allow to launch multiple clients at once in the same brwoser window by
adding `?emulate=numberOfClient` at the end of the url
e.g. `http://127.0.0.1:8000?emulate=10` to run 10 clients in parallel

**Kind**: static method of [<code>browserLauncher</code>](#browserLauncher)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bootstrap | <code>function</code> |  | Bootstrap function to execute. |
| options | <code>object</code> |  | Configuration object. |
| [options.numClients] | <code>object</code> | <code>1</code> | Number of parallel clients. |
| [options.width] | <code>object</code> | <code>&#x27;20%&#x27;</code> | If numClient > 1, width of the container. |
| [options.height] | <code>object</code> | <code>&#x27;599px&#x27;</code> | If numClient > 1, height of the container. |

**Example**  
```js
launcher.execute(main, {
  numClients: parseInt(new URLSearchParams(window.location.search).get('emulate')) || 1,
});
```
<a name="browserLauncher.register"></a>

#### browserLauncher.register(client, options)
Register the client in the launcher.

The launcher will do a bunch of stuff for you:
- Display default initialization screens. If you want to change the provided
initialization screens, you can import all the helpers directly in your
application by doing `npx soundworks --eject-helpers`. You can also
customise some global syles variables (background-color, text color etc.)
in `src/clients/components/css/app.scss`.
You can also change the default language of the intialization screen by
setting, the `launcher.language` property, e.g.:
`launcher.language = 'fr'`
- By default the launcher automatically reloads the client when the socket
closes or when the page is hidden. Such behavior can be quite important in
performance situation where you don't want some phone getting stuck making
noise without having any way left to stop it... Also be aware that a page
in a background tab will have all its timers (setTimeout, etc.) put in very
low priority, messing any scheduled events.

**Kind**: static method of [<code>browserLauncher</code>](#browserLauncher)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| client | <code>function</code> |  | The soundworks client. |
| options | <code>object</code> |  | Configuration object. |
| [options.initScreensContainer] | <code>object</code> | <code>1</code> | The HTML container for  the initialization screens. |
| [options.reloadOnVisibilityChange] | <code>object</code> | <code>true</code> | Define if the client  should reload on visibility change. |
| [options.reloadOnSocketError] | <code>object</code> | <code>true</code> | Define if the client  should reload on socket error and disconnection. |

**Example**  
```js
launcher.register(client, { initScreensContainer: $container });
```
<a name="browserLauncher.setLanguageData"></a>

#### browserLauncher.setLanguageData(lang, data)
Set the text to be used for a given language. Allows to override an existing
language as well as define a new one.

**Kind**: static method of [<code>browserLauncher</code>](#browserLauncher)  

| Param | Type | Description |
| --- | --- | --- |
| lang | <code>string</code> | Key correspondig to the language (e.g. 'fr', 'en', 'es') |
| data | <code>object</code> | Key/value pairs defining the text strings to be used. |

<a name="browserLauncher.getLanguageData"></a>

#### browserLauncher.getLanguageData(lang)
Retrieve the data for a given language.

**Kind**: static method of [<code>browserLauncher</code>](#browserLauncher)  

| Param | Type | Description |
| --- | --- | --- |
| lang | <code>string</code> | Key correspondig to the language (e.g. 'fr', 'en', 'es') |

<a name="nodeLauncher"></a>

### nodeLauncher
Launcher for clients running in Node.js runtime.

**Kind**: global constant  
**Example**  
```js
import launcher from '@soundworks/helpers/launcher.js'
```

* [nodeLauncher](#nodeLauncher)
    * [.execute(bootstrap, options)](#nodeLauncher.execute)
    * [.register(client, options)](#nodeLauncher.register)

<a name="nodeLauncher.execute"></a>

#### nodeLauncher.execute(bootstrap, options)
The "execute" function allows to fork multiple clients in the same terminal window
by defining the `EMULATE` env process variable
e.g. `EMULATE=10 npm run watch-process thing` to run 10 clients side-by-side

**Kind**: static method of [<code>nodeLauncher</code>](#nodeLauncher)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| bootstrap | <code>function</code> |  | Bootstrap function to execute. |
| options | <code>object</code> |  | Configuration object. |
| options.moduleURL | <code>object</code> |  | Module url of the calling filr. |
| [options.numClients] | <code>object</code> | <code>1</code> | Number of parallel clients. |

**Example**  
```js
launcher.execute(bootstrap, {
  numClients: process.env.EMULATE ? parseInt(process.env.EMULATE) : 1,
  moduleURL: import.meta.url,
});
```
<a name="nodeLauncher.register"></a>

#### nodeLauncher.register(client, options)
Register the soundworks client into the launcher

Automatically restarts the process when the socket closes or when an
uncaught error occurs in the program.

**Kind**: static method of [<code>nodeLauncher</code>](#nodeLauncher)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| client | <code>function</code> |  | The soundworks client. |
| options | <code>object</code> |  | Configuration object. |
| [options.restartOnError] | <code>object</code> | <code>true</code> | Define if the client should  restart when on uncaught and socket errors. |

**Example**  
```js
launcher.register(client);
```

<!-- apistop -->

## License

[BSD-3-Clause](./LICENSE)
