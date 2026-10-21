import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAccessibleSessions } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, Clock3, MessageCircle, StickyNote } from "lucide-react";
import { addCrmNote, createCrmTask, toggleCrmTask, updateCrmLead, sendCrmMessage } from "../actions";

export const dynamic="force-dynamic";
const stages=[
 {id:"NEW",label:"Novo contato"},
 {id:"CONTACTED",label:"Em contato"},
 {id:"QUALIFIED",label:"Qualificado"},
 {id:"PROPOSAL",label:"Proposta enviada"},
 {id:"NEGOTIATION",label:"Negociação"},
 {id:"WON",label:"Fechado"},
 {id:"LOST",label:"Perdido"}
];
function dateInput(v:Date|null){return v?v.toISOString().slice(0,10):"";}
function ptDate(d:Date|null){return d?d.toLocaleDateString("pt-BR",{timeZone:"UTC"}):"Sem data";}
export default async function CrmLeadPage({params}:{params:Promise<{id:string}>}){
  const session=await auth();
  if(!session?.user?.id)redirect("/auth/login");
  const {id}=await params;
  const sessions=await getAccessibleSessions(session.user.id,session.user.role||"OWNER");
  const ids=sessions.map(s=>s.id);
  if(!ids.length)notFound();
  const lead=await prisma.customerLead.findFirst({where:{id,sessionId:{in:ids}}});
  if(!lead)notFound();
  const [activities,tasks]=await Promise.all([
    prisma.crmActivity.findMany({where:{leadId:id,sessionId:lead.sessionId},orderBy:{createdAt:"desc"},take:40}),
    prisma.crmTask.findMany({where:{leadId:id,sessionId:lead.sessionId},orderBy:[{done:"asc"},{dueAt:"asc"}],take:50})
  ]);
  const phone=lead.phone||(/^\d{11,15}@s\.whatsapp\.net$/.test(lead.chatJid)?lead.chatJid.split("@")[0]:"");
  const canInitiate=Boolean(phone&&lead.contactConsent&&lead.stage!=="OPT_OUT");
  const url=canInitiate?"https://wa.me/"+phone+"?text="+encodeURIComponent("Olá! Aqui é da ELFIG, tudo bem?"):null;
  const consentBlocked=lead.stage==="OPT_OUT";
  return <div className="mx-auto max-w-[1330px] space-y-6 pb-12">
    <Link href="/dashboard/crm" className="inline-flex items-center gap-2 text-sm font-semibold text-[#557166] hover:text-[#0C825B]"><ArrowLeft size={15}/> Voltar ao CRM</Link>
    <header className="flex flex-wrap items-end justify-between gap-4 rounded-[24px] bg-[#0B1F3B] p-7 text-white sm:p-9">
      <div>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#22D37F]">ELFIG / Ficha do cliente</p>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{lead.name||lead.phone||"Contato do WhatsApp"}</h1>
        <p className="mt-3 text-sm text-[#ACBDD0]">{lead.company||"Empresa não informada"} · {phone||"Número não disponível"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/chat" className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10">Conversas <MessageCircle size={15}/></Link>
        {url?<a href={url} rel="noopener noreferrer" target="_blank" className="inline-flex items-center gap-2 rounded-xl bg-[#22D37F] px-4 py-3 text-sm font-bold text-[#0B1F3B] hover:bg-[#4FE99B]">Abrir WhatsApp <ArrowUpRight size={15}/></a>:null}
      </div>
    </header>
    {!canInitiate&&<div className="rounded-xl border border-[#F2DDC3] bg-[#FFF8EB] p-4 text-sm leading-6 text-[#805727]">
      {consentBlocked?"O contato optou por não receber respostas automáticas. Não faça novas abordagens comerciais até haver uma nova autorização documentada.":"A opção de iniciar uma conversa comercial permanece indisponível enquanto não existir uma autorização registrada para esse contato. Você ainda pode responder solicitações recebidas na área Conversas."}
    </div>}
    {canInitiate&&<section className="rounded-2xl border border-[#DCE9E2] bg-white p-6">
      <div className="flex items-center gap-2"><MessageCircle size={18} className="text-[#0B9869]"/><h2 className="text-lg font-semibold text-[#0B1F3B]">Enviar mensagem pelo CRM</h2></div>
      <p className="mt-2 text-xs leading-6 text-[#6A7B86]">Envio direto e individual pela sessão conectada. Não é necessário abrir o WhatsApp Web.</p>
      <form action={sendCrmMessage} className="mt-4 space-y-3">
        <input type="hidden" name="leadId" value={lead.id}/>
        <input type="hidden" name="confirmSend" value="yes"/>
        <textarea name="message" required minLength={2} maxLength={1400} rows={3} placeholder="Escreva sua mensagem para este cliente..." className="w-full rounded-xl border border-[#D6E3DB] p-3 text-sm leading-6"/>
        <button className="rounded-xl bg-[#22D37F] px-5 py-3 text-sm font-bold text-[#0B1F3B] hover:bg-[#50E99A]">Enviar mensagem agora</button>
      </form>
      <p className="mt-3 text-xs text-[#81928B]">Confirme o destinatário antes de enviar. O histórico comercial será atualizado.</p>
    </section>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-[#DFE9E4] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#0B1F3B]">Informações comerciais</h2>
          <p className="mt-1 text-xs text-[#708392]">A etapa comercial é independente da automação do WhatsApp.</p>
          <form action={updateCrmLead} className="mt-6 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="leadId" value={lead.id}/>
            <label className="text-xs font-semibold text-[#64778A]">Nome
              <input name="name" required maxLength={120} defaultValue={lead.name||"Contato WhatsApp"} className="mt-1 h-11 w-full rounded-lg border border-[#D8E4DF] px-3 text-sm text-[#0B1F3B]"/>
            </label>
            <label className="text-xs font-semibold text-[#64778A]">Empresa
              <input name="company" maxLength={120} defaultValue={lead.company||""} className="mt-1 h-11 w-full rounded-lg border border-[#D8E4DF] px-3 text-sm text-[#0B1F3B]"/>
            </label>
            <label className="text-xs font-semibold text-[#64778A]">E-mail
              <input name="email" type="email" maxLength={180} defaultValue={lead.email||""} className="mt-1 h-11 w-full rounded-lg border border-[#D8E4DF] px-3 text-sm text-[#0B1F3B]"/>
            </label>
            <label className="text-xs font-semibold text-[#64778A]">Valor da oportunidade (R$)
              <input name="dealValue" type="number" step="0.01" min="0" defaultValue={lead.dealValue?.toString()||""} className="mt-1 h-11 w-full rounded-lg border border-[#D8E4DF] px-3 text-sm text-[#0B1F3B]"/>
            </label>
            <label className="text-xs font-semibold text-[#64778A]">Etapa do funil
              <select name="dealStage" defaultValue={lead.dealStage} className="mt-1 h-11 w-full rounded-lg border border-[#D8E4DF] bg-white px-3 text-sm text-[#0B1F3B]">
                {stages.map(s=><option value={s.id} key={s.id}>{s.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-[#64778A]">Próximo follow-up
              <input name="nextFollowUpAt" type="date" defaultValue={dateInput(lead.nextFollowUpAt)} className="mt-1 h-11 w-full rounded-lg border border-[#D8E4DF] px-3 text-sm text-[#0B1F3B]"/>
            </label>
            <label className="sm:col-span-2 text-xs font-semibold text-[#64778A]">Observações gerais
              <textarea name="notes" rows={3} maxLength={4000} defaultValue={lead.notes||""} placeholder="Necessidades, proposta, próximos passos..." className="mt-1 w-full rounded-lg border border-[#D8E4DF] p-3 text-sm leading-6 text-[#0B1F3B]"/>
            </label>
            <div className="sm:col-span-2 space-y-3 rounded-xl border border-[#E3ECE7] bg-[#F8FBF9] p-4">
              <label className="flex items-start gap-3 text-xs leading-5 text-[#526A64]">
                <input name="contactConsent" type="checkbox" defaultChecked={lead.contactConsent&&!consentBlocked} disabled={consentBlocked} className="mt-1 accent-[#22D37F]"/>
                O contato autorizou ser abordado comercialmente pela ELFIG.
              </label>
              <label className="block text-xs font-semibold text-[#64778A]">Registro da autorização
                <textarea name="consentEvidence" rows={2} maxLength={1000} defaultValue={lead.consentEvidence||""} disabled={consentBlocked} placeholder="Como e quando autorizou o contato" className="mt-1 w-full rounded-lg border border-[#D8E4DF] bg-white p-3 text-sm"/>
              </label>
              {consentBlocked&&<p className="text-xs text-amber-700">Esse contato marcou PARAR. A ficha comercial não pode reativar o atendimento.</p>}
            </div>
            <div className="sm:col-span-2">
              <button className="rounded-xl bg-[#22D37F] px-5 py-3 text-sm font-bold text-[#0B1F3B] hover:bg-[#4DE79A]">Salvar alterações</button>
            </div>
          </form>
        </section>
        <section className="rounded-2xl border border-[#DFE9E4] bg-white p-6">
          <div className="flex items-center gap-2"><StickyNote size={18} className="text-[#0D8E66]"/><h2 className="text-lg font-semibold text-[#0B1F3B]">Histórico comercial</h2></div>
          <form action={addCrmNote} className="mt-5 space-y-3">
            <input type="hidden" name="leadId" value={lead.id}/>
            <textarea required name="note" rows={3} maxLength={2000} placeholder="Registrar ligação, reunião, proposta ou outra observação..." className="w-full rounded-xl border border-[#D8E4DF] p-3 text-sm leading-6"/>
            <button className="rounded-lg border border-[#BFD9CB] px-4 py-2 text-xs font-semibold text-[#0C7553] hover:bg-[#F1F9F4]">Adicionar nota</button>
          </form>
          <div className="mt-6 space-y-4 border-t border-[#EAF0ED] pt-5">
            {activities.length?activities.map(a=><div key={a.id} className="border-l-2 border-[#C7EDDA] pl-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#EDF8F0] px-2 py-0.5 text-[10px] font-semibold text-[#0B835D]">{a.kind}</span>
                <span className="text-[11px] text-[#8A989E]">{a.createdAt.toLocaleString("pt-BR")}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#42576A]">{a.content}</p>
            </div>):<p className="text-sm text-[#87959F]">Nenhuma atividade registrada.</p>}
          </div>
        </section>
      </div>
      <aside className="space-y-5">
        <section className="rounded-2xl border border-[#DFE9E4] bg-white p-6">
          <div className="flex items-center gap-2"><CalendarDays size={18} className="text-[#0D8E66]"/><h2 className="text-lg font-semibold text-[#0B1F3B]">Tarefas e follow-ups</h2></div>
          <form action={createCrmTask} className="mt-5 space-y-3">
            <input type="hidden" name="leadId" value={lead.id}/>
            <input name="title" required maxLength={200} placeholder="Ex.: Retornar orçamento" className="h-11 w-full rounded-xl border border-[#D8E4DF] px-3 text-sm"/>
            <label className="block text-xs font-semibold text-[#64778A]">Prazo
              <input name="dueAt" type="date" className="mt-1 h-10 w-full rounded-lg border border-[#D8E4DF] px-3 text-sm"/>
            </label>
            <button className="rounded-lg bg-[#0B1F3B] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#174061]">Criar tarefa</button>
          </form>
          <div className="mt-6 space-y-2">
            {tasks.length?tasks.map(t=><form key={t.id} action={toggleCrmTask} className="flex items-center gap-3 rounded-xl border border-[#E7EFEA] p-3">
              <input type="hidden" name="leadId" value={id}/>
              <input type="hidden" name="taskId" value={t.id}/>
              <button title={t.done?"Reabrir tarefa":"Concluir tarefa"} className={"flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border "+(t.done?"border-[#22D37F] bg-[#22D37F] text-[#0B1F3B]":"border-[#C6D6CE] text-[#70857C] hover:border-[#22D37F]")}><Check size={14}/></button>
              <div className="min-w-0">
                <p className={"break-words text-sm "+(t.done?"text-[#91A49B] line-through":"font-semibold text-[#0B1F3B]")}>{t.title}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[#81918B]"><Clock3 size={11}/> {ptDate(t.dueAt)}</p>
              </div>
            </form>):<p className="pt-4 text-sm text-[#87959F]">Nenhuma tarefa pendente.</p>}
          </div>
        </section>
        <section className="rounded-2xl bg-[#EAF7F1] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0E8761]">Dados do contato</p>
          <dl className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between gap-2"><dt className="text-[#6B8179]">Origem</dt><dd className="font-semibold text-[#0B1F3B]">{lead.leadSource}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-[#6B8179]">Status automação</dt><dd className="font-semibold text-[#0B1F3B]">{lead.stage}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-[#6B8179]">Criado em</dt><dd className="font-semibold text-[#0B1F3B]">{ptDate(lead.createdAt)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-[#6B8179]">Próximo contato</dt><dd className="font-semibold text-[#0B1F3B]">{ptDate(lead.nextFollowUpAt)}</dd></div>
          </dl>
        </section>
      </aside>
    </div>
  </div>;
}
