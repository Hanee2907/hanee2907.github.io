// A mate-in-one puzzle visitors can solve: the classic back-rank mate.

import { sound } from './sound';
import { confetti } from './mascot';

type Piece = 'wK' | 'wR' | 'wP' | 'bK' | 'bR' | 'bP';

const START: Record<string, Piece> = {
  g1: 'wK', d1: 'wR', f2: 'wP', g2: 'wP', h2: 'wP', a2: 'wP',
  g8: 'bK', c2: 'bR', f7: 'bP', g7: 'bP', h7: 'bP', a7: 'bP',
};

const SOLUTION = { from: 'd1', to: 'd8' };

const FILES = 'abcdefgh';

function sq(file: number, rank: number): string {
  return FILES[file] + (rank + 1);
}

function coords(s: string): [number, number] {
  return [FILES.indexOf(s[0]), Number(s[1]) - 1];
}

/** Squares a white piece could move to (enough rules for this position). */
function targets(board: Record<string, Piece>, from: string): string[] {
  const piece = board[from];
  const [f, r] = coords(from);
  const out: string[] = [];
  const free = (s: string) => !board[s] || board[s][0] === 'b';
  if (piece === 'wR') {
    for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let x = f + df;
      let y = r + dr;
      while (x >= 0 && x < 8 && y >= 0 && y < 8) {
        const s = sq(x, y);
        if (board[s]?.[0] === 'w') break;
        out.push(s);
        if (board[s]) break;
        x += df;
        y += dr;
      }
    }
  } else if (piece === 'wK') {
    for (let df = -1; df <= 1; df++) {
      for (let dr = -1; dr <= 1; dr++) {
        const x = f + df;
        const y = r + dr;
        if ((df || dr) && x >= 0 && x < 8 && y >= 0 && y < 8 && free(sq(x, y))) out.push(sq(x, y));
      }
    }
  } else if (piece === 'wP') {
    const one = sq(f, r + 1);
    if (!board[one]) {
      out.push(one);
      if (r === 1 && !board[sq(f, r + 2)]) out.push(sq(f, r + 2));
    }
  }
  return out;
}

export function initPuzzle(): void {
  const root = document.getElementById('puzzle')!;
  const status = document.getElementById('puzzle-status')!;
  let board: Record<string, Piece> = { ...START };
  let selected: string | null = null;
  let solved = false;

  const render = () => {
    root.replaceChildren();
    const hints = selected ? targets(board, selected) : [];
    for (let rank = 7; rank >= 0; rank--) {
      for (let file = 0; file < 8; file++) {
        const s = sq(file, rank);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'pz ' + ((file + rank) % 2 === 0 ? 'dark' : 'light');
        cell.dataset.sq = s;
        cell.setAttribute('role', 'gridcell');
        const p = board[s];
        cell.setAttribute('aria-label', s + (p ? ` ${p[0] === 'w' ? 'white' : 'black'} ${nameOf(p)}` : ''));
        if (s === selected) cell.classList.add('is-sel');
        if (hints.includes(s)) cell.classList.add('is-target');
        if (solved && s === 'g8') cell.classList.add('is-mate');
        if (p) {
          const img = document.createElement('img');
          img.src = `/pieces/${p}.svg`;
          img.alt = '';
          cell.append(img);
        }
        root.append(cell);
      }
    }
  };

  root.addEventListener('click', (e) => {
    if (solved) return;
    const cell = (e.target as HTMLElement).closest<HTMLElement>('.pz');
    if (!cell) return;
    const s = cell.dataset.sq!;
    if (selected && targets(board, selected).includes(s)) {
      if (selected === SOLUTION.from && s === SOLUTION.to) {
        board = { ...board, [s]: board[selected] };
        delete board[selected];
        selected = null;
        solved = true;
        status.textContent = 'Checkmate! Rd8# is the back-rank mate: the black king is trapped by its own pawns. ♞';
        status.classList.add('is-win');
        sound.chord();
        render();
        confetti(root.querySelector<HTMLElement>('[data-sq="g8"]') ?? root);
        return;
      }
      sound.tap();
      status.textContent = 'Not quite, Black gets away. Look at the black king’s back rank and try again.';
      selected = null;
      render();
      root.querySelector(`[data-sq="${s}"]`)?.classList.add('is-wrong');
      return;
    }
    selected = board[s]?.[0] === 'w' && s !== selected ? s : null;
    render();
  });

  document.getElementById('puzzle-reset')!.addEventListener('click', () => {
    board = { ...START };
    selected = null;
    solved = false;
    status.textContent = 'White to play and win in one move. Can you find it?';
    status.classList.remove('is-win');
    render();
  });

  render();
}

function nameOf(p: Piece): string {
  return { K: 'king', R: 'rook', P: 'pawn' }[p[1] as 'K' | 'R' | 'P'];
}
