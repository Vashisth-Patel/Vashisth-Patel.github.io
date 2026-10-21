/** A deliberately small line-based highlighter for the Python and JS originals in public/bits/src/. */
import { h } from './dom';

const KW: Record<'py' | 'js', Set<string>> = {
  py: new Set(
    'False None True and as break class continue def elif else for from global if import in is not or pass return while with'.split(' '),
  ),
  js: new Set('var let const function if else for while switch case break default return new true false null'.split(' ')),
};
const BUILTIN: Record<'py' | 'js', Set<string>> = {
  py: new Set('self super print range len random time'.split(' ')),
  js: new Set('document window this console Math Audio setTimeout'.split(' ')),
};

const TOKEN =
  /(#.*$|\/\/.*$)|("(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|`(?:[^`\\]|\\.)*`?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+|.)/g;

export function highlightLine(line: string, lang: 'py' | 'js'): Node[] {
  const nodes: Node[] = [];
  TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  let prev = '';
  while ((m = TOKEN.exec(line))) {
    const [tok, comment, str, num, word] = m;
    if (comment !== undefined && (lang === 'py' ? tok.startsWith('#') : tok.startsWith('//'))) {
      nodes.push(h('span', { class: 'hl-c' }, tok));
    } else if (comment !== undefined) {
      // '#' in JS or '//' in Python: not a comment, emit as plain text
      nodes.push(document.createTextNode(tok));
    } else if (str !== undefined) {
      nodes.push(h('span', { class: 'hl-s' }, tok));
    } else if (num !== undefined) {
      nodes.push(h('span', { class: 'hl-n' }, tok));
    } else if (word !== undefined) {
      if (KW[lang].has(word)) nodes.push(h('span', { class: 'hl-k' }, tok));
      else if (BUILTIN[lang].has(word)) nodes.push(h('span', { class: 'hl-b' }, tok));
      else if (prev === 'def' || prev === 'class' || prev === 'function') nodes.push(h('span', { class: 'hl-f' }, tok));
      else nodes.push(document.createTextNode(tok));
      prev = word;
      continue;
    } else {
      nodes.push(document.createTextNode(tok));
    }
    if (tok.trim()) prev = tok;
  }
  return nodes;
}
