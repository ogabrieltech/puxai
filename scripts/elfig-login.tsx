"use client";
import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LockKeyhole, Loader2 } from "lucide-react";

function SignInForm(){
  const params=useSearchParams();
  const requested=params.get("callbackUrl") || "/dashboard";
  const callbackUrl=requested.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(loading)return;
    setLoading(true);setError("");
    try{
      const result=await signIn("credentials",{email,password,redirect:false});
      if(!result || result.error){setError("E-mail ou senha inválidos. Verifique os dados e tente novamente.");return;}
      window.location.assign(callbackUrl);
    }catch{
      setError("Não foi possível entrar. Tente novamente em instantes.");
    }finally{setLoading(false);}
  }

  return (
    <main className="min-h-screen bg-[#0B1F3B] text-white lg:grid lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-[#23445A] p-12 lg:flex xl:p-16">
        <div className="absolute -right-48 bottom-[-200px] h-[670px] w-[670px] rounded-full border border-[#2B495C]" aria-hidden="true" />
        <div className="absolute right-[-105px] bottom-[-80px] h-[470px] w-[470px] rounded-full border border-[#2B495C]" aria-hidden="true" />
        <Link href="/" className="relative inline-flex w-fit items-center">
          <Image src="/elfig-logo.svg" alt="ELFIG Creative & Technology" width={246} height={79} priority className="h-auto w-[190px]"/>
        </Link>
        <div className="relative max-w-lg">
          <div className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.27em] text-[#22D37F]"><span className="h-px w-8 bg-[#22D37F]" /> ELFIG Atendimento</div>
          <h1 className="text-5xl font-semibold leading-[1.1] tracking-[-0.065em] xl:text-6xl">Conversas organizadas.<br/><span className="text-[#22D37F]">Clientes bem atendidos.</span></h1>
          <p className="mt-7 max-w-md text-base leading-8 text-[#B9CAD8]">Uma central para acompanhar novos contatos, responder clientes e organizar oportunidades com clareza.</p>
        </div>
        <p className="relative text-xs text-[#839CB1]">Acesso privado · ELFIG Creative & Technology</p>
      </section>
      <section className="flex min-h-screen flex-col items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[410px]">
          <div className="mb-10 lg:hidden"><Image src="/elfig-logo.svg" alt="ELFIG Creative & Technology" width={200} height={64} priority className="h-auto w-[166px]"/></div>
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2B5261] bg-[#142E42] text-[#22D37F]"><LockKeyhole size={22}/></div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#22D37F]">Área restrita</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Acesse seu painel.</h2>
          <p className="mb-8 mt-3 text-sm leading-6 text-[#B2C4D4]">Use suas credenciais para continuar o atendimento.</p>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">E-mail</label>
              <input id="email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="seu@email.com" className="h-12 w-full rounded-xl border border-[#34536B] bg-[#102840] px-4 text-sm text-white outline-none placeholder:text-[#7F97AA] focus:border-[#22D37F] focus:ring-2 focus:ring-[#22D37F]/20" />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium">Senha</label>
              <input id="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required className="h-12 w-full rounded-xl border border-[#34536B] bg-[#102840] px-4 text-sm text-white outline-none focus:border-[#22D37F] focus:ring-2 focus:ring-[#22D37F]/20" />
            </div>
            {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">{error}</p>}
            <button disabled={loading} type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#22D37F] px-5 text-sm font-bold text-[#0B1F3B] transition hover:bg-[#51E89A] disabled:cursor-not-allowed disabled:opacity-60">
              {loading?<><Loader2 size={16} className="animate-spin"/> Entrando...</>:<>Entrar no painel <ArrowRight size={16}/></>}
            </button>
          </form>
          <p className="mt-9 text-xs leading-6 text-[#849DAF]">Esta plataforma é de uso interno da ELFIG. Caso precise de atendimento comercial, entre em contato por nossos canais oficiais.</p>
        </div>
      </section>
    </main>
  );
}
export default function LoginPage(){
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0B1F3B] text-[#22D37F]"><Loader2 className="animate-spin"/></div>}><SignInForm/></Suspense>;
}
