const fs=require("node:fs");
const path=require("node:path");
function patch(file,fn){const before=fs.readFileSync(file,"utf8");const after=fn(before);if(after===before)throw new Error("ELFIG patch failed: "+file);fs.writeFileSync(file,after);}
function replace(s,from,to){if(!s.includes(from))throw new Error("Source drift: "+from.slice(0,90));return s.replace(from,to);}
for(const [source,target] of [
  ["/tmp/elfig-logo.svg","public/elfig-logo.svg"],
  ["/tmp/elfig-symbol.svg","public/elfig-symbol.svg"],
  ["/tmp/elfig-dashboard.tsx","src/app/dashboard/page.tsx"],
  ["/tmp/elfig-login.tsx","src/app/auth/login/page.tsx"]
]){fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}
fs.writeFileSync("src/app/page.tsx",'import { redirect } from "next/navigation";\nexport default function Home(){ redirect("/auth/login"); }\n');
fs.writeFileSync("src/app/icon.tsx",'import { readFileSync } from "node:fs";\nimport path from "node:path";\nexport const runtime = "nodejs";\nexport default function Icon(){return new Response(readFileSync(path.join(process.cwd(),"public","elfig-symbol.svg")),{headers:{"Content-Type":"image/svg+xml","Cache-Control":"public,max-age=86400"}});}\n');
patch("prisma/schema.prisma",s=>replace(s,'@default("ogabrieltechIA")','@default("ELFIG Atendimento")'));
patch("scripts/setup-admin.js",s=>replace(s,'appName: "ogabrieltechIA"','appName: "ELFIG Atendimento"').replace('appName: "ogabrieltechIA"','appName: "ELFIG Atendimento"'));
patch("src/app/layout.tsx",s=>{
  s=replace(s,'const APP_DESCRIPTION = "Self-hosted WhatsApp Gateway with Multi-device support, Auto-replies, API integration, and session management dashboard.";',
    'const APP_DESCRIPTION = "Central privada de atendimento da ELFIG. Conversas, oportunidades, etiquetas e automações receptivas em um único painel.";');
  s=replace(s,'let appName = "WA-AKG";','let appName = "ELFIG Atendimento";');
  s=replace(s,'Premium WhatsApp Gateway','Central de Atendimento');
  s=replace(s,'lang="en"','lang="pt-BR"');
  return replace(s,'locale: "en_US"','locale: "pt_BR"');
});
patch("src/app/dashboard/layout.tsx",s=>replace(s,'systemConfig?.appName || "WA-AKG"','systemConfig?.appName || "ELFIG Atendimento"'));
patch("src/components/dashboard/sidebar-shell.tsx",s=>{
 s=replace(s,'<div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md">\n                            {appName.charAt(0)}\n                        </div>',
 '<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1F3B] p-1"><img src="/elfig-symbol.svg" alt="ELFIG" className="h-8 w-8 object-contain" /></div>');
 s=replace(s,'<h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">\n                            {appName}\n                        </h1>\n                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">WhatsApp Gateway</p>',
 '<div className="rounded-xl bg-[#0B1F3B] px-2 py-2"><img src="/elfig-logo.svg" alt="ELFIG Creative & Technology" className="h-[54px] w-full object-contain object-left" /></div><p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Central de atendimento</p>');
 return s.replace('> Sign Out','> Sair').replace('|| "User"','|| "Usuário"');
});
patch("src/components/dashboard/sidebar-nav.tsx",s=>{
  const changes=[
   ['label: "Messaging"','label: "ATENDIMENTO"'],
   ['label: "Contacts"','label: "CLIENTES"'],
   ['label: "Automation"','label: "AUTOMAÇÕES"'],
   ['label: "Developer"','label: "DESENVOLVEDOR"'],
   ['label: "Administration"','label: "ADMINISTRAÇÃO"'],
   ['label: "Dashboard"','label: "Visão geral"'],
   ['label: "Sessions / QR"','label: "Conexões / QR"'],
   ['label: "Chat"','label: "Conversas"'],
   ['label: "Contacts"','label: "Contatos"'],
   ['label: "Groups"','label: "Grupos"'],
   ['label: "Labels"','label: "Etiquetas"'],
   ['label: "Bot Settings"','label: "Configurar atendimento"'],
   ['label: "Auto Reply"','label: "Respostas automáticas"'],
   ['label: "Bot Profile"','label: "Perfil do atendente"'],
   ['label: "Webhooks & API"','label: "Integrações e API"'],
   ['label: "Media Manager"','label: "Arquivos e mídias"'],
   ['label: "Session Access"','label: "Acesso às sessões"'],
   ['label: "Users"','label: "Usuários"'],
   ['label: "Settings"','label: "Configurações"'],
   ['label: "System Monitor"','label: "Monitoramento"'],
   ['label: "Notifications"','label: "Notificações"']
  ];
  for(const [from,to] of changes)s=s.replaceAll(from,to);
  for(const line of [
   '            { href: "/dashboard/broadcast", label: "Broadcast", icon: Megaphone },\n',
   '            { href: "/dashboard/sticker", label: "Sticker Maker", icon: ImageIcon },\n',
   '            { href: "/dashboard/scheduler", label: "Scheduler", icon: CalendarClock },\n'
  ])s=s.replace(line,"");
  return replace(s,'<span>Collapse</span>','<span>Recolher</span>');
});
patch("src/components/dashboard/navbar.tsx",s=>replace(s,'<MobileNav appName={appName} />','<MobileNav appName={appName} /><span className="hidden font-semibold tracking-tight text-[#0B1F3B] md:inline">Central de atendimento</span>'));
patch("src/app/globals.css",s=>s+[
  "",
  "/* ELFIG brand design system */",
  ":root {",
  " --primary:#22D37F; --primary-foreground:#0B1F3B; --ring:#16AB6D;",
  " --sidebar-primary:#22D37F; --sidebar-ring:#22D37F;",
  " --background:#F7FAF8; --foreground:#0B1F3B;",
  " --card:#FFFFFF; --card-foreground:#0B1F3B;",
  " --sidebar:#F7FAF8; --sidebar-foreground:#0B1F3B;",
  " --border:#DCE7E3; --input:#DCE7E3; --muted:#EAF1EE; --muted-foreground:#5D6C7A;",
  "}",
  ".dark {",
  " --primary:#22D37F; --primary-foreground:#0B1F3B; --ring:#22D37F;",
  " --sidebar-primary:#22D37F; --sidebar-ring:#22D37F;",
  " --background:#0B1F3B; --foreground:#F7FAF8;",
  " --card:#102B42; --card-foreground:#F7FAF8;",
  " --sidebar:#0B1F3B; --sidebar-foreground:#F7FAF8;",
  " --border:#294258; --input:#294258; --muted:#1B354A; --muted-foreground:#B0C4D0;",
  "}",
  "button, a { -webkit-tap-highlight-color:transparent; }",
  ":focus-visible { outline:2px solid #22D37F; outline-offset:2px; }",
  ""
].join("\n"));
console.log("[ELFIG] Original logo, localized dashboard and branded login applied.");
