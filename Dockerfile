# ogabrieltechIA - WA-AKG pinned and privacy hardened build
FROM alpine/git:2.47.2 AS upstream
ARG WA_AKG_COMMIT=c7dd01a04339e4363b549beb3a41fe02cf131acb
RUN git clone https://github.com/mrifqidaffaaditya/WA-AKG.git /wa-akg && cd /wa-akg && git checkout "$WA_AKG_COMMIT"

FROM node:26-alpine AS builder
RUN apk add --no-cache openssl ca-certificates
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=upstream /wa-akg/ ./
COPY scripts/patch-upstream.cjs /tmp/patch-upstream.cjs
COPY scripts/setup-customer-service.cjs ./scripts/setup-customer-service.cjs
COPY scripts/customer-service.ts ./src/modules/whatsapp/store/customer-service.ts
RUN node /tmp/patch-upstream.cjs
# ELFIG private customer-service dashboard — original branding assets, no change to WA sessions
COPY scripts/elfig-ui.cjs /tmp/elfig-ui.cjs
COPY scripts/elfig-dashboard.tsx /tmp/elfig-dashboard.tsx
COPY scripts/elfig-leads.tsx /tmp/elfig-leads.tsx
COPY scripts/elfig-leads-actions.ts /tmp/elfig-leads-actions.ts
COPY scripts/elfig-crm-page.tsx /tmp/elfig-crm-page.tsx
COPY scripts/elfig-crm-detail.tsx /tmp/elfig-crm-detail.tsx
COPY scripts/elfig-crm-actions.ts /tmp/elfig-crm-actions.ts
COPY scripts/elfig-login.tsx /tmp/elfig-login.tsx
COPY scripts/elfig-logo.svg /tmp/elfig-logo.svg
COPY scripts/elfig-symbol.svg /tmp/elfig-symbol.svg
RUN node /tmp/elfig-ui.cjs
RUN npm ci --legacy-peer-deps && npm cache clean --force
# Pinned security patches: Next.js <= 16.4.0 has an upstream image optimization RCE.
# React RSC contains known denial-of-service issues in earlier patch lines.
# The upstream rc9 patch has a stale patch-package version header and should not be applied to patched Baileys rc12.
RUN rm -f "patches/@whiskeysockets+baileys+7.0.0-rc.9.patch" && npm pkg set "overrides.protobufjs=7.6.6" "overrides.postcss-selector-parser=7.1.6" "overrides.whatsapp-rust-bridge=0.5.5"
# Runtime startup requires tsx and Prisma CLI; keep only these tools in production dependencies.
RUN npm pkg set "dependencies.tsx=4.21.0" "dependencies.typescript=5.9.3" "dependencies.prisma=5.22.0" && npm pkg delete "devDependencies.tsx" "devDependencies.typescript" "devDependencies.prisma"
RUN npm install --save-exact --legacy-peer-deps next@16.4.1 eslint-config-next@16.4.1 react@19.2.6 react-dom@19.2.6 sharp@0.35.5 next-auth@5.0.0-beta.32 @whiskeysockets/baileys@7.0.0-rc12
RUN npm uninstall --legacy-peer-deps wa-sticker-formatter
RUN npm audit fix --legacy-peer-deps || echo "[SECURITY] Unresolved high/moderate findings remain; see audited breakdown"
# Emit machine-readable production audit summary without failing the Docker build.
RUN npm audit --omit=dev --json > /tmp/security-audit.json || true; node -e 'const a=require("/tmp/security-audit.json"); const v=a.vulnerabilities||{}; console.log("[SECURITY_AUDIT] "+JSON.stringify({counts:a.metadata?.vulnerabilities,critical:Object.entries(v).filter(([k,x])=>x.severity==="critical").map(([k,x])=>({name:k,via:x.via,fix:x.fixAvailable})),high:Object.entries(v).filter(([k,x])=>x.severity==="high").map(([k,x])=>({name:k,fix:x.fixAvailable})),moderate:Object.entries(v).filter(([k,x])=>x.severity==="moderate").map(([k,x])=>({name:k,fix:x.fixAvailable}))}))'
RUN npx prisma generate && npx next build --webpack
RUN npm prune --omit=dev && npm audit --omit=dev --audit-level=moderate

FROM node:26-alpine AS runner
RUN apk add --no-cache openssl ca-certificates
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/scripts ./scripts
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && (if [ -n \"$ADMIN_EMAIL\" ] && [ -n \"$ADMIN_PASSWORD\" ]; then node scripts/setup-admin.js \"$ADMIN_EMAIL\" \"$ADMIN_PASSWORD\"; fi) && node scripts/setup-customer-service.cjs && node node_modules/tsx/dist/cli.mjs src/server/index.ts"]
