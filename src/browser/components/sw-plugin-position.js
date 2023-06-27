import { LitElement, html, css, nothing } from 'lit';

import '@ircam/sc-components/sc-dot-map.js';
import '@ircam/sc-components/sc-button.js';

class SwSPluginPosition extends LitElement {
  static get properties() {
    return {
      plugin: { hasChanged: () => true, attribute: false },
      client: { hasChanged: () => true, attribute: false },
      localizedTexts: { type: Object, attribute: 'localized-texts' },
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
        position: relative;
      }

      .command-container {
        box-sizing: border-box;
        position: absolute;
        padding: 20px;
      }

      .placeholder {
        position: relative;
        top: 50%;
        margin-top: -20px;
      }

      .info {
        font-family: Consolas, monaco, monospace;
        color: white;
        font-size: 1.2rem;
        width: 100%;
        text-align: center;
        height: 36px;
        line-height: 36px;
        margin: 0;
      }
    `;
  }

  constructor() {
    super();

    this.x = null;
    this.y = null;
  }

  render() {
    const width = parseInt(this.parentNode.host.getAttribute('width'));
    const height = parseInt(this.parentNode.host.getAttribute('height'));

    if (Number.isNaN(width) || Number.isNaN(height) || this.plugin.state.infos === null) {
      return nothing;
    }

    const { xRange, yRange, backgroundImage } = this.plugin.state.infos;
    const orientation = width > height ? 'landscape' : 'portrait';

    // could probably be refined but does the job for now...
    let mapContainerWidth;
    let mapContainerHeight;
    let commandContainerWidth;
    let commandContainerHeight;
    let commandContainerTop;
    let commandContainerLeft;

    if (orientation === 'landscape') {
      commandContainerWidth = 300;
      commandContainerHeight = height;
      mapContainerWidth = width - commandContainerWidth;
      mapContainerHeight = height;
      commandContainerTop = 0;
      commandContainerLeft = mapContainerWidth;
    } else {
      commandContainerWidth = width;
      commandContainerHeight = 200;
      mapContainerWidth = width;
      mapContainerHeight = height - commandContainerHeight;
      commandContainerTop = mapContainerHeight;
      commandContainerLeft = 0;
    }

    return html`
      <sc-dot-map
        width="${mapContainerWidth}"
        height="${mapContainerHeight}"
        x-range="${JSON.stringify(xRange)}"
        y-range="${JSON.stringify(yRange)}"
        background-image="${backgroundImage}"
        radius="12"
        capture-events
        persist-events
        max-size="1"
        @input="${this.onUpdatePosition}"
      >
      </sc-dot-map>
      <section
        class="command-container"
        style="
          width: ${commandContainerWidth}px;
          height: ${commandContainerHeight}px;
          top: ${commandContainerTop}px;
          left: ${commandContainerLeft}px;
        "
      >
        <div class="placeholder">
          ${(this.x !== null && this.y !== null)
            ? html`
              <sc-button
                @input="${this.setPluginPosition}"
                value="${this.localizedTexts.sendButton}"
                height="36"
                width="${commandContainerWidth - 40}"
              ></sc-button>`
            : html`
              <p class="info">
                ${this.localizedTexts.selectPosition}
              </p>`
          }
        </div>
      </section>
    `;
  }

  onUpdatePosition(e) {
    const positions = e.detail.value;

    if (positions[0]) {
      // on first position change we want to display the send button
      const requestUpdate = (this.x === null && this.y === null) ? true : false;

      this.x = positions[0].x;
      this.y = positions[0].y;

      if (requestUpdate) {
        this.requestUpdate();
      }
    }
  }

  setPluginPosition() {
    this.plugin.setPosition(this.x, this.y);
  }
}

customElements.define('sw-plugin-position', SwSPluginPosition);
