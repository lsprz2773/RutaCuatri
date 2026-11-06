export function costoCuatrimestre(pb: Problema, creditos: number): number {
  return 1 + pb.beta * Math.max(0, creditos - pb.Cnorm);
}
