# OPUS DECK Workbench (Theia browser app) — Linux-Build/-Runtime.
# Loest das Windows-Dev-Problem: native Backend-Module (drivelist/nsfw) bauen hier
# sauber (build-essential + python3). Entspricht dem Ziel-Target (Cloud Run, EU).
FROM node:22-bookworm

# Build-Toolchain fuer node-gyp / native Module
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Deps zuerst (Cache-freundlich) — MIT Build-Skripten (native Module bauen)
COPY package.json ./
RUN npm install --no-audit --no-fund

# App-Quellen + Build
COPY . ./
RUN npm run build

EXPOSE 3333
# In Container an 0.0.0.0 binden (nicht 127.0.0.1 wie im lokalen Dev-Script)
CMD ["node_modules/.bin/theia", "start", "--hostname", "0.0.0.0", "--port", "3333"]
