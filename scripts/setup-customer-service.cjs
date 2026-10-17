const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const VERSION = 3;
const rules = [
  {
    "keyword": "menu",
    "response": "*ogabrieltech | Atendimento*\n\nOlá! Sou o assistente automático de Gabriel. Me diga qual solução você procura:\n\n*1* — Landing Page Express (a partir de R$ 297)\n*2* — Site Institucional (a partir de R$ 597)\n*3* — Social Start: 5 artes + legendas (a partir de R$ 147)\n*4* — Sistemas e automações (orçamento personalizado)\n*5* — Falar com Gabriel\n\nVocê também pode digitar *PREÇOS*, *PRAZO*, *PORTFÓLIO* ou *MENU*.\n\nSite: https://ogabrieltech.com.br/",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "landing",
    "response": "*Landing Page Express | a partir de R$ 297*\n\nIdeal para apresentar seu negócio em uma página objetiva.\n• Até 5 seções\n• Layout adaptado para celular\n• Botão para WhatsApp\n• Publicação inclusa\n\n*Para preparar uma proposta*, envie em uma mensagem: seu nome, nome da empresa, ramo de atuação, o que deseja destacar e prazo desejado.\n\nO investimento final depende do escopo. Para falar direto com Gabriel, digite *HUMANO*.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "institucional",
    "response": "*Site Institucional | a partir de R$ 597*\n\nPara transmitir credibilidade e apresentar sua empresa.\n• Estrutura institucional\n• Design moderno e responsivo\n• Contato e localização\n\n*Para preparar uma proposta*, envie em uma mensagem: seu nome, nome da empresa, principais páginas/serviços, referências e prazo desejado.\n\nO investimento final depende do escopo. Digite *HUMANO* para falar com Gabriel.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "social",
    "response": "*Social Start | a partir de R$ 147*\n\nPacote inicial de conteúdo visual para sua marca.\n• 5 artes\n• Legendas incluídas\n• Identidade visual consistente\n• 1 rodada de ajustes\n\n*Para preparar uma proposta*, envie em uma mensagem: seu nome, @ da empresa, segmento, tipo de conteúdo e referências.\n\nO investimento final depende do escopo. Digite *HUMANO* para falar com Gabriel.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "personalizado",
    "response": "*Sistemas e automações | sob orçamento*\n\nGabriel também analisa necessidades de sistemas, integrações, painéis e processos digitais.\n\nPara entender seu projeto, envie em uma mensagem: seu nome, empresa, problema atual, ferramentas utilizadas, resultado esperado e prazo desejado.\n\nEscopo, viabilidade, prazo e valor serão avaliados pessoalmente.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "precos",
    "response": "*Investimentos iniciais no site*\n\n• Landing Page Express — a partir de *R$ 297*\n• Site Institucional — a partir de *R$ 597*\n• Social Start (5 artes + legendas) — a partir de *R$ 147*\n• Projetos personalizados — sob orçamento\n\nValores são referências iniciais, não propostas fechadas.\n\nDigite *1*, *2*, *3* ou *4* para solicitar um orçamento.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "prazo",
    "response": "*Prazos e entrega*\n\nO prazo depende do escopo e dos materiais do projeto. Gabriel confirma datas e etapas na proposta, após entender sua necessidade.\n\nDigite *MENU* para escolher um serviço ou *HUMANO* para atendimento pessoal.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "portfolio",
    "response": "*Portfólio da ogabrieltech*\n\nVeja os trabalhos e projetos em https://ogabrieltech.com.br/\n\nDestaques apresentados no site: Nort, Maxxbox Hub, Ricardo Sucatas e trabalhos de conteúdo para Magnetiza / Huze Pet.\n\nDigite *MENU* para solicitar uma proposta.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "dominio",
    "response": "*Domínio, hospedagem e publicação*\n\nLanding Page Express inclui publicação, conforme a oferta do site. Domínio próprio, hospedagem e necessidades adicionais são verificados na proposta conforme seu projeto.\n\nDigite *MENU* para escolher o serviço.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "manutencao",
    "response": "*Manutenção e alterações*\n\nSuporte contínuo, manutenção e mudanças após a entrega são combinados conforme a necessidade. No Social Start há 1 rodada de ajustes incluída.\n\nDigite *HUMANO* para alinhar o seu caso.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "pagamento",
    "response": "*Pagamento*\n\nAs condições de pagamento serão apresentadas por Gabriel junto com o orçamento. Não é necessário enviar dados bancários ou de cartão para este atendimento automático.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "horario",
    "response": "*Atendimento*\n\nO primeiro contato é organizado automaticamente por aqui. O retorno pessoal depende da disponibilidade de Gabriel, sem horário ou prazo fixo anunciado no site.\n\nDigite *HUMANO* se quiser falar diretamente com ele.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "humano",
    "response": "*Atendimento com Gabriel*\n\nSua solicitação foi encaminhada para atendimento pessoal. Pode escrever sua dúvida, compartilhar as referências ou explicar seu projeto nesta conversa.\n\nO assistente vai parar de responder automaticamente até você enviar *MENU* novamente.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "recebido",
    "response": "*Informações recebidas!*\n\nObrigado pelo contexto. Deixei seu pedido de orçamento sinalizado para análise de Gabriel, que responderá pessoalmente assim que possível.\n\nSe quiser, envie links, referências ou arquivos por aqui. O assistente não vai interromper a conversa. Para reabrir o menu, digite *MENU*.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "complemento",
    "response": "Pode me enviar em uma única mensagem um breve resumo da sua empresa, o que precisa e o prazo desejado? Assim Gabriel terá o contexto para preparar uma proposta.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "optout",
    "response": "Certo. Desativei o atendimento automático para esta conversa. Se quiser voltar ao menu, envie *INICIAR*.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "ajuda",
    "response": "Para conhecer as opções, envie *MENU*. Para atendimento pessoal, envie *HUMANO*.",
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
    "name": "Landing Page Express",
    "color": 7,
    "colorHex": "#FF1493"
  },
  {
    "name": "Site Institucional",
    "color": 4,
    "colorHex": "#0000FF"
  },
  {
    "name": "Social Start",
    "color": 8,
    "colorHex": "#00CED1"
  },
  {
    "name": "Projeto personalizado",
    "color": 5,
    "colorHex": "#4B0082"
  },
  {
    "name": "Orçamento solicitado",
    "color": 10,
    "colorHex": "#FFD700"
  },
  {
    "name": "Aguardando cliente",
    "color": 13,
    "colorHex": "#2F4F4F"
  },
  {
    "name": "Atendimento humano",
    "color": 0,
    "colorHex": "#FF0000"
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
  if (!sid) { console.log("[CustomerSetup] No target session."); return; }
  const session = await prisma.session.findUnique({where:{sessionId:sid},include:{botConfig:true}});
  if (!session) { console.log("[CustomerSetup] Target not present."); return; }
  const enabled = process.env.OGT_AUTO_REPLY_ENABLED === "true";
  const prev = session.config && typeof session.config === "object" && !Array.isArray(session.config) ? session.config : {};
  await prisma.botConfig.upsert({
    where:{sessionId:session.id},
    create:{sessionId:session.id,enabled,botName:"ogabrieltechIA",botMode:"OWNER",autoReplyMode:"ALL",autoRead:false,alwaysOnline:false,enableSticker:false,enableVideoSticker:false,enablePing:false,enableUptime:false},
    update:{botName:"ogabrieltechIA",botMode:"OWNER",autoReplyMode:"ALL",autoRead:false,alwaysOnline:false,enableSticker:false,enableVideoSticker:false,enablePing:false,enableUptime:false,...(prev.ogtCustomerServiceVersion !== VERSION ? { enabled } : {})}
  });
  if (prev.ogtCustomerServiceVersion === VERSION) {
    console.log("[CustomerSetup] Config already initialized; dashboard edits preserved.");
    return;
  }
  for(const rule of rules) {
    const existing=await prisma.autoReply.findFirst({where:{sessionId:session.id,keyword:rule.keyword,triggerType:"PRIVATE"}});
    if(existing) await prisma.autoReply.update({where:{id:existing.id},data:{response:rule.response,matchType:"EXACT",triggerType:"PRIVATE",isMedia:false,mediaUrl:null,mediaType:null}});
    else await prisma.autoReply.create({data:{sessionId:session.id,...rule}});
  }
  for(const label of labels) await prisma.label.upsert({where:{sessionId_name:{sessionId:sid,name:label.name}},create:{sessionId:sid,...label},update:{}});
  await prisma.session.update({where:{sessionId:sid},data:{config:{...prev,ogtCustomerServiceVersion:VERSION}}});
  console.log("[CustomerSetup] Site-aligned sales flow configured: "+rules.length+" templates, "+labels.length+" CRM labels; bot "+(enabled?"ENABLED":"PAUSED")+".");
}
main().catch(e=>{console.error("[CustomerSetup] Error",e);process.exitCode=1;}).finally(async()=>prisma.$disconnect());
