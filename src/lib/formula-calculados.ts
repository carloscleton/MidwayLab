// src/lib/formula-calculados.ts
// Avaliador seguro (sem eval) de fórmulas de exames calculados.
// Sintaxe: [CODIGO], números, + - * /, parênteses e sinal unário. Ex.: [COL]-[TRI]/5-[HDLM]

export interface ICalculadoFormula {
  codigo: string;
  formula: string;
  mascara?: string;
  calcularAutomaticamente?: boolean;
}

type Token =
  | { t: 'num'; v: number }
  | { t: 'ref'; v: string }
  | { t: 'op'; v: '+' | '-' | '*' | '/' }
  | { t: 'lp' }
  | { t: 'rp' };

function tokenizar(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < formula.length) {
    const c = formula[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '[') {
      const fim = formula.indexOf(']', i);
      if (fim < 0) throw new Error('Colchete "[" sem fechamento');
      const nome = formula.slice(i + 1, fim).trim().toUpperCase();
      if (!nome) throw new Error('Referência vazia []');
      tokens.push({ t: 'ref', v: nome });
      i = fim + 1;
      continue;
    }
    if (/[0-9.,]/.test(c)) {
      let j = i;
      while (j < formula.length && /[0-9.,]/.test(formula[j])) j++;
      const n = Number(formula.slice(i, j).replace(',', '.'));
      if (Number.isNaN(n)) throw new Error(`Número inválido: ${formula.slice(i, j)}`);
      tokens.push({ t: 'num', v: n });
      i = j;
      continue;
    }
    if (c === '+' || c === '-' || c === '*' || c === '/') { tokens.push({ t: 'op', v: c }); i++; continue; }
    if (c === '(') { tokens.push({ t: 'lp' }); i++; continue; }
    if (c === ')') { tokens.push({ t: 'rp' }); i++; continue; }
    throw new Error(`Caractere inválido: "${c}"`);
  }
  return tokens;
}

type Node =
  | { k: 'num'; v: number }
  | { k: 'ref'; v: string }
  | { k: 'neg'; a: Node }
  | { k: 'bin'; op: string; a: Node; b: Node };

function parse(tokens: Token[]): Node {
  let pos = 0;
  const peek = () => tokens[pos];

  function expr(): Node {
    let left = term();
    while (peek() && peek().t === 'op' && ((peek() as any).v === '+' || (peek() as any).v === '-')) {
      const op = (tokens[pos++] as any).v;
      left = { k: 'bin', op, a: left, b: term() };
    }
    return left;
  }
  function term(): Node {
    let left = factor();
    while (peek() && peek().t === 'op' && ((peek() as any).v === '*' || (peek() as any).v === '/')) {
      const op = (tokens[pos++] as any).v;
      left = { k: 'bin', op, a: left, b: factor() };
    }
    return left;
  }
  function factor(): Node {
    const tk = tokens[pos++];
    if (!tk) throw new Error('Fórmula incompleta');
    if (tk.t === 'num') return { k: 'num', v: tk.v };
    if (tk.t === 'ref') return { k: 'ref', v: tk.v };
    if (tk.t === 'op' && tk.v === '-') return { k: 'neg', a: factor() };
    if (tk.t === 'op' && tk.v === '+') return factor();
    if (tk.t === 'lp') {
      const n = expr();
      if (!tokens[pos] || tokens[pos].t !== 'rp') throw new Error('Parêntese "(" sem fechamento');
      pos++;
      return n;
    }
    throw new Error('Expressão inválida');
  }

  const raiz = expr();
  if (pos < tokens.length) throw new Error('Trecho inesperado ao final da fórmula');
  return raiz;
}

function coletarRefs(n: Node, out: Set<string>) {
  if (n.k === 'ref') out.add(n.v);
  else if (n.k === 'neg') coletarRefs(n.a, out);
  else if (n.k === 'bin') { coletarRefs(n.a, out); coletarRefs(n.b, out); }
}

/** Valida sintaxe e referências. Retorna null se OK, ou a mensagem de erro. */
export function validarFormula(formula: string, codigosDisponiveis: string[] = []): string | null {
  if (!formula.trim()) return 'Informe a fórmula';
  try {
    const ast = parse(tokenizar(formula));
    const refs = new Set<string>();
    coletarRefs(ast, refs);
    const disp = new Set(codigosDisponiveis.map(c => c.trim().toUpperCase()));
    const faltando = Array.from(refs).filter(r => !disp.has(r));
    if (faltando.length > 0) return `Código(s) não encontrado(s): ${faltando.join(', ')}`;
    return null;
  } catch (e: any) {
    return e.message || 'Fórmula inválida';
  }
}

/** Calcula a fórmula com os valores informados. Retorna null se faltar valor ou houver divisão por zero. */
export function calcularFormula(formula: string, valores: Record<string, number>): number | null {
  const ast = parse(tokenizar(formula));
  const mapa: Record<string, number> = {};
  Object.keys(valores).forEach(k => { mapa[k.trim().toUpperCase()] = valores[k]; });

  function ev(n: Node): number | null {
    if (n.k === 'num') return n.v;
    if (n.k === 'ref') return n.v in mapa && Number.isFinite(mapa[n.v]) ? mapa[n.v] : null;
    if (n.k === 'neg') { const a = ev(n.a); return a === null ? null : -a; }
    const a = ev(n.a);
    const b = ev(n.b);
    if (a === null || b === null) return null;
    if (n.op === '+') return a + b;
    if (n.op === '-') return a - b;
    if (n.op === '*') return a * b;
    return b === 0 ? null : a / b;
  }
  return ev(ast);
}

/** Aplica a máscara (ex.: "0.00" => 2 casas decimais). Sem máscara, retorna o número como está. */
export function aplicarMascara(valor: number, mascara?: string): string {
  const m = (mascara || '').trim();
  if (!m) return String(valor);
  const dec = m.match(/[.,](0+)/);
  return valor.toFixed(dec ? dec[1].length : 0);
}

/**
 * Aplica os calculados marcados como "automáticos" sobre os valores retornados pelo aparelho.
 * Calculados anteriores podem ser usados por posteriores (encadeamento na ordem da lista).
 */
export function aplicarCalculadosAutomaticos(
  calculados: ICalculadoFormula[],
  valores: Record<string, number>
): Record<string, string> {
  const contexto = { ...valores };
  const saida: Record<string, string> = {};
  for (const c of calculados) {
    if (!c.calcularAutomaticamente) continue;
    try {
      const r = calcularFormula(c.formula, contexto);
      if (r !== null) {
        contexto[c.codigo.trim().toUpperCase()] = r;
        saida[c.codigo] = aplicarMascara(r, c.mascara);
      }
    } catch { /* fórmula inválida: ignora */ }
  }
  return saida;
}
