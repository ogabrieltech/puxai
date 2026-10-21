"use server";
import { auth } from "@/lib/auth";
import { getAccessibleSessions } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ChatService } from "@/modules/whatsapp/chat.service";

const stages=["NEW","CONTACTED","QUALIFIED","PROPOSAL","NEGOTIATION","WON","LOST"] as const;
const sources=["MANUAL","WHATSAPP","INSTAGRAM","WEBSITE","REFERRAL","OTHER"] as const;
function field(form:FormData,key:string,max=255):string{
  return String(form.get(key)??"").trim().slice(0,max);
}
function dateValue(v:string):Date|null{
  if(!v)return null;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(v))throw new Error("Data inválida.");
  const d=new Date(v+"T12:00:00Z");
  if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==v)throw new Error("Data inválida.");
  return d;
}
function valueMoney(v:string):number|null{
  if(!v)return null;
  const n=Number(v);
  if(!Number.isFinite(n)||n<0||n>100000000)throw new Error("Valor inválido.");
  return Math.round(n*100)/100;
}
function phoneValue(raw:string):string{
  let n=raw.replace(/\D/g,"");
  // Explicit +country numbers are already international; local Brazilian numbers receive +55.
  if(!raw.trim().startsWith("+")&&(n.length===10||n.length===11))n="55"+n;
  if(!/^\d{11,15}$/.test(n))throw new Error("Informe um telefone com DDD e código do país.");
  return n;
}
async function crmAuth(){
  const user=await auth();
  if(!user?.user?.id)throw new Error("Faça login novamente.");
  const sessions=await getAccessibleSessions(user.user.id,user.user.role||"OWNER");
  return {userId:user.user.id,sessionIds:sessions.map(s=>s.id),sessions};
}
async function ensureLead(leadId:string){
  const ctx=await crmAuth();
  if(!ctx.sessionIds.length)throw new Error("Nenhuma sessão autorizada.");
  const lead=await prisma.customerLead.findFirst({where:{id:leadId,sessionId:{in:ctx.sessionIds}}});
  if(!lead)throw new Error("Contato não encontrado ou sem permissão.");
  return {...ctx,lead};
}
function refresh(leadId?:string){
  revalidatePath("/dashboard/crm");
  revalidatePath("/dashboard");
  if(leadId)revalidatePath("/dashboard/crm/"+leadId);
}
export async function createCrmLead(form:FormData):Promise<void>{
  const ctx=await crmAuth();
  const sessionId=field(form,"sessionId");
  if(!ctx.sessionIds.includes(sessionId))throw new Error("Sessão inválida.");
  const phone=phoneValue(field(form,"phone",40));
  const name=field(form,"name",120);
  if(name.length<2)throw new Error("Informe o nome do contato.");
  const company=field(form,"company",120);
  const email=field(form,"email",180);
  if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("E-mail inválido.");
  const source=field(form,"source");
  const leadSource=sources.includes(source as typeof sources[number])?source:"MANUAL";
  const evidence=field(form,"consentEvidence",1000);
  const requestedConsent=form.get("contactConsent")==="on";
  if(requestedConsent&&evidence.length<5)throw new Error("Registre como o contato autorizou a abordagem.");
  const hasConsent=requestedConsent;
  const chatJid=phone+"@s.whatsapp.net";
  const existing=await prisma.customerLead.findUnique({where:{sessionId_chatJid:{sessionId,chatJid}}});
  if(existing)redirect("/dashboard/crm/"+existing.id);
  const lead=await prisma.customerLead.create({data:{
    sessionId,chatJid,name,phone,company:company||null,email:email||null,leadSource,
    contactConsent:hasConsent,consentEvidence:hasConsent?evidence:null,
    consentCapturedAt:hasConsent?new Date():null,
    dealValue:valueMoney(field(form,"dealValue",32)),dealStage:"NEW"
  }});
  await prisma.crmActivity.create({data:{sessionId,leadId:lead.id,userId:ctx.userId,kind:"CREATED",content:"Contato cadastrado manualmente."}});
  refresh(lead.id);
  redirect("/dashboard/crm/"+lead.id);
}
export async function updateCrmLead(form:FormData):Promise<void>{
  const id=field(form,"leadId");
  const {lead,userId}=await ensureLead(id);
  const name=field(form,"name",120);
  if(name.length<2)throw new Error("Nome inválido.");
  const email=field(form,"email",180);
  if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error("E-mail inválido.");
  const nextStage=field(form,"dealStage");
  if(!stages.includes(nextStage as typeof stages[number]))throw new Error("Etapa comercial inválida.");
  const evidence=field(form,"consentEvidence",1000);
  const requestedConsent=form.get("contactConsent")==="on";
  if(requestedConsent&&evidence.length<5&&lead.stage!=="OPT_OUT")throw new Error("Registre a origem da autorização.");
  const consent=requestedConsent&&evidence.length>=5&&lead.stage!=="OPT_OUT";
  // A CRM change never modifies the automation stage, and never bypasses OPT_OUT.
  const notes=field(form,"notes",4000);
  await prisma.customerLead.update({where:{id},data:{
    name,company:field(form,"company",120)||null,email:email||null,
    notes:notes||null,dealStage:nextStage,dealValue:valueMoney(field(form,"dealValue",32)),
    nextFollowUpAt:dateValue(field(form,"nextFollowUpAt",10)),
    contactConsent:consent,consentEvidence:consent?evidence:null,
    consentCapturedAt:consent?(lead.contactConsent?lead.consentCapturedAt:new Date()):null
  }});
  if(lead.dealStage!==nextStage)await prisma.crmActivity.create({data:{
    sessionId:lead.sessionId,leadId:id,userId,kind:"STAGE",
    content:"Etapa alterada para "+nextStage
  }});
  refresh(id);
}
export async function addCrmNote(form:FormData):Promise<void>{
  const id=field(form,"leadId");
  const {lead,userId}=await ensureLead(id);
  const note=field(form,"note",2000);
  if(note.length<2)throw new Error("A nota está vazia.");
  await prisma.crmActivity.create({data:{sessionId:lead.sessionId,leadId:id,userId,kind:"NOTE",content:note}});
  refresh(id);
}
export async function createCrmTask(form:FormData):Promise<void>{
  const id=field(form,"leadId");
  const {lead,userId}=await ensureLead(id);
  const title=field(form,"title",200);
  if(title.length<3)throw new Error("Informe uma tarefa.");
  const dueAt=dateValue(field(form,"dueAt",10));
  await prisma.crmTask.create({data:{sessionId:lead.sessionId,leadId:id,title,dueAt}});
  await prisma.crmActivity.create({data:{sessionId:lead.sessionId,leadId:id,userId,kind:"TASK",content:"Tarefa criada: "+title}});
  refresh(id);
}
export async function toggleCrmTask(form:FormData):Promise<void>{
  const leadId=field(form,"leadId");
  const taskId=field(form,"taskId");
  const {lead}=await ensureLead(leadId);
  const task=await prisma.crmTask.findFirst({where:{id:taskId,leadId,sessionId:lead.sessionId}});
  if(!task)throw new Error("Tarefa não encontrada.");
  await prisma.crmTask.update({where:{id:task.id},data:{done:!task.done}});
  refresh(leadId);
}
export async function importWhatsAppContacts(form:FormData):Promise<void>{
  const ctx=await crmAuth();
  const sessionId=field(form,"sessionId");
  if(!ctx.sessionIds.includes(sessionId))throw new Error("Sessão inválida.");
  const contacts=await prisma.contact.findMany({where:{sessionId},take:500,orderBy:{createdAt:"desc"},
    select:{jid:true,remoteJidAlt:true,name:true,notify:true,verifiedName:true}});
  const rows:{sessionId:string;chatJid:string;phone:string;name:string|null;leadSource:string;contactConsent:boolean}[]=[];
  for(const contact of contacts){
    const candidate=[contact.jid,contact.remoteJidAlt].find(j=>j?.endsWith("@s.whatsapp.net"));
    if(!candidate)continue;
    const phone=candidate.replace("@s.whatsapp.net","");
    if(!/^\d{11,15}$/.test(phone))continue;
    rows.push({sessionId,chatJid:phone+"@s.whatsapp.net",phone,
      name:(contact.name||contact.verifiedName||contact.notify||"Contato sem nome").slice(0,120),
      leadSource:"WHATSAPP",contactConsent:false});
  }
  if(rows.length)await prisma.customerLead.createMany({data:rows,skipDuplicates:true});
  refresh();
}


