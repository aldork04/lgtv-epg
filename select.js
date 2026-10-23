// Picks one iptv-org/epg source per channel of an M3U playlist and writes a channels.xml for `npm run grab`.
// Usage (from the iptv-org/epg checkout): node select.js <playlist-url> <output.xml>
const fs = require('fs'), path = require('path');

// Sites tried first, in this order; any other site that knows the channel comes after.
const PREFERRED = ['musor.tv', 'tvmusor.hu', 'mediaklikk.hu'];

async function main([playlistUrl, out = 'custom.channels.xml']) {
  const m3u = await (await fetch(playlistUrl)).text();
  const ids = new Set([...m3u.matchAll(/tvg-id="([^"]+)"/g)].map(m => m[1]));

  const rank = site => { const i = PREFERRED.indexOf(site); return i < 0 ? PREFERRED.length : i; };
  const best = new Map();
  for (const site of fs.readdirSync('sites')) {
    const dir = path.join('sites', site);
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.channels.xml'))) {
      for (const line of fs.readFileSync(path.join(dir, f), 'utf8').match(/<channel\b[^>]*>[^<]*<\/channel>/g) || []) {
        const id = (line.match(/xmltv_id="([^"]*)"/) || [])[1];
        if (!ids.has(id)) continue;
        const prev = best.get(id);
        if (!prev || rank(site) < rank(prev.site)) best.set(id, { site, line });
      }
    }
  }

  const lines = [...best.values()].map(b => '  ' + b.line);
  fs.writeFileSync(out, '<?xml version="1.0" encoding="UTF-8"?>\n<channels>\n' + lines.join('\n') + '\n</channels>\n');
  console.log(`${ids.size} channels in the playlist, ${best.size} with a guide source -> ${out}`);
}

main(process.argv.slice(2)).catch(e => { console.error(e); process.exit(1); });
