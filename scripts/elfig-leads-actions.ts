"use server";
import { auth } from "@/lib/auth";
import { getAccessibleSessions } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateLeadStage(formData:FormData):Promise<void>{
  const session=await auth();
  if(!session?.user?.id)throw new Error("Acesso não autorizado.");
  const leadId=String(formData.get("leadId")||"");
  const next=String(formData.get("stage")||"");
  if(!leadId || !["HUMAN","DONE"].includes(next))throw new Error("Atualização inválida.");
  const sessions=await getAccessibleSessions(session.user.id,session.user.role || "OWNER");
  const ids=sessions.map(s=>s.id);
  if(!ids.length)throw new Error("Nenhuma sessão autorizada.");
  await prisma.customerLead.updateMany({
    where:{id:leadId,sessionId:{in:ids},stage:{not:"OPT_OUT"}},
    data:{stage:next,lastInteractionAt:new Date()}
  });
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
}
