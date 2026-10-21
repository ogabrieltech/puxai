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
// The rate limits below reduce accidental reply floods; they do not bypass WhatsApp enforcement.
const MAX_REPLIES_PER_CHAT_HOUR=10;
const MAX_REPLIES_TOTAL_HOUR=80;
const MIN_REPLY_GAP_MS=3500;
const replyBudgets=new Map<string,{started:number,count:number,lastSent:number}>();
const sentByBot=new Map<string,number>();
function allowReply(jid:string,isPriority:boolean):boolean{
  if(isPriority)return true; // Explicit requests to stop or speak to a person must be honored.
  const now=Date.now();
  const allowed=(key:string,limit:number):boolean=>{
    const previous=replyBudgets.get(key);
    const state=previous&&now-previous.started<3600000?previous:{started:now,count:0,lastSent:0};
    if(state.count>=limit || (key!=="GLOBAL"&&now-state.lastSent<MIN_REPLY_GAP_MS))return false;
    state.count++;state.lastSent=now;replyBudgets.set(key,state);return true;
  };
  const chatKey="CHAT:"+jid;
  const current=replyBudgets.get(chatKey);
  const global=replyBudgets.get("GLOBAL");
  if(current&&now-current.started<3600000&&(current.count>=MAX_REPLIES_PER_CHAT_HOUR||now-current.lastSent<MIN_REPLY_GAP_MS))return false;
  if(global&&now-global.started<3600000&&global.count>=MAX_REPLIES_TOTAL_HOUR)return false;
  return allowed(chatKey,MAX_REPLIES_PER_CHAT_HOUR)&&allowed("GLOBAL",MAX_REPLIES_TOTAL_HOUR);
}
async function sendTemplate(sock:WASocket,dbId:string,jid:string,key:string):Promise<void>{
  const r=await prisma.autoReply.findFirst({where:{sessionId:dbId,keyword:key,triggerType:"PRIVATE"},select:{response:true}});
  if(!r?.response){logger.error("CustomerService","Missing template "+key);return;}
  if(!allowReply(jid,key==="optout"||key==="humano")){
    logger.warn("CustomerService","Reply limit reached; no automated message sent");
    return;
  }
  const result=await sock.sendMessage(jid,{text:r.response});
  if(result?.key?.id)sentByBot.set(jid+":"+result.key.id,Date.now());
  if(sentByBot.size>500)for(const [k,v] of sentByBot)if(Date.now()-v>3600000)sentByBot.delete(k);
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
        if(!jid||jid.endsWith("@g.us")||jid.endsWith("@broadcast")||jid==="status@broadcast")continue;
        if(msg.key.fromMe){
          if(msg.key.id&&sentByBot.has(jid+":"+msg.key.id))continue;
          const previous=await prisma.customerLead.findUnique({where:{sessionId_chatJid:{sessionId:session.id,chatJid:jid}}});
          if(previous && previous.stage!=="OPT_OUT" && previous.stage!=="HUMAN"){
            await prisma.customerLead.update({where:{id:previous.id},data:{stage:"HUMAN",lastInteractionAt:new Date()}});
            logger.info("CustomerService","Manual outgoing reply detected; automation handed off to human");
          }
          continue;
        }
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
          if(stop){
            if(lead.stage!=="OPT_OUT"){await update("OPT_OUT");await sendTemplate(sock,session.id,jid,"optout");}
            continue;
          }
          // Opted-out contacts can only reactivate using an explicit INICIAR/REATIVAR command.
          if(lead.stage==="OPT_OUT"&&!["iniciar","reativar"].includes(v))continue;
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
