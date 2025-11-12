import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function CreatorPage({ params }: { params: { handle: string }}) {
  const creator = await prisma.creator.findUnique({ where: { handle: params.handle }, include: { user: true, media: true } });
  if (!creator) return <div>Not found</div>;

  return (
    <main>
      <h1>{creator.displayName}</h1>
      <p>@{creator.handle}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:12, marginTop:12}}>
        {creator.media.map(m => (
          <div key={m.id} style={{border:"1px solid #2a2a34",borderRadius:12,padding:10}}>
            <img src={m.coverUrl || m.fileUrl} alt={m.title} style={{width:"100%",borderRadius:8}} />
            <div style={{marginTop:8,fontWeight:600}}>{m.title}</div>
            {m.visibility === "PAY_PER_VIEW" ? (
              <Link href={`/pay?media=${m.id}`} style={{display:"inline-block",marginTop:6,padding:"6px 10px",background:"#6d28d9",color:"#fff",borderRadius:8}}>
                Unlock ${(m.priceUsdCents??0)/100}
              </Link>
            ) : <div style={{opacity:.7,marginTop:6}}>Public</div>}
          </div>
        ))}
      </div>
    </main>
  );
}
