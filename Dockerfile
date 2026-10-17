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
RUN node /tmp/patch-upstream.cjs
RUN npm ci --legacy-peer-deps && npm cache clean --force
RUN npx prisma generate && npx next build --webpack
RUN npm prune --omit=dev && npm install --no-save tsx typescript prisma@5.22.0

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