export async function sendCrmMessage(form:FormData):Promise<void>{
  const ctx=await crmAuth();
  const leadId=field(form,"leadId",100);
  const message=field(form,"message",1400);
  const confirmation=field(form,"confirmSend");
  if(confirmation!=="yes")throw new Error("Confirme o envio manual desta mensagem.");
  if(message.length<2)throw new Error("Digite uma mensagem.");
  const lead=await prisma.customerLead.findFirst({
    where:{id:leadId,sessionId:{in:ctx.sessionIds}}
  });
  if(!lead)throw new Error("Contato não encontrado.");
  if(lead.stage==="OPT_OUT")throw new Error("Contato pediu PARAR. O envio não será realizado.");
  if(!lead.contactConsent||!lead.consentEvidence)
    throw new Error("Registre a autorização do cliente antes de iniciar contato.");
  const linkedSession=ctx.sessions.find(s=>s.id===lead.sessionId);
  if(!linkedSession||linkedSession.status!=="CONNECTED")
    throw new Error("O WhatsApp selecionado não está conectado.");
  const phone=lead.phone||lead.chatJid.replace("@s.whatsapp.net","");
  if(!/^\d{11,15}$/.test(phone))throw new Error("Telefone não é um número válido.");
  // Only an explicit, single human-submitted request reaches the WhatsApp transport.
  const result=await ChatService.sendTextMessage(
    linkedSession.sessionId,phone+"@s.whatsapp.net",{text:message}
  );
  if(!result)throw new Error("O servidor do WhatsApp não confirmou o envio.");
  await prisma.crmActivity.create({data:{
    sessionId:lead.sessionId,leadId:lead.id,userId:ctx.userId,kind:"MESSAGE",
    content:"Mensagem manual enviada pelo CRM: "+message.slice(0,900)
  }});
  // An outgoing manual CRM message hands the conversation to a human.
  if(lead.stage!=="HUMAN")await prisma.customerLead.update({
    where:{id:lead.id},data:{stage:"HUMAN",lastInteractionAt:new Date()}
  });
  refresh(lead.id);
  redirect("/dashboard/crm/"+lead.id+"?sent=1");
}

