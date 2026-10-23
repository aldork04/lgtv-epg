// Picks one iptv-org/epg source per channel of an M3U playlist and writes a channels.xml for `npm run grab`.
// Usage (from the iptv-org/epg checkout): node select.js <playlist-url> <output.xml>
const fs = require('fs'), path = require('path');

// Sites tried first, in this order; any other site that knows the channel comes after.
const PREFERRED = ['mediaklikk.hu', 'port.hu'];
// Sites that answer 403/404 from GitHub's runners: never picked.
const BLOCKED = ['musor.tv', 'tvmusor.hu', 'tvmustra.hu', 'tvprofil.com'];
// Sites whose channels have no xmltv_id: matched to the playlist by channel name.
const BY_NAME = ['port.hu'];

const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\(.*?\)|\[.*?\]/g, '').replace(/\b(hd|fhd|uhd|4k|hungary|magyar|hungarian)\b/g, '').replace(/[^a-z0-9+]/g, '');

async function main([playlistUrl, out = 'custom.channels.xml']) {
  const m3u = await (await fetch(playlistUrl)).text();
  const ids = new Set(), names = new Map();   // normalized name -> set of ids
  const addName = (n, id) => { n = norm(n); if (n) (names.get(n) || names.set(n, new Set()).get(n)).add(id); };
  for (const m of m3u.matchAll(/tvg-id="([^"]+)"[^\n]*,([^\n]*)/g)) { ids.add(m[1]); addName(m[2], m[1]); }

  const channels = [];
  for (const site of fs.readdirSync('sites')) {
    const dir = path.join('sites', site);
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.channels.xml'))) {
      for (const line of fs.readFileSync(path.join(dir, f), 'utf8').match(/<channel\b[^>]*>[^<]*<\/channel>/g) || []) {
        const id = (line.match(/xmltv_id="([^"]*)"/) || [])[1], name = line.replace(/<[^>]*>/g, '');
        channels.push({ site, line, id, name });
        if (ids.has(id)) addName(name, id);   // other sites' names for a playlist channel help the name match
      }
    }
  }

  const rank = site => { const i = PREFERRED.indexOf(site); return i < 0 ? PREFERRED.length : i; };
  const best = new Map();
  const offer = (id, site, line) => { const prev = best.get(id); if (!prev || rank(site) < rank(prev.site)) best.set(id, { site, line }); };
  for (const c of channels) {
    if (BLOCKED.includes(c.site)) continue;
    if (ids.has(c.id)) offer(c.id, c.site, c.line);
    else if (BY_NAME.includes(c.site)) {
      const hits = new Set(c.name.split(' / ').flatMap(n => [...(names.get(norm(n)) || [])]));
      // ponytail: an exact normalized-name match only; ambiguous names are skipped rather than guessed
      if (hits.size === 1) { const id = [...hits][0]; offer(id, c.site, c.line.replace(/xmltv_id="[^"]*"/, `xmltv_id="${id}"`)); }
    }
  }

  const lines = [...best.values()].map(b => '  ' + b.line);
  fs.writeFileSync(out, '<?xml version="1.0" encoding="UTF-8"?>\n<channels>\n' + lines.join('\n') + '\n</channels>\n');
  console.log(`${ids.size} channels in the playlist, ${best.size} with a guide source -> ${out}`);
}

main(process.argv.slice(2)).catch(e => { console.error(e); process.exit(1); });
