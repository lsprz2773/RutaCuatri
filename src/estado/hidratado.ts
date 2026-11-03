"use client";
import { useEffect, useState } from "react";

/** false en el servidor y en el primer render del cliente; evita diferencias con localStorage. */
export function useHidratado(): boolean {
  const [listo, setListo] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setListo(true), []);
  return listo;
}
