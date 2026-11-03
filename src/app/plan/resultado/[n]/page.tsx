import { DetalleCuatrimestre } from "@/componentes/DetalleCuatrimestre";

/** Planes de hasta 40 cuatrimestres: la exportación estática necesita las rutas de antemano. */
const MAX_CUATRIMESTRES = 40;
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: MAX_CUATRIMESTRES }, (_, i) => ({ n: String(i + 1) }));
}

export default async function Pagina({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  return <DetalleCuatrimestre n={Number(n)} />;
}
