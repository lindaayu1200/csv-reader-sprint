const COMMA = 0;
const LINE_BREAK = 1;
const END = 2;

export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const n = text.length;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;

  let pos = 0;
  let line = 1;
  if (text.charCodeAt(0) === 0xfeff) pos = 1;

  let recordLine = 1;
  let recordRow = null;
  let lastEnded = END;
  let lastAdded = 0;

  function readUnquoted(prefix) {
    let added = 0;
    let start = pos;
    let pieces = null;
    for (;;) {
      let d = pos;
      let c = 0;
      while (d < n && (c = text.charCodeAt(d)) !== 44 && c !== 10 && c !== 13) d++;
      const seg = text.slice(start, d);
      added += d - start;
      if (d >= n) {
        lastEnded = END;
        lastAdded = added;
        pos = n;
        return pieces === null ? prefix + seg : (pieces.push(seg), prefix + pieces.join(''));
      }
      if (c === 44) {
        lastEnded = COMMA;
        lastAdded = added;
        pos = d + 1;
        return pieces === null ? prefix + seg : (pieces.push(seg), prefix + pieces.join(''));
      }
      if (c === 10 || text.charCodeAt(d + 1) === 10) {
        lastEnded = LINE_BREAK;
        lastAdded = added;
        pos = d + (c === 13 ? 2 : 1);
        line += 1;
        return pieces === null ? prefix + seg : (pieces.push(seg), prefix + pieces.join(''));
      }
      // lone CR
      if (pieces === null) pieces = [];
      pieces.push(seg);
      errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
      pos = d + 1;
      start = pos;
    }
  }

  function readQuoted() {
    const open = pos;
    const openLine = line;
    let i = pos + 1;
    let close = -1;
    let hasDoubled = false;
    let hasCR = false;
    let lf = 0;
    while (i < n) {
      const c = text.charCodeAt(i);
      if (c === 34) {
        if (i + 1 < n && text.charCodeAt(i + 1) === 34) { hasDoubled = true; i += 2; continue; }
        close = i; i += 1; break;
      }
      if (c === 13) { hasCR = true; lf += 1; i += (i + 1 < n && text.charCodeAt(i + 1) === 10) ? 2 : 1; continue; }
      if (c === 10) { lf += 1; i += 1; continue; }
      i += 1;
    }
    pos = i;
    if (close < 0) {
      pos = open + 1;
      line = openLine;
      errors.push({ code: 'unterminated_quote', line: recordLine, row: recordRow });
      return readUnquoted('"');
    }
    let value = text.slice(open + 1, close);
    line += lf;
    if (hasDoubled) {
      let k = value.indexOf('""');
      let out = value.slice(0, k + 1);
      let p = k + 2;
      for (;;) {
        const j = value.indexOf('""', p);
        if (j < 0) { out += value.slice(p); break; }
        out += value.slice(p, j + 1);
        p = j + 2;
      }
      value = out;
    }
    if (hasCR) {
      let k = value.indexOf('\r');
      let out = value.slice(0, k) + '\n';
      let p = k + 1;
      if (value.charCodeAt(p) === 10) p += 1;
      for (;;) {
        k = value.indexOf('\r', p);
        if (k < 0) { out += value.slice(p); break; }
        out += value.slice(p, k) + '\n';
        p = k + 1;
        if (value.charCodeAt(p) === 10) p += 1;
      }
      value = out;
    }

    if (pos >= n) { lastEnded = END; return value; }
    const c = text.charCodeAt(pos);
    if (c === 44) { pos += 1; lastEnded = COMMA; return value; }
    if (c === 10) { pos += 1; line += 1; lastEnded = LINE_BREAK; return value; }
    if (c === 13 && text.charCodeAt(pos + 1) === 10) { pos += 2; line += 1; lastEnded = LINE_BREAK; return value; }
    const junk = readUnquoted(value);
    if (lastAdded > 0) errors.push({ code: 'quote_junk', line: recordLine, row: recordRow });
    return junk;
  }

  for (;;) {
    while (pos < n) {
      const c = text.charCodeAt(pos);
      if (c === 10) { pos += 1; line += 1; }
      else if (c === 13 && text.charCodeAt(pos + 1) === 10) { pos += 2; line += 1; }
      else break;
    }
    if (pos >= n) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = new Array(width < 0 ? 16 : width + 4);
    let fc = 0;
    let field;
    let quoted;
    do {
      quoted = text.charCodeAt(pos) === 34;
      if (quoted) {
        field = readQuoted();
      } else {
        // Common case: an unquoted field with no stray CR, scanned inline.
        let d = pos;
        let c = 0;
        while (d < n && (c = text.charCodeAt(d)) !== 44 && c !== 10 && c !== 13) d++;
        if (d >= n) {
          field = text.slice(pos, d);
          lastEnded = END;
          pos = n;
        } else if (c === 44) {
          field = text.slice(pos, d);
          lastEnded = COMMA;
          pos = d + 1;
        } else if (c === 10 || text.charCodeAt(d + 1) === 10) {
          field = text.slice(pos, d);
          lastEnded = LINE_BREAK;
          pos = d + (c === 13 ? 2 : 1);
          line += 1;
        } else {
          field = readUnquoted('');
        }
      }
      fields[fc++] = field;
    } while (lastEnded === COMMA);
    fields.length = fc;

    if (fc === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fc;
    if (header && columns === null) { columns = fields; continue; }
    if (fc < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fc });
      while (fields.length < width) fields.push('');
    } else if (fc > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }
  return { columns: header ? (columns ?? []) : null, rows, errors };
}
