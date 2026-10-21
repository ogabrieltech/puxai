import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccessibleSessions } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
export const dynamic="force-dynamic";
function clean(value:unknown):string{
  let s=String(value??"").replace(/\r\n?/g,"\n").slice(0,4000);
  if(/^[\s]*[=+\-@\t]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
}
export async function GET(){
  const user=await auth();
  if(!user?.user?.id)return NextResponse.json({error:"Não autorizado"},{status:401});
  const sessions=await getAccessibleSessions(user.user.id,user.user.role||"OWNER");
  const ids=sessions.map(s=>s.id);
  const leads=ids.length?await prisma.customerLead.findMany({
    where:{sessionId:{in:ids}},orderBy:{createdAt:"desc"},take:5000,
    select:{name:true,phone:true,company:true,email:true,leadSource:true,dealStage:true,
      dealValue:true,contactConsent:true,nextFollowUpAt:true,createdAt:true,stage:true,notes:true}
  }):[];
  const headers=["Nome","Telefone","Empresa","Email","Origem","Etapa comercial","Valor BRL","Autorizacao registrada","Proximo contato","Criado em","Estado automacao","Observacoes"];
  const rows=leads.map(l=>[
    l.name,l.phone,l.company,l.email,l.leadSource,l.dealStage,l.dealValue?.toString()||"",
    l.contactConsent?"Sim":"Não",l.nextFollowUpAt?.toISOString().slice(0,10)||"",
    l.createdAt.toISOString().slice(0,10),l.stage,l.notes
  ]);
  const csv="\uFEFF"+[headers.map(clean).join(";"),...rows.map(row=>row.map(clean).join(";"))].join("\r\n");
  return new Response(csv,{headers:{
    "Content-Type":"text/csv; charset=utf-8",
    "Content-Disposition":'attachment; filename="elfig-crm-contatos.csv"',
    "Cache-Control":"private, no-store"
  }});
}
