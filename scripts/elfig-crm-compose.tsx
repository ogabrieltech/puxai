import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAccessibleSessions } from "@/lib/api-auth";
import { ArrowLeft, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import { createAndSendCrmMessage } from "../actions";
export const dynamic="force-dynamic";
export default async function NewCrmMessage(){
  const user=await auth();
  if(!user?.user?.id)redirect("/auth/login");
  const sessions=(await getAccessibleSessions(user.user.id,user.user.role||"OWNER")).filter(s=>s.status==="CONNECTED");
  return <div className="mx-auto max-w-[970px] space-y-6 pb-16">
    <Link href="/dashboard/crm" className="inline-flex items-center gap-2 text-sm font-semibold text-[#577268]"><ArrowLeft size={16}/> Voltar ao CRM</Link>
    <div className="rounded-[26px] bg-[#0B1F3B] px-7 py-9 text-white sm:px-10">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#22D37F]">ELFIG / WhatsApp</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Nova mensagem</h1>
      <p className="mt-3 max-w-xl text-sm leading-7 text-[#B6C8D5]">Informe o número e escreva a mensagem. O envio será feito diretamente pelo WhatsApp conectado, após sua confirmação individual.</p>
    </div>
    {!sessions.length?<div className="rounded-xl border border-[#F1D4B3] bg-[#FFF8EB] p-5 text-sm text-[#8C601F]">Não existe uma sessão WhatsApp conectada. Acesse <Link className="underline" href="/dashboard/sessions">Conexões / QR</Link> para conectar e depois retorne.</div>:(
    <form action={createAndSendCrmMessage} className="space-y-6 rounded-2xl border border-[#DCE8E3] bg-white p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#324B5F]">Conta de WhatsApp
          <select name="sessionId" required className="mt-2 h-11 w-full rounded-xl border border-[#D5E3DC] bg-white px-3 text-sm">
            {sessions.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-[#324B5F]">Telefone com DDD *
          <input name="phone" type="tel" required maxLength={40} placeholder="(11) 99999-9999" className="mt-2 h-11 w-full rounded-xl border border-[#D5E3DC] px-3 text-sm"/>
        </label>
        <label className="text-sm font-semibold text-[#324B5F]">Nome do destinatário *
          <input name="name" required maxLength={120} placeholder="Nome do contato" className="mt-2 h-11 w-full rounded-xl border border-[#D5E3DC] px-3 text-sm"/>
        </label>
      </div>
      <label className="block text-sm font-semibold text-[#324B5F]">Mensagem *
        <textarea name="message" required rows={6} maxLength={1400} placeholder="Olá! Aqui é da ELFIG..." className="mt-2 w-full resize-y rounded-xl border border-[#D5E3DC] p-4 text-sm font-normal leading-6"/>
      </label>
      <div className="rounded-xl border border-[#D6E5DE] bg-[#F2FAF5] p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0C7655]"><ShieldCheck size={18}/> Autorização para contato</div>
        <p className="mt-2 text-xs leading-6 text-[#597065]">A ELFIG só deve iniciar mensagens comerciais para pessoas que aceitaram receber contatos da empresa. Registrar a origem da autorização ajuda a preservar o histórico e respeitar pedidos de não contato.</p>
        <label className="mt-4 block text-xs font-semibold text-[#355647]">Como o destinatário autorizou o contato?
          <textarea name="consentEvidence" required rows={2} minLength={5} maxLength={1000} placeholder="Ex.: pediu orçamento pelo formulário, em..." className="mt-2 w-full rounded-lg border border-[#C3D9CD] bg-white p-3 text-sm font-normal"/>
        </label>
        <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-[#345D4C]">
          <input type="checkbox" name="contactConsent" required className="mt-1.5 accent-[#22D37F]"/>
          Confirmo que o contato autorizou receber esta mensagem da ELFIG.
        </label>
      </div>
      <label className="flex items-start gap-3 text-sm text-[#42586B]">
        <input type="checkbox" required name="confirmSend" value="yes" className="mt-1 accent-[#22D37F]"/>
        Revisei o número e a mensagem e quero enviá-la agora (envio único e manual).
      </label>
      <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#22D37F] px-6 text-sm font-bold text-[#0B1F3B] hover:bg-[#51EBA2]">
        Enviar mensagem <Send size={17}/>
      </button>
      <p className="text-xs leading-5 text-[#82918C]">O sistema registra a mensagem na ficha do lead. O WhatsApp precisa permanecer conectado; nenhum disparo em massa é realizado.</p>
    </form>)}
  </div>;
}
