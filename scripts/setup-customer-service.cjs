// Run once after DB schema sync. Creates only user-requested, private-chat support rules.
// Automation remains disabled until a security review and explicit activation.
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const VERSION = 1;
const rules = [
  {
    "keyword": "menu",
    "response": "Olá! Você está no atendimento da *ogabrieltech*.\n\nEste é um atendimento automatizado inicial para organizar sua solicitação.\n\nDigite uma das opções:\n• *SITE* — criação de sites e landing pages\n• *DESIGN* — artes e identidade visual\n• *AUTOMACAO* — chatbots e automações\n• *NFC* — placas de avaliação do Google\n• *ORCAMENTO* — informações para uma proposta\n• *HUMANO* — atendimento pessoal\n\nSe preferir, descreva sua necessidade por aqui.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "site",
    "response": "*Criação de sites e landing pages*\n\nPara preparar seu orçamento, me envie:\n1. Nome da empresa e segmento\n2. Objetivo do site (institucional, catálogo, vendas ou captação de contatos)\n3. Alguma referência de site que você goste\n4. Prazo desejado\n\nAssim consigo analisar seu projeto. Digite *HUMANO* se preferir atendimento pessoal.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "landing page",
    "response": "*Criação de sites e landing pages*\n\nPara preparar seu orçamento, me envie:\n1. Nome da empresa e segmento\n2. Objetivo do site (institucional, catálogo, vendas ou captação de contatos)\n3. Alguma referência de site que você goste\n4. Prazo desejado\n\nAssim consigo analisar seu projeto. Digite *HUMANO* se preferir atendimento pessoal.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "design",
    "response": "*Design e conteúdo para redes sociais*\n\nMe conte:\n1. Nome da marca ou perfil\n2. Que tipo de arte precisa (post, carrossel, anúncio, identidade visual)\n3. Quantidade de peças\n4. Se já tem logo e identidade visual\n\nPode enviar referências nesta conversa. Digite *HUMANO* se preferir.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "artes",
    "response": "*Design e conteúdo para redes sociais*\n\nMe conte:\n1. Nome da marca ou perfil\n2. Que tipo de arte precisa (post, carrossel, anúncio, identidade visual)\n3. Quantidade de peças\n4. Se já tem logo e identidade visual\n\nPode enviar referências nesta conversa. Digite *HUMANO* se preferir.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "automacao",
    "response": "*Automações para seu negócio*\n\nPara entender seu processo, me diga:\n1. Nome da empresa\n2. O que deseja automatizar (WhatsApp, atendimento, formulários, tarefas ou outro)\n3. Qual ferramenta utiliza hoje\n4. Qual resultado espera conseguir\n\nDescreva com suas palavras. Digite *HUMANO* para atendimento pessoal.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "automação",
    "response": "*Automações para seu negócio*\n\nPara entender seu processo, me diga:\n1. Nome da empresa\n2. O que deseja automatizar (WhatsApp, atendimento, formulários, tarefas ou outro)\n3. Qual ferramenta utiliza hoje\n4. Qual resultado espera conseguir\n\nDescreva com suas palavras. Digite *HUMANO* para atendimento pessoal.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "nfc",
    "response": "*Placa NFC para avaliações no Google*\n\nMe informe:\n1. Nome do estabelecimento\n2. Quantas placas você precisa\n3. Cidade para verificar entrega\n4. Se sua empresa já possui perfil no Google\n\nCom esses dados, preparo as próximas orientações. Digite *HUMANO* se preferir.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "orcamento",
    "response": "*Solicitação de orçamento*\n\nEnvie, por favor, o nome da empresa, serviço desejado, um resumo do projeto e o prazo esperado. Pode incluir arquivos ou referências.\n\nAs informações ficarão nesta conversa para análise e retorno pessoal.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "orçamento",
    "response": "*Solicitação de orçamento*\n\nEnvie, por favor, o nome da empresa, serviço desejado, um resumo do projeto e o prazo esperado. Pode incluir arquivos ou referências.\n\nAs informações ficarão nesta conversa para análise e retorno pessoal.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "humano",
    "response": "*Atendimento pessoal*\n\nCerto. Escreva seu nome, sua empresa (se houver) e o que precisa. Sua mensagem ficará registrada nesta conversa para que o atendimento seja continuado pessoalmente.\n\nPara rever os serviços, envie *MENU*.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  }
];
const labels = [
  {
    "name": "Novo lead",
    "color": 6,
    "colorHex": "#9400D3"
  },
  {
    "name": "Orçamento solicitado",
    "color": 10,
    "colorHex": "#FFD700"
  },
  {
    "name": "Aguardando cliente",
    "color": 4,
    "colorHex": "#0000FF"
  },
  {
    "name": "Em andamento",
    "color": 3,
    "colorHex": "#00FF00"
  },
  {
    "name": "Concluído",
    "color": 14,
    "colorHex": "#696969"
  }
];

async function main() {
  const sid = process.env.OGT_CUSTOMER_SESSION_ID;
  if (!sid) {
    console.log("[CustomerSetup] No target session specified; skipping.");
    return;
  }
  const session = await prisma.session.findUnique({
    where: { sessionId: sid },
    include: { botConfig: true }
  });
  if (!session) {
    console.log("[CustomerSetup] Target session not found; skipping without changing any other session.");
    return;
  }
  const oldConfig = session.config && typeof session.config === "object" && !Array.isArray(session.config)
    ? session.config : {};
  if (oldConfig.ogtCustomerServiceVersion === VERSION) {
    console.log("[CustomerSetup] Already configured. Preserving manual edits.");
    return;
  }
  // The business phone is connected. Never start unsolicited automatic replies.
  await prisma.botConfig.upsert({
    where: { sessionId: session.id },
    create: { sessionId: session.id, enabled: false, botName: "ogabrieltechIA", botMode: "OWNER", autoReplyMode: "ALL", autoRead: false, alwaysOnline: false },
    update: { enabled: false, botName: "ogabrieltechIA", autoRead: false, alwaysOnline: false }
  });
  for (const rule of rules) {
    const current = await prisma.autoReply.findFirst({
      where: { sessionId: session.id, keyword: rule.keyword, triggerType: "PRIVATE" }
    });
    if (!current) {
      await prisma.autoReply.create({ data: { sessionId: session.id, ...rule } });
    }
  }
  for (const label of labels) {
    await prisma.label.upsert({
      where: { sessionId_name: { sessionId: sid, name: label.name } },
      create: { sessionId: sid, ...label },
      update: {}
    });
  }
  await prisma.session.update({
    where: { sessionId: sid },
    data: { config: { ...oldConfig, ogtCustomerServiceVersion: VERSION } }
  });
  console.log("[CustomerSetup] 11 text reply templates and 5 CRM labels prepared; automatic answering PAUSED.");
}
main()
  .catch(error => { console.error("[CustomerSetup] Setup failed:", error); process.exitCode = 1; })
  .finally(async () => prisma.$disconnect());
