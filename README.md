# ELFIG Atendimento — preparação para homologação

Central de atendimento da **ELFIG — Creative & Technology**, construída sobre o projeto [WA-AKG](https://github.com/mrifqidaffaaditya/WA-AKG) (MIT), utilizando um commit upstream fixado e patches próprios.

> Esta branch é **uma proposta de migração**. Não foi publicada na Railway e ainda requer build, teste de autenticação e homologação de fluxo com número secundário.

## O que mudou nesta branch

- Tela de entrada personalizada para a ELFIG, em português.
- Aplicação do logotipo oficial, sem alteração dos vetores da marca.
- Design system com azul-marinho \`#0B1F3B\`, verde \`#22D37F\` e branco-gelo.
- Página inicial do painel totalmente nova, mostrando leads e status de atendimento.
- Menu do aplicativo com navegação simplificada em português.
- Atalhos para conversas, etiquetas, sessões e configurações de atendimento.
- Fluxo receptivo com sete opções: Sites; Marketing; Branding; Sistemas; Automações; Suporte TI; Humano.
- Roteiros com coleta de briefing, notificações de atendimento humano e opt-out PARAR.
- Respostas automáticas novas começam **pausadas** após a primeira atualização; só ative após os testes.

## Infraestrutura preservada

A aplicação continuará apontando para o mesmo MySQL e mantendo o volume de mídias em \`/app/uploads\`. Não há migração destrutiva de tabelas nem alteração do nome do serviço na Railway.

Internamente, permanecem os nomes de ambiente \`OGT_CUSTOMER_SESSION_ID\` e \`OGT_AUTO_REPLY_ENABLED\` por compatibilidade com o deploy existente. **Não remova nem recrie essas variáveis.** O fluxo ELFIG é selecionado pela sessão existente.

O \`setup-customer-service.cjs\` roda na inicialização e atualiza templates na primeira execução da versão 5; não apaga conversas nem leads. Ele pode substituir textos antigos das palavras-chave padrão, portanto salve cópia dos textos personalizados antes da homologação.

## Autorização e segurança

A integração usa **Baileys**, não a API oficial Meta WhatsApp Business Platform. Existe risco de restrições ou bloqueio de conta. Não utilize para disparos não solicitados ou campanhas em massa.

A atualização não elimina todos os riscos de dependências upstream. Revise o relatório \`npm audit\`, autenticação, endpoints e permissões antes da operação contínua.

O sistema continua com acesso autenticado. Não publique senhas, tokens, URLs internas do MySQL ou variáveis de ambiente no repositório.

## Fluxo de homologação

1. Faça backup do banco MySQL e do volume de mídia; preserve as credenciais.
2. Execute o build da nova branch em ambiente **isolado**, sem apontar a produção ao mesmo banco durante os testes.
3. Confira a identidade visual (logo oficial, login, dashboard e menu).
4. Verifique os papéis de acesso: um usuário não deve visualizar sessões ou leads alheios.
5. Valide criação e leitura de sessões, status de QR Code, histórico, anexos e notificações.
6. Com número secundário e consentido, teste: OI, MENU, 1–7, briefing, HUMANO, PARAR, INICIAR.
7. Confirme que responder manualmente interrompe o fluxo no estado HUMANO.
8. Teste a reativação manual da automação e monitore logs.
9. Execute o build, lint e testes disponíveis. Só depois avalie o merge para a branch observada pela Railway.

## Organização do build

O Dockerfile baixa o upstream fixado, aplica \`scripts/patch-upstream.cjs\` e depois executa \`scripts/elfig-ui.cjs\` para copiar as telas personalizadas, o logotipo e os ajustes de estilo.

Arquivos desta adaptação:

- \`scripts/elfig-ui.cjs\`: branding, navegação e montagem das telas.
- \`scripts/elfig-dashboard.tsx\`: visão geral de atendimento e CRM.
- \`scripts/elfig-login.tsx\`: acesso autenticado ELFIG.
- \`scripts/elfig-logo.svg\` e \`scripts/elfig-symbol.svg\`: identidade oficial.
- \`scripts/customer-service.ts\`: máquina de estados receptiva.
- \`scripts/setup-customer-service.cjs\`: templates, etiquetas e inicialização.

## Deploy

A produção atual acompanha a branch \`ogabrieltechia-wa-akg\`. Esta branch \`elfig-attendimento-v1\` é deliberadamente separada e **não provoca redeploy automático**. A publicação depende de teste e aprovação do proprietário.

## Próximos incrementos sugeridos

- Central de conversas com coluna de pipeline e pesquisa de leads.
- Cadastro/edição de dados comerciais do lead com histórico de etapas.
- Permissões por atendente e auditoria de ações.
- Indicadores por período de tempo e origem de oportunidades.
- Integração oficial WhatsApp Business Platform, se desejada.
