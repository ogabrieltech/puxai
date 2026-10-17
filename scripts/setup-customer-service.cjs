const {PrismaClient}=require("@prisma/client");
const prisma=new PrismaClient();
const VERSION=4;
const rules=[
  {
    "keyword": "menu",
    "response": "*ogabrieltech | Atendimento*\n\nOlá! Sou o assistente de atendimento da ogabrieltech.\n\nComo posso ajudar?\n\n*1* — Sites e landing pages\n*2* — Design e redes sociais\n*3* — Sistemas e automações\n*4* — Placas NFC para avaliações do Google\n*5* — Outros serviços\n*6* — Falar com Gabriel\n\nResponda com o número da opção. Digite *MENU* para voltar.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "sites",
    "response": "*Sites e landing pages*\n\nPara preparar seu orçamento, envie em uma mensagem:\n1. Seu nome e nome da empresa\n2. Objetivo do projeto\n3. Serviços ou produtos a apresentar\n4. Prazo desejado\n5. Referências (se tiver)\n\nGabriel avaliará o projeto e confirmará o investimento. Digite *HUMANO* para falar diretamente com ele.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "design",
    "response": "*Design e redes sociais*\n\nMe informe:\n1. Nome da empresa ou perfil\n2. Peças desejadas (posts, carrosséis, identidade visual etc.)\n3. Quantidade aproximada\n4. Prazo desejado\n5. Referências (se tiver)\n\nGabriel avaliará o projeto e confirmará o investimento. Digite *HUMANO* para falar diretamente com ele.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "automacao",
    "response": "*Sistemas e automações*\n\nPara entender sua necessidade, envie:\n1. Nome e empresa\n2. O processo que quer automatizar\n3. Ferramentas que já utiliza\n4. Resultado esperado\n5. Prazo desejado\n\nGabriel vai avaliar a viabilidade e elaborar uma proposta.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "nfc",
    "response": "*Placas NFC para avaliações do Google*\n\nMe diga:\n1. Nome do estabelecimento\n2. Quantidade de placas desejada\n3. Cidade para entrega\n4. Se já possui perfil da empresa no Google\n\nGabriel vai confirmar disponibilidade e valores.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "outros",
    "response": "*Outros serviços*\n\nDescreva sua necessidade, nome da empresa (se houver), objetivo e prazo desejado. Gabriel avaliará a possibilidade de atendimento.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "precos",
    "response": "*Orçamentos*\n\nValores variam de acordo com o tipo e escopo do serviço. Escolha uma opção no *MENU* e descreva sua necessidade para receber uma proposta personalizada.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "prazo",
    "response": "*Prazo de entrega*\n\nO prazo é informado após avaliação do escopo e materiais necessários. Para solicitar um orçamento, envie *MENU*.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "portfolio",
    "response": "*Projetos e referências*\n\nGabriel poderá apresentar exemplos de trabalhos relevantes para a sua necessidade. Envie *HUMANO* ou escolha o serviço no *MENU*.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "pagamento",
    "response": "*Condições de pagamento*\n\nAs condições são definidas na proposta comercial. Nunca envie senhas ou dados completos de cartão neste atendimento.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "horario",
    "response": "*Atendimento*\n\nAs solicitações ficam registradas por aqui. O retorno pessoal de Gabriel depende da disponibilidade. Envie *HUMANO* para encaminhar sua dúvida.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "humano",
    "response": "*Atendimento humano*\n\nEncaminhei esta conversa para Gabriel. Pode explicar o que precisa ou enviar referências e arquivos. O assistente ficará em silêncio para não interromper o atendimento.\n\nDigite *MENU* se quiser reiniciar o atendimento automático.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "recebido",
    "response": "*Solicitação registrada!*\n\nObrigado pelas informações. Gabriel recebeu uma notificação para analisar seu pedido e responder pessoalmente.\n\nSe necessário, envie mais referências nesta conversa. Para voltar ao início, digite *MENU*.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "complemento",
    "response": "Pode enviar em uma mensagem seu nome, empresa e uma descrição do serviço desejado? Isso ajuda a preparar uma proposta.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "optout",
    "response": "Respostas automáticas desativadas nesta conversa. Para voltar a usá-las, digite *INICIAR*.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  }
];
const labels=[
  {
    "name": "Novo lead",
    "color": 6,
    "colorHex": "#9400D3"
  },
  {
    "name": "Sites e landing pages",
    "color": 4,
    "colorHex": "#0000FF"
  },
  {
    "name": "Design e social media",
    "color": 7,
    "colorHex": "#FF1493"
  },
  {
    "name": "Sistemas e automações",
    "color": 5,
    "colorHex": "#4B0082"
  },
  {
    "name": "Placas NFC",
    "color": 8,
    "colorHex": "#00CED1"
  },
  {
    "name": "Outros serviços",
    "color": 13,
    "colorHex": "#2F4F4F"
  },
  {
    "name": "Aguardando cliente",
    "color": 10,
    "colorHex": "#FFD700"
  },
  {
    "name": "Orçamento solicitado",
    "color": 3,
    "colorHex": "#00FF00"
  },
  {
    "name": "Atendimento humano",
    "color": 0,
    "colorHex": "#FF0000"
  },
  {
    "name": "Concluído",
    "color": 14,
    "colorHex": "#696969"
  }
];
async function main(){
  const sid=process.env.OGT_CUSTOMER_SESSION_ID;
  if(!sid){console.log("[CustomerSetup] Session not configured.");return;}
  const session=await prisma.session.findUnique({where:{sessionId:sid},include:{botConfig:true}});
  if(!session){console.log("[CustomerSetup] Session not found.");return;}
  const enabled=process.env.OGT_AUTO_REPLY_ENABLED==="true";
  const prev=session.config&&typeof session.config==="object"&&!Array.isArray(session.config)?session.config:{};
  const versionChanged=prev.ogtCustomerServiceVersion!==VERSION;
  await prisma.botConfig.upsert({
    where:{sessionId:session.id},
    create:{sessionId:session.id,enabled,botName:"ogabrieltechIA",botMode:"OWNER",autoReplyMode:"ALL",autoRead:false,alwaysOnline:false,enableSticker:false,enableVideoSticker:false,enablePing:false,enableUptime:false},
    update:{botName:"ogabrieltechIA",botMode:"OWNER",autoReplyMode:"ALL",autoRead:false,alwaysOnline:false,enableSticker:false,enableVideoSticker:false,enablePing:false,...(versionChanged?{enabled}:{})}
  });
  if(!versionChanged){console.log("[CustomerSetup] Existing flow retained; manual edits preserved. Enabled default: "+enabled);return;}
  for(const rule of rules){
    const found=await prisma.autoReply.findFirst({where:{sessionId:session.id,keyword:rule.keyword,triggerType:"PRIVATE"}});
    if(found)await prisma.autoReply.update({where:{id:found.id},data:{response:rule.response,matchType:"EXACT",triggerType:"PRIVATE",isMedia:false,mediaUrl:null,mediaType:null}});
    else await prisma.autoReply.create({data:{sessionId:session.id,...rule}});
  }
  for(const label of labels) await prisma.label.upsert({where:{sessionId_name:{sessionId:sid,name:label.name}},create:{sessionId:sid,...label},update:{}});
  await prisma.session.update({where:{sessionId:sid},data:{config:{...prev,ogtCustomerServiceVersion:VERSION}}});
  console.log("[CustomerSetup] GENERAL FLOW READY: "+rules.length+" templates, "+labels.length+" labels; auto response "+(enabled?"ENABLED":"PAUSED"));
}
main().catch(e=>{console.error("[CustomerSetup]",e);process.exitCode=1}).finally(async()=>prisma.$disconnect());
