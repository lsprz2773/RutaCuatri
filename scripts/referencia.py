"""Implementación de referencia de RutaCuatri (oráculo de pruebas).
Uso (desde la raíz): python3 scripts/referencia.py  -> recalcula todos los casos de casos-prueba.json y compara."""
import heapq, math, itertools, json, os, copy
PER = {"Ene": 0, "May": 1, "Sep": 2}

class Problema:
    def __init__(s, mats, Cnorm=30, Cmax=36, beta=0.1, K=7):
        s.m = mats; s.n = len(mats); s.idx = {x["clave"]: i for i, x in enumerate(mats)}
        s.cr = [x["creditos"] for x in mats]
        s.pre = [sum(1 << s.idx[p] for p in x["prerrequisitos"]) for x in mats]
        s.off = [{PER[p] for p in x["oferta"]} for x in mats]
        s.exc = [x["exclusiva"] for x in mats]
        s.Cnorm, s.Cmax, s.beta, s.K = Cnorm, Cmax, beta, K
    def mask(s, claves): return sum(1 << s.idx[c] for c in claves)
    def needed(s, A, G):
        need = 0; stack = [i for i in range(s.n) if (G >> i) & 1 and not (A >> i) & 1]
        while stack:
            x = stack.pop()
            if (need >> x) & 1: continue
            need |= 1 << x
            stack += [q for q in range(s.n) if (s.pre[x] >> q) & 1 and not (A >> q) & 1]
        return need
    def h(s, A, G):
        need = s.needed(A, G)
        if not need: return 0
        R = sum(s.cr[i] for i in range(s.n) if (need >> i) & 1); memo = {}
        def L(x):
            if x not in memo:
                memo[x] = 1 + max([L(q) for q in range(s.n) if (s.pre[x] >> q) & 1 and (need >> q) & 1], default=0)
            return memo[x]
        return max(math.ceil(R / s.Cmax), max(L(i) for i in range(s.n) if (need >> i) & 1))
    def costo(s, cr): return 1 + s.beta * max(0, cr - s.Cnorm)
    def validar(s, A, G):
        need = s.needed(A, G); err = []
        for i in range(s.n):
            if (need >> i) & 1:
                if not s.off[i]: err.append((s.m[i]["clave"], "sin oferta"))
                if s.cr[i] > s.Cmax: err.append((s.m[i]["clave"], "créditos > Cmax"))
        return err
    def sucesores(s, A, p, G):
        need = s.needed(A, G)
        el = [i for i in range(s.n) if (need >> i) & 1 and p in s.off[i] and (s.pre[i] & A) == s.pre[i]]
        q = (p + 1) % 3; out = []
        normal = [i for i in el if not s.exc[i]]
        for i in el:
            if s.exc[i] and s.cr[i] <= s.Cmax: out.append((A | 1 << i, q, s.costo(s.cr[i]), (i,)))
        for k in range(1, min(len(normal), s.K) + 1):
            for S in itertools.combinations(normal, k):
                c = sum(s.cr[i] for i in S)
                if c > s.Cmax: continue
                if c <= s.Cnorm and len(S) < s.K and any(i not in S and c + s.cr[i] <= s.Cnorm for i in normal):
                    continue
                B = A
                for i in S: B |= 1 << i
                out.append((B, q, s.costo(c), S))
        if not out: out.append((A, q, 1.0, ()))
        return out

def wastar(P, start, G, H, bound=math.inf):
    A0, p0 = start; cnt = 0
    pq = [(H * P.h(A0, G), 0, 0.0, cnt, (A0, p0))]; gb = {(A0, p0): 0.0}; par = {(A0, p0): None}; closed = set(); exp = 0
    while pq:
        f, _, g, _, st = heapq.heappop(pq)
        if st in closed or g > gb[st] + 1e-12: continue
        A, p = st
        if (A & G) == G:
            path = []; x = st
            while par[x]: path.append(par[x][1:]); x = par[x][0]
            return g, exp, path[::-1]
        closed.add(st); exp += 1
        for B, q, c, S in P.sucesores(A, p, G):
            t = (B, q); ng = g + c; hv = P.h(B, G)
            if ng + hv >= bound - 1e-9 or t in closed: continue
            if ng < gb.get(t, math.inf) - 1e-12:
                gb[t] = ng; par[t] = (st, S, c, p); cnt += 1
                cred = sum(P.cr[i] for i in range(P.n) if (B >> i) & 1)
                heapq.heappush(pq, (ng + H * hv, -cred, ng, cnt, t))
    return None, exp, None

def anytime(P, start, G, pesos=(3, 2, 1.5, 1)):
    best = math.inf; plan = None; pasadas = []
    for H in pesos:
        c, exp, path = wastar(P, start, G, H, best)
        pasadas.append({"H": H, "costo": c, "expandidos": exp})
        if c is not None and c < best: best, plan = c, path
    return (None if best == math.inf else best), plan, pasadas

if __name__ == "__main__":
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    datos = os.path.join(raiz, "public", "datos")
    mallas = {m["id"]: m["materias"] for m in json.load(open(os.path.join(datos, "mallas.json"), encoding="utf-8"))["mallas"]}
    esc = json.load(open(os.path.join(datos, "escenarios.json"), encoding="utf-8"))
    casos = json.load(open(os.path.join(raiz, "pruebas", "casos-prueba.json"), encoding="utf-8"))
    alumnos = {a["id"]: a for a in esc["alumnos"]}; metas = {m["id"]: m for m in esc["metas"]}
    fallas = 0
    for g in casos["escenarios"]:
        a = alumnos[g["alumno"]]; P = Problema(mallas[a["malla"]], **esc["perfiles"][g["perfil"]])
        G = P.mask(metas[g["meta"]]["materias"]); st = (P.mask(a["aprobadas"]), PER[a["periodo_inicio"]])
        c, plan, ps = anytime(P, st, G)
        ok = abs(c - g["costo_optimo"]) < 1e-9 and len(plan) == g["cuatrimestres"]
        for x in ps:
            if x["costo"] is not None and x["costo"] > x["H"] * g["costo_optimo"] + 1e-9: ok = False
        fallas += not ok
    for t in casos["casos_especiales"]:
        mats = t.get("materias_mini") or copy.deepcopy(mallas[t["malla"]])
        for k, v in t.get("modificacion", {}).items():
            for x in mats:
                if x["clave"] == k: x.update(v)
        P = Problema(mats, **t["parametros"])
        G = P.mask(t["meta"] if isinstance(t["meta"], list) else metas[t["meta"]]["materias"])
        A0 = P.mask(t["inicio"]["aprobadas"]); st = (A0, PER[t["inicio"]["periodo"]])
        if t["esperado"].get("costo") is None:
            ok = bool(P.validar(A0, G))
        else:
            c, plan, _ = anytime(P, st, G)
            ok = abs(c - t["esperado"]["costo"]) < 1e-9 and len(plan) == t["esperado"]["cuatrimestres"]
        fallas += not ok
        print(t["id"], "ok" if ok else "FALLA")
    print("escenarios:", len(casos["escenarios"]), "fallas totales:", fallas)
