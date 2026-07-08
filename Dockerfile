# OPUS DECK — Monorepo-Build der Workbench (Theia) inkl. @opus-deck/ui-kit-Branding.
# Linux/Cloud-Run-Target: native Backend-Module (drivelist/nsfw) bauen hier sauber.
FROM node:22-bookworm

RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 make g++ ca-certificates libsecret-1-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Manifeste zuerst (Layer-Cache): Root + Workspaces
COPY package.json ./
COPY packages/ui-kit/package.json packages/ui-kit/
COPY packages/agent-panel/package.json packages/agent-panel/
COPY packages/brain-panel/package.json packages/brain-panel/
COPY packages/api-proxy/package.json packages/api-proxy/
COPY packages/flow-panel/package.json packages/flow-panel/
COPY apps/workbench/package.json apps/workbench/
RUN npm install --no-audit --no-fund

# Quellen + Build der Workbench (zieht @opus-deck/ui-kit als Workspace-Dependency)
COPY . ./
RUN npm run build -w @opus-deck/workbench

# Standard-Workspace (im Betrieb per-User/Volume; hier ein sichtbares Startverzeichnis)
RUN mkdir -p /workspace \
 && printf '# Willkommen bei OPUS DECK\n\nDies ist dein **Arbeitsbereich**.\n\n- Dateien anlegen, hochladen, bearbeiten, herunterladen\n- Rechtsklick im Explorer -> Upload Files... / Download\n- Diese Datei: Rechtsklick -> **Open Preview** (Markdown-Vorschau)\n\n> OPUS DECK - die Kommandobruecke fuer Agenten.\n' > /workspace/willkommen.md \
 && printf 'Name,Rolle,Domaene\nOPUS PRIME EX,Legal/Tax-Agent,Recht\nOPUS DECK,Workbench,Plattform\n' > /workspace/beispiel.csv \
 && printf '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120"><rect width="320" height="120" fill="#111317"/><text x="20" y="70" fill="#C9A227" font-family="sans-serif" font-size="34">OPUS DECK</text></svg>\n' > /workspace/logo.svg

EXPOSE 3333
CMD ["npm", "run", "start:container", "-w", "@opus-deck/workbench"]
