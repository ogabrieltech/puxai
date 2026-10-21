# ELFIG CRM — versão 1 (proposta de implantação)

## Objetivo
Transformar o atendimento WA-AKG existente em um CRM comercial centralizado, sem abandonar o WhatsApp e as sessões existentes.

## Incluído
- /dashboard/crm: funil visual (Novos, Em contato, Qualificados, Proposta, Negociação, Fechados e Perdidos)
- Cadastro manual de contatos com normalização de telefone
- Integração de novos leads recebidos pelo fluxo do WhatsApp (nome/telefone quando presentes)
- Importação **manual** de até 500 contatos já sincronizados por sessão, sem disparar mensagens
- Pesquisa por nome, empresa, telefone e e-mail
- Ficha comercial com dados, valor estimado, etapa, observações e follow-up
- Histórico auditável de notas, tarefas e alterações de etapa
- Criação e conclusão de tarefas com vencimento
- Exportação CSV (até 5000 leads), autenticada e limitada às sessões autorizadas, com mitigação de CSV formula injection
- Abertura individual no WhatsApp via wa.me, **apenas quando houver consentimento registrado e o contato não estiver marcado como OPT_OUT**
- Ações autenticadas e autorizadas por sessão; nenhuma rota aberta publicamente

## Limitações desta primeira etapa
- Não inclui envio direto de novas mensagens por API, disparos em massa, campanhas automáticas ou sequências frias.
- O botão WhatsApp abre a conversa no WhatsApp do operador; enviar a mensagem é uma ação humana.
- Cadastro de contatos sem consentimento é permitido; iniciar abordagem comercial pelo CRM, não.
- A importação busca até 500 contatos recentes por operação, sem paginação.
- A visualização do quadro e CSV têm limites declarados.
- Não há drag-and-drop, anexos comerciais ou atribuição de vendedores nesta primeira entrega.
- A integração usa Baileys, que **não é oficial** e não pode garantir que o WhatsApp não restringirá a conta.

## Banco e segurança
A migração **adiciona campos opcionais** a CustomerLead:
name, phone, company, email, leadSource, dealStage, dealValue, notes, nextFollowUpAt, contactConsent, consentEvidence, consentCapturedAt.

Adiciona tabelas CrmActivity e CrmTask. Não remove tabelas ou dados existentes. O sistema atual executa prisma db push ao iniciar; portanto, antes da integração na branch de produção, tire backup independente do MySQL e verifique a migração em uma cópia do banco.

O estado da automação (NEW, WAIT_BRIEF, HUMAN, OPT_OUT, DONE) é independente do estágio comercial. Salvar dados no CRM **não** reativa contatos que escolheram PARAR.

A UI não supõe autorização só porque um número aparece em contatos sincronizados. A autorização deve ser registrada com uma justificativa, e ainda cabe seguir as regras de privacidade e WhatsApp aplicáveis.

## Validação realizada
- Sintaxe dos scripts de patch e montagem: OK
- Simulação do patch de UI sobre o upstream fixado: OK
- Verificação estrutural do schema Prisma (campos e modelos): OK

## Pendente antes da produção
- Backup do MySQL, incluindo teste de recuperação
- Build Docker e validação TypeScript reais
- Homologação visual desktop/mobile
- Testes de formulários, controle de acesso multiusuário e sincronização com WhatsApp
- Testes de carga, backup, retenção e exclusão de dados
- Confirmação de que o CRM aparece corretamente no menu do painel

**Esta branch não deve ser integrada à produção antes desses testes.**
