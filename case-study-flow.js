// Case study pages on smaller screens.
// On desktop, every piece of a case study is pinned at its Figma position on a
// 1440px canvas. That can't shrink to a tablet or phone, so this script builds a
// second, single-column copy of the page in reading order. css/responsive.css
// shows the copy below 1200px and the original canvas from 1200px up, so the
// desktop page is never touched.
//
// How the order is worked out, from the Figma positions (--x and --y):
// - Pieces are read top to bottom, and left to right when on the same line.
// - A small icon, number, ring, or label stays beside the text it belongs to.
// - Where the canvas has two columns (like image pairs with captions), the left
//   column is read first, then the right, so each caption stays with its image.
(function () {
  const main = document.querySelector('main.lumen');
  if (!main || !document.body.classList.contains('is-responsive')) return;

  const LINE = 24; // Pieces this close vertically are on the same line.
  const NARROW = 620; // Pieces up to this wide can sit in a column.
  const MIDDLE = 700; // Canvas x where the right column starts.

  // Parts that only make sense on the canvas: the tinted panels (their sections
  // get the tint instead), the logo layer used in dark mode, the second layer of
  // the Lumen logo, and the decorative arrow in the HR-Tech flow.
  const SKIP = '.lumen-panel, .illo-logos, .lumen-logo-white, svg.at';

  const read = (el, name) => parseFloat(el.style.getPropertyValue(name));

  // Where a unit ends on the canvas. Images know their height. Text doesn't, so
  // it counts from where it starts.
  function bottomOf(unit) {
    return Math.max(...unit.parts.map((p) => p.y + (parseFloat(p.el.getAttribute('height')) || 0)));
  }

  function widthOf(el) {
    const w = read(el, '--w');
    if (!Number.isNaN(w)) return w;
    if (el.tagName === 'IMG') return parseFloat(el.getAttribute('width')) || Infinity;
    if (el.classList.contains('lumen-ring')) return 24;
    return Infinity; // Headings and anything without a set width use the full column.
  }

  // An icon-like piece: small image, number, bulb, or ring.
  function isIcon(el) {
    if (el.classList.contains('lumen-ring')) return true;
    return el.tagName === 'IMG' && widthOf(el) <= 100;
  }

  function copyOf(el) {
    const copy = el.cloneNode(true);
    copy.classList.remove('at');
    copy.removeAttribute('style');
    // Ids stay only on the originals, which the Contents links point to.
    copy.removeAttribute('id');
    copy.querySelectorAll('[id]').forEach((child) => child.removeAttribute('id'));
    return copy;
  }

  // The audit table becomes cards on phones, so each cell needs its column name.
  function labelTableCells(table) {
    const headings = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    table.querySelectorAll('tbody tr').forEach((row) => {
      row.removeAttribute('style');
      [...row.cells].forEach((cell, index) => cell.setAttribute('data-label', headings[index] || ''));
    });
  }

  function buildSection(section) {
    const pieces = [...section.children]
      .filter((el) => el.classList.contains('at') && !el.matches(SKIP))
      .map((el) => ({ el, x: read(el, '--x'), y: read(el, '--y'), w: widthOf(el) }));

    // 1. Keep icons and labels beside their text.
    const used = new Set();
    const units = [];
    pieces.forEach((piece) => {
      if (used.has(piece)) return;
      const isLabel = piece.el.classList.contains('lumen-label');
      if (isIcon(piece.el) || isLabel) {
        let best = null;
        pieces.forEach((other) => {
          if (other === piece || used.has(other) || isIcon(other.el)) return;
          const dx = other.x - piece.x;
          const dy = Math.abs(other.y - piece.y);
          const fits = isLabel ? dx > 0 && dx <= 140 && dy <= 8 : dx > 0 && dx <= 130 && dy <= 40;
          if (fits && (!best || dy + dx < Math.abs(best.y - piece.y) + (best.x - piece.x))) best = other;
        });
        if (best) {
          used.add(piece);
          used.add(best);
          units.push({
            kind: isLabel ? 'label' : 'icon',
            parts: [piece, best],
            x: piece.x,
            y: Math.min(piece.y, best.y),
            w: best.w + (best.x - piece.x),
          });
          return;
        }
      }
      used.add(piece);
      units.push({ kind: 'single', parts: [piece], x: piece.x, y: piece.y, w: piece.w });
    });

    // 2. Read order: by line, then left to right.
    units.sort((a, b) => a.y - b.y || a.x - b.x);
    const lines = [];
    units.forEach((unit) => {
      const line = lines[lines.length - 1];
      if (line && unit.y - line[0].y <= LINE) line.push(unit);
      else lines.push([unit]);
    });
    const ordered = lines.flatMap((line) => line.sort((a, b) => a.x - b.x));

    // 3. Runs of narrow pieces that use both halves of the canvas become two columns.
    const blocks = [];
    let run = [];
    const endRun = () => {
      if (!run.length) return;
      let left = run.filter((u) => u.x < MIDDLE);
      let right = run.filter((u) => u.x >= MIDDLE);
      if (left.length && right.length) {
        // A piece that starts below everything in the other column, like a
        // closing line under a grid, comes after the columns instead.
        const leftEnd = Math.max(...left.map(bottomOf));
        const rightEnd = Math.max(...right.map(bottomOf));
        const after = [
          ...left.filter((u) => u.y > rightEnd),
          ...right.filter((u) => u.y > leftEnd),
        ].sort((a, b) => a.y - b.y || a.x - b.x);
        left = left.filter((u) => !after.includes(u));
        right = right.filter((u) => !after.includes(u));
        blocks.push({ columns: [left, right] });
        after.forEach((u) => blocks.push({ unit: u }));
      } else {
        run.forEach((u) => blocks.push({ unit: u }));
      }
      run = [];
    };
    ordered.forEach((unit) => {
      if (unit.w <= NARROW) run.push(unit);
      else {
        endRun();
        blocks.push({ unit });
      }
    });
    endRun();

    // 4. Build the copy.
    const out = document.createElement('section');
    out.className = 'flow-section';
    const label = section.getAttribute('aria-label');
    if (label) out.setAttribute('aria-label', label);
    if (section.querySelector('.lumen-panel')) out.classList.add('flow-section--panel');

    const renderUnit = (unit) => {
      if (unit.kind === 'single') return copyOf(unit.parts[0].el);
      const pair = document.createElement('div');
      pair.className = `flow-pair flow-pair--${unit.kind}`;
      unit.parts.forEach((part) => pair.append(copyOf(part.el)));
      return pair;
    };

    blocks.forEach((block) => {
      if (block.unit) {
        out.append(renderUnit(block.unit));
        return;
      }
      const cols = document.createElement('div');
      cols.className = 'flow-cols';
      block.columns.forEach((column) => {
        const col = document.createElement('div');
        col.className = 'flow-col';
        column.forEach((unit) => col.append(renderUnit(unit)));
        cols.append(col);
      });
      out.append(cols);
    });

    out.querySelectorAll('table').forEach(labelTableCells);
    return out;
  }

  const flow = document.createElement('div');
  flow.className = 'lumen-flow';
  [...main.children].forEach((child) => {
    if (child.tagName === 'SECTION') flow.append(buildSection(child));
  });
  flow.querySelector('.flow-section')?.classList.add('flow-section--intro');
  main.append(flow);
})();
