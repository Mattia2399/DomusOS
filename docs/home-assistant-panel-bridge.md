# Home Assistant Panel Bridge (Iframe)

Se installi la dashboard come `panel_custom` in Home Assistant, puoi evitare token/OAuth dentro l'iframe e usare direttamente la sessione HA gia autenticata del parent.

## Panel JS aggiornato

```js
class HaDashboardBuilderPanel extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._panel = null;
    this._iframe = null;
    this._lastStates = {};
    this._areas = null;
    this._onMessage = this._onMessage.bind(this);
  }

  set hass(hass) {
    this._hass = hass;
    this._syncToIframe();
  }

  set panel(panel) {
    this._panel = panel;
    this._render();
  }

  connectedCallback() {
    this.style.display = "block";
    this.style.width = "100%";
    this.style.height = "100vh";
    window.addEventListener("message", this._onMessage);
    this._render();
  }

  disconnectedCallback() {
    window.removeEventListener("message", this._onMessage);
  }

  _render() {
    if (this._iframe) return;

    const appUrl = this._panel?.config?.app_url || "/local/dashboard/index.html";
    this.innerHTML = `
      <iframe
        id="ha-dashboard-frame"
        src="${appUrl}"
        style="width: 100%; height: 100%; border: none; display: block;"
      ></iframe>
    `;

    this._iframe = this.querySelector("#ha-dashboard-frame");
    this._iframe.addEventListener("load", () => {
      this._postContext();
      void this._postSnapshot();
    });
  }

  _postToIframe(payload) {
    if (!this._iframe?.contentWindow) return;
    this._iframe.contentWindow.postMessage(payload, window.location.origin);
  }

  _postContext() {
    if (!this._hass) return;
    this._postToIframe({
      type: "ha-panel-context",
      hassUrl: window.location.origin,
      user: this._hass.user ?? null,
      locale: this._hass.locale ?? null,
    });
  }

  async _loadAreas() {
    if (!this._hass) return [];
    if (Array.isArray(this._areas)) return this._areas;
    try {
      if (typeof this._hass.callWS === "function") {
        this._areas = await this._hass.callWS({ type: "config/area_registry/list" });
      } else if (this._hass.connection?.sendMessagePromise) {
        this._areas = await this._hass.connection.sendMessagePromise({
          type: "config/area_registry/list",
        });
      } else {
        this._areas = [];
      }
    } catch {
      this._areas = [];
    }
    return this._areas;
  }

  async _postSnapshot() {
    if (!this._hass) return;
    const areas = await this._loadAreas();
    this._postToIframe({
      type: "ha-panel-snapshot",
      hassUrl: window.location.origin,
      user: this._hass.user ?? null,
      locale: this._hass.locale ?? null,
      states: this._hass.states ?? {},
      areas,
    });
    this._lastStates = this._hass.states ?? {};
  }

  _postStateChanged(entityId, state) {
    this._postToIframe({
      type: "ha-panel-state-changed",
      entityId,
      state: state ?? null,
    });
  }

  _syncToIframe() {
    if (!this._hass || !this._iframe?.contentWindow) return;

    this._postContext();

    const currentStates = this._hass.states ?? {};
    const previousStates = this._lastStates ?? {};
    const currentIds = new Set(Object.keys(currentStates));
    const previousIds = Object.keys(previousStates);

    const changedIds = [];
    for (const entityId of currentIds) {
      if (previousStates[entityId] !== currentStates[entityId]) {
        changedIds.push(entityId);
      }
    }
    for (const entityId of previousIds) {
      if (!currentIds.has(entityId)) {
        changedIds.push(entityId);
      }
    }

    if (changedIds.length === 0) return;

    if (changedIds.length > 120) {
      void this._postSnapshot();
      return;
    }

    for (const entityId of changedIds) {
      this._postStateChanged(entityId, currentStates[entityId] ?? null);
    }
    this._lastStates = currentStates;
  }

  async _onMessage(event) {
    if (event.origin !== window.location.origin) return;
    if (event.source !== this._iframe?.contentWindow) return;
    const payload = event.data;
    if (!payload || typeof payload !== "object") return;

    if (payload.type === "ha-panel-ready" || payload.type === "ha-panel-request-sync") {
      this._postContext();
      await this._postSnapshot();
      return;
    }

    if (payload.type === "ha-panel-call-service") {
      const requestId = typeof payload.requestId === "string" ? payload.requestId : "";
      try {
        if (!this._hass?.callService) {
          throw new Error("Home Assistant callService non disponibile.");
        }
        await this._hass.callService(payload.domain, payload.service, payload.serviceData ?? {});
        this._postToIframe({ type: "ha-panel-call-service-result", requestId, ok: true });
      } catch (error) {
        this._postToIframe({
          type: "ha-panel-call-service-result",
          requestId,
          ok: false,
          error: error instanceof Error ? error.message : "Servizio Home Assistant fallito.",
        });
      }
      return;
    }

    if (payload.type === "ha-panel-call-api") {
      const requestId = typeof payload.requestId === "string" ? payload.requestId : "";
      try {
        const message = payload.message;
        if (!message || typeof message !== "object") {
          throw new Error("Messaggio call-api non valido.");
        }
        let result;
        if (this._hass?.connection?.sendMessagePromise) {
          result = await this._hass.connection.sendMessagePromise(message);
        } else if (typeof this._hass?.callWS === "function") {
          result = await this._hass.callWS(message);
        } else {
          throw new Error("Canale API websocket Home Assistant non disponibile.");
        }
        this._postToIframe({
          type: "ha-panel-call-api-result",
          requestId,
          ok: true,
          result,
        });
      } catch (error) {
        this._postToIframe({
          type: "ha-panel-call-api-result",
          requestId,
          ok: false,
          error: error instanceof Error ? error.message : "Richiesta API Home Assistant fallita.",
        });
      }
    }
  }
}

customElements.define("ha-dashboard-builder-panel", HaDashboardBuilderPanel);
```

## Protocollo messaggi

- Parent -> iframe:
  - `ha-panel-context`
  - `ha-panel-snapshot`
  - `ha-panel-state-changed`
  - `ha-panel-call-service-result`
  - `ha-panel-call-api-result`
- Iframe -> parent:
  - `ha-panel-ready`
  - `ha-panel-request-sync`
  - `ha-panel-call-service`
  - `ha-panel-call-api`
