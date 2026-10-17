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

## Atendimento em produção (comandos privados)
- A chave `OGT_AUTO_REPLY_ENABLED=true` ativa as respostas exatas em mensagens privadas para a sessão `OGT_CUSTOMER_SESSION_ID`.
- Saudações `oi`, `olá`, `ola`, `bom dia`, `boa tarde`, `boa noite`, `ajuda` e `atendimento` abrem o menu, no máximo uma vez a cada 6 horas por remetente enquanto o processo estiver ativo. O comando `MENU` abre o menu mesmo durante esse intervalo.
- Demais opções: SITE, LANDING PAGE, DESIGN, ARTES, AUTOMACAO, AUTOMAÇÃO, NFC, ORCAMENTO, ORÇAMENTO, HUMANO (todas por mensagem exata e em privado).
- HUMANO envia confirmação ao cliente e cria uma notificação no painel para atendimento manual. O bot não processa mensagens abertas como IA.
- Não usar em produção contínua sem avaliar os avisos `npm audit` e revisar a segurança da aplicação e o risco de bloqueio do WhatsApp.

## Atendimento geral v4 (independente do site)
Menu: 1 Sites/LP, 2 Design, 3 Sistemas e automacoes, 4 NFC, 5 Outros, 6 Humano. Os preços não são anunciados. Coleta briefing e cria notificações internas e etiquetas; ao encaminhar para humano o bot silencia nessa conversa. Atendimento somente receptivo, privado, sem campanhas ou IA. Use PARAR para desativar na conversa, INICIAR para retomar. Dependencias upstream precisam de auditoria de segurança antes de uso sensível em produção.

### Security changes October 2026
- Node builder pins Next.js 16.4.1, React 19.2.6, Auth.js / next-auth 5 beta.32, Baileys rc12, and protobufjs 7.6.6. The stale rc9 patch is removed before upgrading Baileys.
- Unsafe legacy sticker conversion is disabled and its wa-sticker-formatter dependency removed. Dedicated sticker POST returns HTTP 410; regular customer-support text, WhatsApp incoming media, labels, and CRM remain available.
- Build runs npm audit for production packages, prints counts and any critical findings.
