# ogabrieltechIA — Railway WhatsApp management

Deployment layer for [WA-AKG](https://github.com/mrifqidaffaaditya/WA-AKG), an MIT-licensed self-hosted gateway using Baileys. Upstream pinned to commit `c7dd01a04339e4363b549beb3a41fe02cf131acb`.

## What this build changes
- Removes WA-AKG startup heartbeat that sends installation metadata to an external URL.
- Disables self-registration by default and ensures it stays closed.
- Changes initial dashboard name to ogabrieltechIA and adds purple brand colors.
- Keeps upstream's Next.js, Prisma MySQL, Baileys and API.
- Does not change the WhatsApp licensing/ban risk; the gateway is not Meta's official API.

## Railway variables (set as Railway secrets)
DATABASE_URL, AUTH_SECRET, BASE_URL, NEXTAUTH_URL, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_API_URL, APP_NAME, ADMIN_EMAIL, ADMIN_PASSWORD, NEXT_PUBLIC_SWAGGER_PASSWORD, PORT, HOSTNAME, TZ, LOCALE, AUTH_TRUST_HOST, NEXT_PUBLIC_ALLOW_INDEXING.

The MySQL service must be private, with persistent storage. Use one app replica. Store media on a persistent volume mounted to /app/uploads.

**Security note:** independently audit upgrades to upstream and the generated image before connecting a real business number. Do not use blast features for unsolicited messages. Change your initial admin password after first login.

## Atendimento ogabrieltech (pré-configurado)
- A sessão `OGT_CUSTOMER_SESSION_ID` recebe 11 respostas por palavra-chave explícita, só em mensagens privadas: MENU, SITE, LANDING PAGE, DESIGN, ARTES, AUTOMACAO/AUTOMAÇÃO, NFC, ORCAMENTO/ORÇAMENTO e HUMANO.
- Cria 5 etiquetas no painel (a atribuição aos chats é manual).
- A configuração é idempotente e fica registrada na sessão; mudanças posteriores feitas pelo usuário são preservadas.
- **Importante:** `BotConfig.enabled = false` na primeira configuração para evitar mensagens automáticas prematuras. Não ativar até correção/revisão das vulnerabilidades de dependências e teste com número secundário.
- Não envia disparos, não ativa IA, não agenda mensagens e não cria leads automaticamente.
