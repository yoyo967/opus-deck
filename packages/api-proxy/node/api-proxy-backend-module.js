// OPUS DECK — Same-Origin-API-Proxy (Theia-Backend-Contribution).
//
// Die Panels rufen /api/* auf DEMSELBEN Origin (der Workbench). Dieses Backend-Modul leitet
// /api/* an das PRIVATE OPUS-PRIME-EX-Backend weiter und haengt ein Google-**Identity-Token**
// (Service-zu-Service) an -> das Backend braucht KEINE oeffentliche Exposition und KEINEN
// Client-Token mehr. Zieladresse aus Env OPUS_BACKEND_URL (Cloud-Run-Backend-URL).
//
// Sicherheit: der Browser spricht nur mit der Workbench (ein Origin, kein CORS, kein Token im
// Client). Die Auth zum Backend passiert serverseitig ueber die Runtime-Service-Account-Identity
// (Metadata-Server); das Backend ist --no-allow-unauthenticated.
const { ContainerModule, injectable, decorate } = require('@theia/core/shared/inversify');
const { BackendApplicationContribution } = require('@theia/core/lib/node');
const express = require('express');
const { GoogleAuth } = require('google-auth-library');

const BACKEND = (process.env.OPUS_BACKEND_URL || '').replace(/\/+$/, '');

class ApiProxyContribution {
  configure(app) {
    if (!BACKEND) {
      console.warn('[api-proxy] OPUS_BACKEND_URL nicht gesetzt -> /api wird NICHT weitergeleitet.');
      return;
    }
    // Identity-Token nur fuer HTTPS-Ziele (Cloud Run, privat). Bei http (lokaler Dev-Backend)
    // ohne Token weiterleiten.
    const istHttps = BACKEND.startsWith('https://');
    const auth = istHttps ? new GoogleAuth() : null;
    let clientPromise;
    const getClient = () => {
      if (!clientPromise) clientPromise = auth.getIdTokenClient(BACKEND);
      return clientPromise;
    };
    // Eigener JSON-Parser fuer /api (no-op, falls Theia den Body schon geparst hat).
    app.use('/api', express.json({ limit: '1mb' }));
    app.all('/api/*', async (req, res) => {
      const istBody = req.method !== 'GET' && req.method !== 'HEAD';
      const ziel = BACKEND + req.originalUrl;
      try {
        if (istHttps) {
          const client = await getClient();
          const antwort = await client.request({
            url: ziel, method: req.method,
            data: istBody ? (req.body || {}) : undefined,
            headers: { 'content-type': 'application/json' },
            responseType: 'json', validateStatus: () => true,
          });
          res.status(antwort.status).json(antwort.data);
        } else {
          const antwort = await fetch(ziel, {
            method: req.method,
            headers: { 'content-type': 'application/json' },
            body: istBody ? JSON.stringify(req.body || {}) : undefined,
          });
          const daten = await antwort.json().catch(() => ({}));
          res.status(antwort.status).json(daten);
        }
      } catch (e) {
        res.status(502).json({ fehler: 'api-proxy: ' + (e && e.message ? e.message : String(e)) });
      }
    });
    console.log('[api-proxy] /api/* -> ' + BACKEND + (istHttps ? ' (Identity-Token)' : ' (lokal)'));
  }
}
decorate(injectable(), ApiProxyContribution);

// Theias Backend-Loader laedt das Modul ueber `.default` -> beide Formen exportieren.
const containerModule = new ContainerModule((bind) => {
  bind(BackendApplicationContribution).to(ApiProxyContribution).inSingletonScope();
});
module.exports = containerModule;
module.exports.default = containerModule;
