// Writes an M3U with only the channels listed in channels.txt, in that order, taken from a source playlist.
// Usage: node playlist.js <source-playlist-url> <channels.txt> <output.m3u> [guide-url]
// Entries in overrides.m3u (next to this script) replace the source's entries with the same tvg-id.
const fs = require('fs'), path = require('path');

// An entry is its #EXTINF line, any option lines (#EXTVLCOPT...) and the stream address; a channel can have several.
function entries(m3u) {
  const byId = new Map();
  let entry = null;
  for (const line of m3u.split(/\r?\n/)) {
    if (line.startsWith('#EXTINF')) entry = [line];
    else if (entry && line.startsWith('#')) entry.push(line);
    else if (entry && line.trim()) {
      entry.push(line);
      const id = (entry[0].match(/tvg-id="([^"]*)"/) || [])[1] || '';
      (byId.get(id) || byId.set(id, []).get(id)).push(entry.join('\n'));
      entry = null;
    }
  }
  return byId;
}

async function main([src, list, out, guide]) {
  const want = fs.readFileSync(list, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  const byId = entries(await (await fetch(src)).text());
  const overrides = path.join(__dirname, 'overrides.m3u');
  if (fs.existsSync(overrides)) for (const [id, e] of entries(fs.readFileSync(overrides, 'utf8'))) byId.set(id, e);

  const missing = want.filter(id => !byId.has(id));
  const head = guide ? `#EXTM3U x-tvg-url="${guide}"` : '#EXTM3U';
  fs.writeFileSync(out, [head, ...want.flatMap(id => byId.get(id) || [])].join('\n') + '\n');
  console.log(`${want.length - missing.length} of ${want.length} channels -> ${out}`);
  if (missing.length) console.log('not in the source playlist:', missing.join(', '));
}

main(process.argv.slice(2)).catch(e => { console.error(e); process.exit(1); });
