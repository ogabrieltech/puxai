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


## Atendimento comercial versão 3 (site como fonte)
- Alinhado às três ofertas publicadas em ogabrieltech.com.br: Landing Page Express a partir de R$297, Site Institucional a partir de R$597 e Social Start a partir de R$147. Automações e sistemas: valor sob orçamento.
- Fluxo por resposta privada: MENU ou saudação -> opções 1-5 -> escopo de serviço -> coleta em uma mensagem -> aviso interno para Gabriel -> modo silencioso para atendimento humano.
- FAQ: PREÇOS, PRAZO, PORTFÓLIO, DOMÍNIO, MANUTENÇÃO, PAGAMENTO e HORÁRIO.
- Cadastro mínimo de interesse na tabela CustomerLead: JID, serviço, etapa, carimbos de data; conteúdo da conversa permanece no histórico de mensagens do painel.
- Etiquetas no CRM são aplicadas ao chat automaticamente. Solicitações humanas e orçamentos criam notificações internas; lembrete diário interno para pedidos humanos sem rótulo Concluído.
- PAUSAR/SAIR cancela respostas naquela conversa; INICIAR reativa; MENU reinicia o atendimento. Não envia mensagens de marketing, disparos ou follow-ups externos.
- O painel de regras editáveis guarda os modelos por palavra-chave. O sistema só altera os modelos da marca na migração inicial v3; mudanças feitas depois são preservadas.
- IMPORTANTE: gateway Baileys não é a API oficial Meta. Dependências upstream apresentam vulnerabilidades de segurança reportadas; revisar antes de confiar dados comerciais sensíveis.
