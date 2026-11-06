// Desempate: menor f; luego más créditos aprobados; luego menor g; luego orden de entrada.
const antes = (a: Nodo, b: Nodo): boolean =>
  a.f !== b.f
    ? a.f < b.f
    : a.cred !== b.cred
      ? a.cred > b.cred
      : a.g !== b.g
        ? a.g < b.g
        : a.orden < b.orden;
