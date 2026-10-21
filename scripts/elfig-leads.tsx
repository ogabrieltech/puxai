import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAccessibleSessions } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ArrowUpRight, Check, Inbox, MessageCircle, UserRound } from "lucide-react";
import { updateLeadStage } from "./actions";

export const dynamic="force-dynamic";

const stages:Record<string,string>={
  NEW:"Novo",WAIT_BRIEF:"Aguardando briefing",HUMAN:"Atendimento humano",DONE:"Concluído",OPT_OUT:"Não contatar"
};
const serviceNames:Record<string,string>={
  sites:"Sites e landing pages",marketing:"Marketing digital",branding:"Branding e design",
  sistemas:"Sistemas personalizados",automacao:"Automações e integrações",suporte:"Suporte TI",
  outros:"Outros",design:"Design",nfc:"NFC"
};
const colors:Record<string,string>={
  NEW:"bg-blue-50 text-blue-700",WAIT_BRIEF:"bg-amber-50 text-amber-700",HUMAN:"bg-emerald-50 text-emerald-700",DONE:"bg-slate-100 text-slate-600",OPT_OUT:"bg-red-50 text-red-700"
};

export default async function LeadsPage(){
  const user=await auth();
  if(!user?.user?.id)redirect("/auth/login");
  const sessions=await getAccessibleSessions(user.user.id,user.user.role || "OWNER");
  const dbIds=sessions.map(s=>s.id);
  const leads=dbIds.length?await prisma.customerLead.findMany({
    where:{sessionId:{in:dbIds}},orderBy:{lastInteractionAt:"desc"},take:100,
    select:{id:true,chatJid:true,service:true,stage:true,lastInteractionAt:true,createdAt:true}
  }):[];
  const waiting=leads.filter(x=>x.stage==="HUMAN").length;

  return (
    <div className="mx-auto max-w-[1380px] space-y-6 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#0A9768]">ELFIG / Comercial</p>
          <h1 className="text-3xl font-semibold tracking-[-0.055em] text-[#0B1F3B] sm:text-4xl">Central de oportunidades</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6B7887]">Leads recebidos pelas automações receptivas. Acompanhe o andamento e abra a conversa para continuar o atendimento.</p>
        </div>
        <Link href="/dashboard/chat" className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F3B] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#173955]">Abrir WhatsApp <ArrowUpRight size={15}/></Link>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="min-w-[155px] rounded-xl border border-[#DEE9E4] bg-white px-5 py-4"><span className="text-xs text-[#6E7D8E]">Contatos exibidos</span><p className="mt-1 text-3xl font-bold tracking-tight text-[#0B1F3B]">{leads.length}</p></div>
        <div className="min-w-[155px] rounded-xl border border-[#DEE9E4] bg-white px-5 py-4"><span className="text-xs text-[#6E7D8E]">Aguardando você</span><p className="mt-1 text-3xl font-bold tracking-tight text-[#0B1F3B]">{waiting}</p></div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#DEE9E4] bg-white">
        <div className="flex items-center justify-between border-b border-[#E5EDEA] px-5 py-5 sm:px-7">
          <h2 className="text-base font-semibold text-[#0B1F3B]">Atendimentos recentes</h2>
          <span className="text-xs text-[#788897]">Últimos 100 registros</span>
        </div>
        {leads.length?(
          <div className="divide-y divide-[#EDF2EF]">
            {leads.map(lead=>(
              <article key={lead.id} className="grid gap-4 p-5 sm:px-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_auto] lg:items-center">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF7F0] text-[#0D7658]"><UserRound size={17}/></span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0B1F3B]">Contato pelo WhatsApp</p>
                    <p className="mt-1 break-all text-[11px] text-[#748393]">{lead.chatJid}</p>
                    <p className="mt-1 text-[11px] text-[#81909E]">Última interação: {lead.lastInteractionAt.toLocaleString("pt-BR")}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-[#627182]">{serviceNames[lead.service || ""] || "Atendimento geral"}</p>
                  <span className={"inline-flex rounded-full px-3 py-1 text-[11px] font-semibold "+(colors[lead.stage]||"bg-slate-100 text-slate-600")}>{stages[lead.stage]||lead.stage}</span>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Link href={"/dashboard/chat/"+encodeURIComponent(lead.chatJid)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#CFDDD7] px-3 py-2 text-xs font-semibold text-[#0B1F3B] hover:bg-[#F2F8F5]"><MessageCircle size={14}/> Conversa</Link>
                  {lead.stage!=="DONE"&&lead.stage!=="OPT_OUT"&&(
                    <form action={updateLeadStage}>
                      <input name="leadId" type="hidden" value={lead.id}/>
                      <input name="stage" type="hidden" value="DONE"/>
                      <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[#E2F7EA] px-3 py-2 text-xs font-semibold text-[#126D4C] hover:bg-[#CEF1DC]"><Check size={14}/> Concluir</button>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </div>
        ):(
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <span className="mb-4 rounded-2xl bg-[#EAF7F0] p-4 text-[#0D7658]"><Inbox size={22}/></span>
            <h3 className="text-sm font-semibold text-[#0B1F3B]">Nenhum lead registrado</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#798795]">Os novos contatos aparecerão aqui após a ativação e o teste do atendimento receptivo.</p>
          </div>
        )}
      </div>
      <p className="text-xs text-[#788897]">Respeite pedidos de não contato. Leads marcados como “Não contatar” não podem ser reativados por esta tela.</p>
    </div>
  );
}
