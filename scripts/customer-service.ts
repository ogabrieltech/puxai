import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { normalizeMessageContent } from "@whiskeysockets/baileys";
import type { WASocket } from "@whiskeysockets/baileys";

// Receptive only, never broadcasts. CRM state is stored in MySQL.
type Stage = "NEW" | "WAIT_BRIEF" | "HUMAN" | "OPT_OUT" | "DONE";
const serviceLabels: Record<string,string> = {
  sites:"Sites e landing pages",
  marketing:"Marketing digital",
  branding:"Branding e design",
  sistemas:"Sistemas personalizados",
  automacao:"Automações e integrações",
  suporte:"Suporte de TI",
  outros:"Outros serviços",
  design:"Design e social media",
  nfc:"Placas NFC"
};
function normalize(s:string):string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").trim().replace(/[!?.]+$/g,"");
}
function service(s:string):string|null {
  if(["1","site","sites","website","landing","landing page","lp","ecommerce","e-commerce"].includes(s))return "sites";
  if(["2","marketing","marketing digital","social media","redes sociais","trafego","trafego pago","anuncios"].includes(s))return "marketing";
  if(["3","branding","marca","identidade visual","design","artes","arte","posts"].includes(s))return "branding";
  if(["4","sistemas","sistema","software","desenvolvimento de sistemas","aplicativo","app"].includes(s))return "sistemas";
  if(["5","automacao","automacoes","integracao","integracoes","bot","chatbot","ia"].includes(s))return "automacao";
  if(["6","suporte","ti","suporte tecnico","consultoria","manutencao","computador"].includes(s))return "suporte";
  if(["outro","outros","outros servicos","outro servico"].includes(s))return "outros";
  return null;
}
function faq(s:string):string|null {
  if(["preco","precos","valor","valores","orcamento","quanto custa","cotacao"].includes(s))return "precos";
  if(["prazo","prazos","entrega"].includes(s))return "prazo";
  if(["portfolio","projetos","exemplos","trabalhos"].includes(s))return "portfolio";
  if(["pagamento","parcelamento","pix"].includes(s))return "pagamento";
  if(["horario","horarios","funcionamento"].includes(s))return "horario";
  return null;
}
async function sendTemplate(sock:WASocket,dbId:string,jid:string,key:string):Promise<void>{
  const r=await prisma.autoReply.findFirst({where:{sessionId:dbId,keyword:key,triggerType:"PRIVATE"},select:{response:true}});
  if(!r?.response){logger.error("CustomerService","Missing template "+key);return;}
  await sock.sendMessage(jid,{text:r.response});
  logger.info("CustomerService","Sent template "+key+" for session "+process.env.OGT_CUSTOMER_SESSION_ID);
}
async function setLabels(sid:string,jid:string,add:string[],remove:string[]=[]):Promise<void>{
  const xs=await prisma.label.findMany({where:{sessionId:sid,name:{in:[...add,...remove]}},select:{id:true,name:true}});
  for(const x of xs){
    if(add.includes(x.name)) await prisma.chatLabel.upsert({where:{labelId_chatJid:{labelId:x.id,chatJid:jid}},create:{labelId:x.id,chatJid:jid},update:{}});
    if(remove.includes(x.name)) await prisma.chatLabel.deleteMany({where:{labelId:x.id,chatJid:jid}});
  }
}
async function notify(userId:string,jid:string,title:string):Promise<void>{
  await prisma.notification.create({data:{userId,title,message:"Uma conversa requer atendimento pessoal. Confira as mensagens recebidas.",href:"/dashboard/chat/"+encodeURIComponent(jid)}});
}
const reminders=new Set<string>();
function registerReminders(sid:string,dbId:string,userId:string):void{
  if(reminders.has(sid))return;
  reminders.add(sid);
  const run=async()=>{
    const cutoff=new Date(Date.now()-24*60*60*1000);
    const list=await prisma.customerLead.findMany({where:{sessionId:dbId,stage:"HUMAN",lastInteractionAt:{lt:cutoff},
      OR:[{lastReminderAt:null},{lastReminderAt:{lt:cutoff}}]},take:20,orderBy:{lastInteractionAt:"asc"}});
    const done=await prisma.label.findUnique({where:{sessionId_name:{sessionId:sid,name:"Concluído"}}});
    for(const lead of list){
      if(done){
        const has=await prisma.chatLabel.findUnique({where:{labelId_chatJid:{labelId:done.id,chatJid:lead.chatJid}}});
        if(has){await prisma.customerLead.update({where:{id:lead.id},data:{stage:"DONE"}});continue;}
      }
      await notify(userId,lead.chatJid,"Atendimento pendente há 24 horas");
      await prisma.customerLead.update({where:{id:lead.id},data:{lastReminderAt:new Date()}});
    }
  };
  setInterval(()=>{run().catch(e=>logger.error("CustomerService","Reminder check failed",e));},3*60*60*1000);
}
export function bindCustomerService(sock:WASocket,sid:string):void{
  if(sid!==process.env.OGT_CUSTOMER_SESSION_ID)return;
  sock.ev.on("messages.upsert",async({messages,type})=>{
    if(type!=="notify")return;
    try{
      const session=await prisma.session.findUnique({where:{sessionId:sid},include:{botConfig:true}});
      if(!session?.botConfig?.enabled)return;
      registerReminders(sid,session.id,session.userId);
      for(const msg of messages){
        const jid=msg.key.remoteJid;
        if(!jid||msg.key.fromMe||jid.endsWith("@g.us")||jid.endsWith("@broadcast")||jid==="status@broadcast")continue;
        const c=normalizeMessageContent(msg.message);
        const raw=c?.conversation||c?.extendedTextMessage?.text||"";
        if(!raw||raw.length>3000)continue;
        const v=normalize(raw);
        const selection=service(v),question=faq(v);
        const menu=["menu","iniciar","reativar","opcoes","voltar ao menu"].includes(v);
        const hello=/^(oi|ola|bom dia|boa tarde|boa noite)(\b|[\s,.!?])/.test(v);
        const person=["7","humano","atendente","atendimento humano","falar com um especialista","falar com a elfig"].includes(v);
        const stop=["parar","pausar","sair","cancelar","stop"].includes(v);
        const interest=/vim pelo site|gostaria de um orcamento|quero um orcamento|quero contratar|tenho interesse/.test(v);
        const previous=await prisma.customerLead.findUnique({where:{sessionId_chatJid:{sessionId:session.id,chatJid:jid}}});
        if(previous?.lastMessageKey&&previous.lastMessageKey===msg.key.id)continue;
        if(!previous&&!selection&&!question&&!menu&&!hello&&!person&&!interest&&!stop)continue;
        const lead=previous||await prisma.customerLead.create({data:{sessionId:session.id,chatJid:jid,stage:"NEW"}});
        if(!previous)await setLabels(sid,jid,["Novo lead"]);
        const update=(stage:Stage,more:Record<string,unknown>={})=>
          prisma.customerLead.update({where:{id:lead.id},data:{stage,lastMessageKey:msg.key.id||null,lastInteractionAt:new Date(),...more}});
        try{
          if(stop){await update("OPT_OUT");await sendTemplate(sock,session.id,jid,"optout");continue;}
          if(lead.stage==="OPT_OUT"&&!menu)continue;
          if(menu){await update("NEW",{lastMenuAt:new Date()});await sendTemplate(sock,session.id,jid,"menu");continue;}
          if(lead.stage==="HUMAN"||lead.stage==="DONE")continue;
          if(person){
            await update("HUMAN");
            await setLabels(sid,jid,["Atendimento humano"],["Aguardando cliente"]);
            await notify(session.userId,jid,"Cliente pediu atendimento humano");
            await sendTemplate(sock,session.id,jid,"humano");continue;
          }
          if(selection){
            await update("WAIT_BRIEF",{service:selection});
            await setLabels(sid,jid,[serviceLabels[selection],"Aguardando cliente"],["Orçamento solicitado"]);
            await sendTemplate(sock,session.id,jid,selection);continue;
          }
          if(lead.stage==="WAIT_BRIEF"){
            if(raw.trim().length<12){await update("WAIT_BRIEF");await sendTemplate(sock,session.id,jid,"complemento");continue;}
            await update("HUMAN");
            await setLabels(sid,jid,["Orçamento solicitado","Atendimento humano"],["Aguardando cliente"]);
            await notify(session.userId,jid,"Novo orçamento para analisar");
            await sendTemplate(sock,session.id,jid,"recebido");continue;
          }
          if(question){await update("NEW");await sendTemplate(sock,session.id,jid,question);continue;}
          if(hello||interest){
            const prev=lead.lastMenuAt?new Date(lead.lastMenuAt).getTime():0;
            if(prev&&Date.now()-prev<6*60*60*1000){await update("NEW");continue;}
            await update("NEW",{lastMenuAt:new Date()});
            await sendTemplate(sock,session.id,jid,"menu");continue;
          }
        }catch(e){logger.error("CustomerService","Flow execution failed",e);}
      }
    }catch(e){logger.error("CustomerService","Inbound messages processing failed",e);}
  });
}
