import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAccessibleSessions } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ArrowUpRight, BriefcaseBusiness, CalendarClock, CircleDollarSign, ContactRound, Plus, Search, Users } from "lucide-react";
import { createCrmLead, importWhatsAppContacts } from "./actions";

export const dynamic="force-dynamic";
const stages=[
  {id:"NEW",label:"Novos"},
  {id:"CONTACTED",label:"Em contato"},
  {id:"QUALIFIED",label:"Qualificados"},
  {id:"PROPOSAL",label:"Proposta"},
  {id:"NEGOTIATION",label:"Negociação"},
  {id:"WON",label:"Fechados"},
  {id:"LOST",label:"Perdidos"}
];
const money=(v:number)=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0});
export default async function CrmPage({searchParams}:{searchParams:Promise<{q?:string;stage?:string}>}){
  const user=await auth();
  if(!user?.user?.id)redirect("/auth/login");
  const sessions=await getAccessibleSessions(user.user.id,user.user.role||"OWNER");
  const ids=sessions.map(s=>s.id);
  const filters=await searchParams;
  const q=(filters.q||"").slice(0,80).trim();
  const selected=stages.some(s=>s.id===filters.stage)?filters.stage:"ALL";
  const where:any={sessionId:{in:ids}};
  if(q)where.OR=[{name:{contains:q}},{phone:{contains:q}},{company:{contains:q}},{email:{contains:q}},{chatJid:{contains:q}}];
  if(selected!=="ALL")where.dealStage=selected;
  const [leads,total,openTasks]=ids.length?await Promise.all([
    prisma.customerLead.findMany({where,orderBy:{lastInteractionAt:"desc"},take:300,select:{
      id:true,name:true,phone:true,company:true,dealStage:true,dealValue:true,stage:true,
      contactConsent:true,lastInteractionAt:true,nextFollowUpAt:true,leadSource:true
    }}),
    prisma.customerLead.count({where:{sessionId:{in:ids}}}),
    prisma.crmTask.count({where:{sessionId:{in:ids},done:false,dueAt:{lte:new Date()}}})
  ]):[[],0,0];
  const pipelineValue=leads.filter(l=>!["WON","LOST"].includes(l.dealStage)).reduce((sum,l)=>sum+Number(l.dealValue?.toString()||"0"),0);
  const newCount=leads.filter(l=>l.dealStage==="NEW").length;
  return (
    <div className="mx-auto max-w-[1650px] space-y-7 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#0B9568]"><span className="h-px w-7 bg-[#22D37F]"/> ELFIG / Comercial</div>
          <h1 className="text-3xl font-semibold tracking-[-0.055em] text-[#0B1F3B] sm:text-4xl">CRM e oportunidades</h1>
          <p className="mt-3 text-sm text-[#647487]">Organize leads, negociações e próximos contatos sem perder o histórico.</p>
        </div>
        <Link href="/dashboard/chat" className="inline-flex items-center gap-2 rounded-xl border border-[#C7DCD2] bg-white px-4 py-3 text-sm font-semibold text-[#0B1F3B] hover:bg-[#F0F8F4]">Abrir conversas <ArrowUpRight size={15}/></Link>
      </header>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {name:"Total de leads",value:String(total),icon:Users},
          {name:"Novos (na lista)",value:String(newCount),icon:ContactRound},
          {name:"Funil em aberto (na lista)",value:money(pipelineValue),icon:CircleDollarSign},
          {name:"Tarefas vencidas",value:String(openTasks),icon:CalendarClock}
        ].map(({name,value,icon:Icon})=>(
          <div key={name} className="rounded-2xl border border-[#DCE8E3] bg-white p-5">
            <div className="flex items-center justify-between text-[#718291]"><span className="text-xs">{name}</span><Icon size={17} className="text-[#0C8B64]"/></div>
            <p className="mt-5 text-2xl font-semibold tracking-tight text-[#0B1F3B] md:text-3xl">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">
        <div className="min-w-0 space-y-5">
          <form method="GET" className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#DCE8E3] bg-white p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A99A7]"/>
              <input name="q" defaultValue={q} placeholder="Pesquisar nome, telefone, empresa..." className="h-11 w-full rounded-xl border border-[#DCE8E3] bg-[#F9FCFA] pl-10 pr-3 text-sm text-[#0B1F3B] outline-none focus:border-[#22D37F]"/>
            </div>
            <select name="stage" defaultValue={selected} aria-label="Filtrar etapa" className="h-11 rounded-xl border border-[#DCE8E3] bg-white px-3 text-sm text-[#0B1F3B]">
              <option value="ALL">Todas as etapas</option>
              {stages.map(s=><option value={s.id} key={s.id}>{s.label}</option>)}
            </select>
            <button className="h-11 rounded-xl bg-[#0B1F3B] px-5 text-sm font-semibold text-white hover:bg-[#173B56]">Filtrar</button>
          </form>
          <div className="overflow-x-auto pb-4">
            <div className="grid min-w-[1510px] grid-cols-7 gap-3">
              {stages.map(stage=>{
                const cards=leads.filter(l=>l.dealStage===stage.id);
                return <section key={stage.id} className="min-h-[340px] rounded-2xl border border-[#DFEAE5] bg-[#F2F7F4] p-2.5">
                  <div className="flex items-center justify-between px-2 py-2">
                    <h2 className="text-xs font-bold text-[#0B1F3B]">{stage.label}</h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#587568]">{cards.length}</span>
                  </div>
                  <div className="space-y-2 pt-2">
                    {cards.map(l=><Link href={"/dashboard/crm/"+l.id} key={l.id} className="block rounded-xl border border-[#E1EBE5] bg-white p-3 shadow-[0_4px_12px_rgba(11,31,59,.025)] transition hover:border-[#22D37F] hover:shadow-md">
                      <p className="line-clamp-2 text-sm font-semibold leading-5 text-[#0B1F3B]">{l.name||l.phone||"Contato WhatsApp"}</p>
                      <p className="mt-1 truncate text-xs text-[#82919B]">{l.company||l.phone||"Sem empresa informada"}</p>
                      {l.dealValue&&Number(l.dealValue)>0?<p className="mt-3 text-sm font-bold text-[#0B7955]">{money(Number(l.dealValue))}</p>:null}
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#EEF3F0] pt-2">
                        <span className="max-w-[108px] truncate text-[10px] text-[#83938D]">{l.leadSource}</span>
                        <span className={"h-2 w-2 rounded-full "+(l.stage==="OPT_OUT"?"bg-red-400":l.contactConsent?"bg-emerald-400":"bg-slate-300")} title={l.stage==="OPT_OUT"?"Não contatar":l.contactConsent?"Permissão declarada":"Sem permissão registrada"}/>
                      </div>
                    </Link>)}
                    {!cards.length&&<p className="py-10 text-center text-xs text-[#87968F]">Nenhum lead</p>}
                  </div>
                </section>;
              })}
            </div>
          </div>
          <p className="text-xs text-[#82938C]">O quadro mostra até 300 contatos por consulta. Abra um cartão para alterar etapa, incluir notas e acompanhar tarefas.</p>
        </div>
        <aside className="space-y-4">
          <section className="rounded-2xl border border-[#DCE8E3] bg-white p-5">
            <div className="mb-4 flex items-center gap-2"><Plus className="text-[#0B9568]" size={18}/><h2 className="text-lg font-semibold text-[#0B1F3B]">Novo contato</h2></div>
            {sessions.length?(
              <form action={createCrmLead} className="space-y-3">
                <label className="block text-xs font-semibold text-[#596B7E]">Sessão WhatsApp
                  <select name="sessionId" className="mt-1 h-10 w-full rounded-lg border border-[#DCE8E3] bg-white px-3 text-sm" required>
                    {sessions.map(s=><option value={s.id} key={s.id}>{s.name} ({s.sessionId})</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-[#596B7E]">Nome *
                  <input name="name" maxLength={120} required placeholder="Nome do contato" className="mt-1 h-10 w-full rounded-lg border border-[#DCE8E3] px-3 text-sm"/>
                </label>
                <label className="block text-xs font-semibold text-[#596B7E]">WhatsApp com DDD *
                  <input name="phone" type="tel" maxLength={40} required placeholder="(11) 99999-9999" className="mt-1 h-10 w-full rounded-lg border border-[#DCE8E3] px-3 text-sm"/>
                </label>
                <label className="block text-xs font-semibold text-[#596B7E]">Empresa
                  <input name="company" maxLength={120} placeholder="Empresa" className="mt-1 h-10 w-full rounded-lg border border-[#DCE8E3] px-3 text-sm"/>
                </label>
                <label className="block text-xs font-semibold text-[#596B7E]">E-mail
                  <input name="email" type="email" maxLength={180} placeholder="contato@empresa.com" className="mt-1 h-10 w-full rounded-lg border border-[#DCE8E3] px-3 text-sm"/>
                </label>
                <label className="block text-xs font-semibold text-[#596B7E]">Origem
                  <select name="source" className="mt-1 h-10 w-full rounded-lg border border-[#DCE8E3] bg-white px-3 text-sm">
                    <option value="MANUAL">Cadastro manual</option><option value="INSTAGRAM">Instagram</option>
                    <option value="WEBSITE">Site</option><option value="REFERRAL">Indicação</option>
                    <option value="OTHER">Outros</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-[#596B7E]">Valor da oportunidade (R$)
                  <input name="dealValue" type="number" min="0" max="100000000" step="0.01" placeholder="0,00" className="mt-1 h-10 w-full rounded-lg border border-[#DCE8E3] px-3 text-sm"/>
                </label>
                <label className="flex items-start gap-2 text-xs leading-5 text-[#5B7080]">
                  <input name="contactConsent" type="checkbox" className="mt-1 accent-[#22D37F]"/>
                  O contato autorizou receber mensagens comerciais da ELFIG.
                </label>
                <label className="block text-xs font-semibold text-[#596B7E]">Origem da autorização
                  <textarea name="consentEvidence" rows={2} maxLength={1000} placeholder="Ex.: solicitou orçamento pelo site em..." className="mt-1 w-full rounded-lg border border-[#DCE8E3] p-3 text-sm"/>
                </label>
                <button className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#22D37F] font-bold text-[#0B1F3B] hover:bg-[#4DE79A]">Salvar contato <Plus size={16}/></button>
              </form>
            ):<p className="text-sm text-[#718395]">Conecte uma sessão de WhatsApp para cadastrar contatos.</p>}
          </section>
          <section className="rounded-2xl border border-[#DCE8E3] bg-white p-5">
            <div className="flex items-start gap-3"><BriefcaseBusiness className="mt-1 text-[#0E8F6B]" size={18}/><div>
              <h3 className="text-sm font-semibold text-[#0B1F3B]">Trazer contatos existentes</h3>
              <p className="mt-2 text-xs leading-5 text-[#70818C]">Importa até 500 contatos já sincronizados de uma sessão, sem iniciar conversas e sem marcar consentimento automaticamente.</p>
            </div></div>
            {sessions.length?<form action={importWhatsAppContacts} className="mt-4 flex gap-2">
              <select name="sessionId" aria-label="Sessão para importação" className="h-10 min-w-0 flex-1 rounded-lg border border-[#DCE8E3] bg-white px-2 text-xs">
                {sessions.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button className="rounded-lg border border-[#C7DCD2] px-3 text-xs font-semibold text-[#0B1F3B] hover:bg-[#F0F8F4]">Importar</button>
            </form>:null}
          </section>
        </aside>
      </div>
    </div>
  );
}
