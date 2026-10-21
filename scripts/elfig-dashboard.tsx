import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAccessibleSessions } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { ArrowUpRight, ArrowRight, Bot, CheckCircle2, Clock3, Inbox, MessageCircle, Plus, QrCode, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const stageNames: Record<string, string> = {
  NEW: "Novo contato",
  WAIT_BRIEF: "Aguardando briefing",
  HUMAN: "Atendimento humano",
  OPT_OUT: "Automação desativada",
  DONE: "Concluído",
};

const serviceNames: Record<string, string> = {
  sites: "Sites e landing pages",
  marketing: "Marketing digital",
  branding: "Branding e design",
  sistemas: "Sistemas",
  automacao: "Automações",
  suporte: "Suporte de TI",
  outros: "Outros serviços",
  design: "Design e redes sociais",
  nfc: "Placas NFC",
};

const stageStyles: Record<string, string> = {
  NEW: "bg-sky-50 text-sky-700",
  WAIT_BRIEF: "bg-amber-50 text-amber-800",
  HUMAN: "bg-emerald-50 text-emerald-800",
  OPT_OUT: "bg-slate-100 text-slate-600",
  DONE: "bg-slate-100 text-slate-600",
};

function Stat({label, value, description, icon: Icon}: {label:string;value:number;description:string;icon:typeof Inbox}) {
  return (
    <div className="rounded-2xl border border-[#E1E9E7] bg-white p-5 shadow-[0_8px_30px_rgba(11,31,59,0.025)]">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#617184]">{label}</span>
        <Icon className="h-[18px] w-[18px] text-[#195F50]" aria-hidden="true" />
      </div>
      <div className="text-4xl font-bold tracking-[-0.055em] text-[#0B1F3B]">{value}</div>
      <div className="mt-2 text-[12px] text-[#7C8B9C]">{description}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const sessions = await getAccessibleSessions(session.user.id, session.user.role || "OWNER");
  const dbIds = sessions.map(s => s.id);
  const [leads, totalLeads, inHuman, awaitingBrief] = dbIds.length
    ? await Promise.all([
        prisma.customerLead.findMany({where:{sessionId:{in:dbIds}},orderBy:{lastInteractionAt:"desc"},take:8,
          select:{id:true,chatJid:true,stage:true,service:true,lastInteractionAt:true}}),
        prisma.customerLead.count({where:{sessionId:{in:dbIds}}}),
        prisma.customerLead.count({where:{sessionId:{in:dbIds},stage:"HUMAN"}}),
        prisma.customerLead.count({where:{sessionId:{in:dbIds},stage:"WAIT_BRIEF"}}),
      ])
    : [[],0,0,0];

  const connected = sessions.filter(s => s.status === "CONNECTED").length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[28px] bg-[#0B1F3B] px-6 py-9 text-white sm:px-9 lg:px-11 lg:py-11">
        <div className="pointer-events-none absolute right-[-100px] top-[-160px] h-[420px] w-[420px] rounded-full border border-[#2D4761] opacity-70" />
        <div className="pointer-events-none absolute right-[-20px] top-[-40px] h-[300px] w-[300px] rounded-full border border-[#294A5E] opacity-70" />
        <p className="relative mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.23em] text-[#22D37F]">
          <span className="h-[2px] w-6 bg-[#22D37F]" /> ELFIG / Atendimento
        </p>
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[660px]">
            <h1 className="text-3xl font-semibold tracking-[-0.055em] sm:text-4xl lg:text-5xl">Seu atendimento, sob controle.</h1>
            <p className="mt-4 max-w-[560px] text-sm leading-7 text-[#B5C7D8] sm:text-base">
              Acompanhe oportunidades, responda seus clientes e gerencie as conversas da ELFIG em um único lugar.
            </p>
          </div>
          <Link href="/dashboard/chat" className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#22D37F] px-5 py-3 text-sm font-bold text-[#0B1F3B] transition hover:bg-[#50E79B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            Abrir conversas <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="relative mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-5 text-xs text-[#D0DEEA]">
          <span className="flex items-center gap-2"><span className={"h-2 w-2 rounded-full " + (connected?"bg-[#22D37F]":"bg-amber-400")} /> {connected} sessão(ões) conectada(s)</span>
          <span className="flex items-center gap-2"><Clock3 size={13} /> Atendimento receptivo</span>
          <span className="flex items-center gap-2"><CheckCircle2 size={13} /> Dados mantidos no seu banco</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Stat label="Contatos recebidos" value={totalLeads} description="Leads registrados" icon={Users}/>
        <Stat label="Aguardando você" value={inHuman} description="Requerem atendimento pessoal" icon={Inbox}/>
        <Stat label="Aguardando briefing" value={awaitingBrief} description="Clientes reunindo informações" icon={Clock3}/>
        <Stat label="WhatsApps conectados" value={connected} description="Sessões disponíveis agora" icon={MessageCircle}/>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(290px,1fr)]">
        <section className="overflow-hidden rounded-2xl border border-[#E1E9E7] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E7EEEB] p-5 sm:px-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#0B1F3B]">Atendimentos recentes</h2>
              <p className="mt-1 text-xs text-[#79889B]">Atualizado ao carregar o painel</p>
            </div>
            <Link href="/dashboard/chat" className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B7554] hover:underline">Ver conversas <ArrowRight size={14}/></Link>
          </div>
          {leads.length===0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-2xl bg-[#E8F7EF] p-4 text-[#0B7554]"><MessageCircle size={23}/></div>
              <p className="text-sm font-semibold text-[#0B1F3B]">Nenhum atendimento registrado</p>
              <p className="mt-2 max-w-[320px] text-xs leading-6 text-[#7C8B9C]">Quando um cliente entrar em contato, os atendimentos aparecerão aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#EFF2F1]">
              {leads.map(lead => (
                <Link key={lead.id} href={"/dashboard/chat/" + encodeURIComponent(lead.chatJid)} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-[#F7FAF8] sm:px-6">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0B1F3B]">Contato WhatsApp</p>
                    <p className="mt-1 truncate text-xs text-[#607285]">{serviceNames[lead.service || ""] || "Atendimento geral"} · {lead.lastInteractionAt.toLocaleDateString("pt-BR")}</p>
                  </div>
                  <span className={"rounded-full px-3 py-1 text-[11px] font-semibold " + (stageStyles[lead.stage] || "bg-slate-100 text-slate-600")}>{stageNames[lead.stage] || lead.stage}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#E1E9E7] bg-white p-6">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#0B7554]">Acesso rápido</p>
            {[
              {href:"/dashboard/chat",label:"Conversas",desc:"Responder seus clientes",icon:MessageCircle},
              {href:"/dashboard/sessions",label:"WhatsApp",desc:"Gerenciar conexões e QR",icon:QrCode},
              {href:"/dashboard/labels",label:"Etiquetas",desc:"Organizar as oportunidades",icon:Users},
              {href:"/dashboard/bot-settings",label:"Automação",desc:"Controlar o atendimento",icon:Bot}
            ].map(({href,label,desc,icon:Icon}) => (
              <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-[#F2F8F5]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF5F2] text-[#0C6952]"><Icon size={18}/></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#0B1F3B]">{label}</span><span className="block text-xs text-[#82909D]">{desc}</span></span>
                <ArrowUpRight size={15} className="text-[#82909D] transition group-hover:text-[#0B7554]"/>
              </Link>
            ))}
          </div>
          <div className="rounded-2xl bg-[#EAF7F1] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#11684E]">ELFIG · Creative & Technology</p>
            <h3 className="mt-3 text-xl font-semibold leading-snug tracking-tight text-[#0B1F3B]">Ideias que evoluem.<br/>Negócios que crescem.</h3>
            <p className="mt-3 text-xs leading-6 text-[#526C66]">Atendimento humano em primeiro lugar. A automação organiza solicitações e encaminha oportunidades sem interromper as conversas.</p>
          </div>
        </aside>
      </div>
      <div className="text-center text-xs text-[#7A8998]">ELFIG Atendimento · Painel interno · Versão de pré-lançamento</div>
    </div>
  );
}
