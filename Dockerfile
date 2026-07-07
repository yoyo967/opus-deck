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
COPY apps/workbench/package.json apps/workbench/
RUN npm install --no-audit --no-fund

# Quellen + Build der Workbench (zieht @opus-deck/ui-kit als Workspace-Dependency)
COPY . ./
RUN npm run build -w @opus-deck/workbench

EXPOSE 3333
CMD ["npm", "run", "start:container", "-w", "@opus-deck/workbench"]
