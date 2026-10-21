const {PrismaClient}=require("@prisma/client");
const prisma=new PrismaClient();
const VERSION=5;
const rules=[
  {
    "keyword": "menu",
    "response": "*ELFIG | Creative & Technology*\n\nOlá! Este é o atendimento digital da ELFIG.\n\nEm qual área podemos ajudar?\n\n*1* — Sites e landing pages\n*2* — Marketing digital\n*3* — Branding e design\n*4* — Sistemas personalizados\n*5* — Automações e integrações\n*6* — Suporte e consultoria de TI\n*7* — Falar com um especialista\n\nResponda com o número da opção. Para voltar, digite *MENU*. Para parar as respostas automáticas, digite *PARAR*.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "sites",
    "response": "*Sites e landing pages*\n\nPara prepararmos uma proposta, envie:\n1. Nome e empresa\n2. Tipo de site desejado\n3. Objetivo principal\n4. Referências, se tiver\n5. Prazo desejado\n\nNossa equipe analisará seu projeto. Digite *7* para atendimento humano.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "marketing",
    "response": "*Marketing digital*\n\nConte para a ELFIG:\n1. Nome da empresa e segmento\n2. Objetivo principal (atrair clientes, campanhas, redes sociais etc.)\n3. Canais utilizados atualmente\n4. Necessidade mais urgente\n\nNossa equipe avaliará a melhor abordagem.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "branding",
    "response": "*Branding e design*\n\nPara começarmos, informe:\n1. Nome da marca\n2. O que precisa criar ou reformular\n3. Referências visuais, se tiver\n4. Prazo desejado\n\nEnviaremos orientações e uma proposta adequada.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "sistemas",
    "response": "*Sistemas personalizados*\n\nPara compreender a necessidade da sua empresa:\n1. Nome da empresa\n2. Problema ou processo a resolver\n3. Quem utilizará o sistema\n4. Ferramentas existentes\n5. Prazo desejado\n\nA equipe técnica analisará os requisitos.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "automacao",
    "response": "*Automações e integrações*\n\nCompartilhe:\n1. Nome e empresa\n2. Processo que deseja automatizar\n3. Ferramentas que já utiliza\n4. Resultado esperado\n5. Prazo desejado\n\nA ELFIG avaliará a solução mais adequada.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "suporte",
    "response": "*Suporte e consultoria de TI*\n\nInforme:\n1. Nome e empresa\n2. Tipo de equipamento, sistema ou rede\n3. Problema encontrado\n4. Se o atendimento deve ser remoto ou presencial\n5. Urgência\n\nNossa equipe verificará a disponibilidade.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "outros",
    "response": "*Outros serviços*\n\nDescreva sua necessidade, empresa e prazo. Nossa equipe verificará como ajudar.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "precos",
    "response": "*Solicitar orçamento*\n\nOs valores dependem do escopo. Escolha a categoria no *MENU* e envie uma descrição para prepararmos uma proposta.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "prazo",
    "response": "*Prazos de entrega*\n\nO prazo é confirmado após uma avaliação do projeto. Para começar, digite *MENU*.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "portfolio",
    "response": "*Portfólio ELFIG*\n\nConheça nossa atuação em branding, websites, sistemas e automações. Nossa equipe pode encaminhar referências de trabalhos relevantes. Digite *7* para falar com um especialista.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "pagamento",
    "response": "*Pagamento*\n\nAs condições são informadas na proposta comercial. Não envie senhas nem dados completos de cartão por esta conversa.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "horario",
    "response": "*Horário de atendimento*\n\nSua mensagem fica registrada e será analisada pela equipe conforme a disponibilidade. Para atendimento humano, digite *7*.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "humano",
    "response": "*Atendimento humano solicitado*\n\nEncaminhamos seu contato à equipe ELFIG. Pode enviar mais informações e arquivos enquanto aguarda. O atendimento automático ficará em silêncio nesta conversa.\n\nDigite *MENU* quando quiser iniciar um novo atendimento automatizado.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "recebido",
    "response": "*Recebemos sua solicitação!*\n\nObrigado pelo briefing. Nossa equipe foi notificada para avaliar seu projeto e entrar em contato.\n\nVocê pode complementar as informações nesta conversa. Para voltar ao início, digite *MENU*.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "complemento",
    "response": "Por favor, envie seu nome, empresa e uma breve descrição do que precisa, para ajudarmos na análise.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  },
  {
    "keyword": "optout",
    "response": "As respostas automáticas foram desativadas nesta conversa. Para reativar, digite *INICIAR*.",
    "matchType": "EXACT",
    "triggerType": "PRIVATE",
    "isMedia": false
  }
];
const labels=[
  {
    "name": "Novo lead",
    "color": 6,
    "colorHex": "#22D37F"
  },
  {
    "name": "Sites e landing pages",
    "color": 4,
    "colorHex": "#0B1F3B"
  },
  {
    "name": "Marketing digital",
    "color": 7,
    "colorHex": "#087F8C"
  },
  {
    "name": "Branding e design",
    "color": 5,
    "colorHex": "#8B5CF6"
  },
  {
    "name": "Sistemas personalizados",
    "color": 8,
    "colorHex": "#2563EB"
  },
  {
    "name": "Automações e integrações",
    "color": 10,
    "colorHex": "#0D9488"
  },
  {
    "name": "Suporte de TI",
    "color": 3,
    "colorHex": "#475569"
  },
  {
    "name": "Outros serviços",
    "color": 13,
    "colorHex": "#64748B"
  },
  {
    "name": "Aguardando cliente",
    "color": 10,
    "colorHex": "#F59E0B"
  },
  {
    "name": "Orçamento solicitado",
    "color": 3,
    "colorHex": "#16A34A"
  },
  {
    "name": "Atendimento humano",
    "color": 0,
    "colorHex": "#DC2626"
  },
  {
    "name": "Concluído",
    "color": 14,
    "colorHex": "#6B7280"
  }
];
async function main(){
  const sid=process.env.OGT_CUSTOMER_SESSION_ID;
  if(!sid){console.log("[CustomerSetup] Session not configured.");return;}
  const session=await prisma.session.findUnique({where:{sessionId:sid},include:{botConfig:true}});
  if(!session){console.log("[CustomerSetup] Session not found.");return;}
  const enabled=process.env.OGT_AUTO_REPLY_ENABLED==="true";
  const prev=session.config&&typeof session.config==="object"&&!Array.isArray(session.config)?session.config:{};
  const versionChanged=prev.elfigCustomerServiceVersion!==VERSION;
  await prisma.botConfig.upsert({
    where:{sessionId:session.id},
    create:{sessionId:session.id,enabled,botName:"ELFIG",botMode:"OWNER",autoReplyMode:"ALL",autoRead:false,alwaysOnline:false,enableSticker:false,enableVideoSticker:false,enablePing:false,enableUptime:false},
    update:{botName:"ELFIG",botMode:"OWNER",autoReplyMode:"ALL",autoRead:false,alwaysOnline:false,enableSticker:false,enableVideoSticker:false,enablePing:false,...(versionChanged?{enabled}:{})}
  });
  if(!versionChanged){console.log("[CustomerSetup] Existing flow retained; manual edits preserved. Enabled default: "+enabled);return;}
  for(const rule of rules){
    const found=await prisma.autoReply.findFirst({where:{sessionId:session.id,keyword:rule.keyword,triggerType:"PRIVATE"}});
    if(found)await prisma.autoReply.update({where:{id:found.id},data:{response:rule.response,matchType:"EXACT",triggerType:"PRIVATE",isMedia:false,mediaUrl:null,mediaType:null}});
    else await prisma.autoReply.create({data:{sessionId:session.id,...rule}});
  }
  for(const label of labels) await prisma.label.upsert({where:{sessionId_name:{sessionId:sid,name:label.name}},create:{sessionId:sid,...label},update:{}});
  await prisma.session.update({where:{sessionId:sid},data:{config:{...prev,elfigCustomerServiceVersion:VERSION}}});
  console.log("[CustomerSetup] ELFIG FLOW READY: "+rules.length+" templates, "+labels.length+" labels; auto response "+(enabled?"ENABLED":"PAUSED"));
}
main().catch(e=>{console.error("[CustomerSetup]",e);process.exitCode=1}).finally(async()=>prisma.$disconnect());