export async function createAndSendCrmMessage(form:FormData):Promise<void>{
  const ctx=await crmAuth();
  const sessionId=field(form,"sessionId");
  if(!ctx.sessionIds.includes(sessionId))throw new Error("Sessão inválida.");
  const phone=phoneValue(field(form,"phone",40));
  const name=field(form,"name",120);
  const text=field(form,"message",1400);
  const evidence=field(form,"consentEvidence",1000);
  if(name.length<2)throw new Error("Informe o nome do contato.");
  if(text.length<2)throw new Error("Digite a mensagem.");
  if(form.get("confirmSend")!=="yes"||form.get("contactConsent")!=="on"||evidence.length<5)
    throw new Error("Confirme o envio individual e registre a autorização do destinatário.");
  const session=ctx.sessions.find(s=>s.id===sessionId);
  if(!session||session.status!=="CONNECTED")throw new Error("WhatsApp desconectado.");
  const jid=phone+"@s.whatsapp.net";
  const existing=await prisma.customerLead.findUnique({
    where:{sessionId_chatJid:{sessionId,chatJid:jid}}
  });
  if(existing?.stage==="OPT_OUT")throw new Error("Contato pediu PARAR e não pode receber abordagem.");
  // Existing opt-outs and consent records must not be overwritten by an unverified form.
  if(existing&&!existing.contactConsent)
    throw new Error("Contato já cadastrado sem autorização. Revise sua ficha e registre a permissão antes.");
  if(existing?.contactConsent&&!existing.consentEvidence)
    throw new Error("O cadastro não possui evidência de autorização.");
  const lead=existing||await prisma.customerLead.create({data:{
    sessionId,chatJid:jid,name,phone,leadSource:"MANUAL",
    stage:"HUMAN",dealStage:"CONTACTED",
    contactConsent:true,consentEvidence:evidence,consentCapturedAt:new Date()
  }});
  const result=await ChatService.sendTextMessage(session.sessionId,jid,{text});
  if(!result)throw new Error("O servidor WhatsApp não confirmou o envio.");
  await prisma.crmActivity.create({data:{sessionId,leadId:lead.id,userId:ctx.userId,
    kind:"MESSAGE",content:"Mensagem manual enviada pelo CRM: "+text.slice(0,900)}});
  if(lead.stage!=="HUMAN")await prisma.customerLead.update({
    where:{id:lead.id},data:{stage:"HUMAN",lastInteractionAt:new Date()}
  });
  refresh(lead.id);
  redirect("/dashboard/crm/"+lead.id+"?sent=1");
}
