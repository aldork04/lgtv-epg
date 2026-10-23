// Runs on the rooted LG TV. GET /m1.m3u8 (m2, duna, m5, dunaworld) redirects to MédiaKlikk's current stream for that
// channel: its address carries a token that is short-lived and bound to the home IP, so it is fetched at play time.
const http = require('http'), https = require('https');

const PORT = 8790;
const IDS = { m1: 'mtv1live', m2: 'mtv2live', duna: 'dunalive', m5: 'mtv5live', dunaworld: 'mtv4plus' };

function streamUrl(id) {
  return new Promise((resolve, reject) => {
    const req = https.get(`https://player.mediaklikk.hu/playernew/player.php?video=${id}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', c => body += c);
      res.on('end', () => {
        const m = body.replace(/\\\//g, '/').match(/https?:\/\/[^"' ]+?\.m3u8[^"' ]*/);
        m ? resolve(m[0]) : reject(new Error('no stream on the player page'));
      });
    });
    req.on('timeout', () => req.destroy(new Error('timed out')));
    req.on('error', reject);
  });
}

http.createServer(async (req, res) => {
  const id = IDS[req.url.slice(1).replace(/\.m3u8.*$/, '')];
  if (!id) { res.writeHead(404); return res.end('unknown channel\n'); }
  try {
    res.writeHead(302, { Location: await streamUrl(id), 'Cache-Control': 'no-store' });
    res.end();
  } catch (e) {
    res.writeHead(502); res.end(e.message + '\n');
  }
}).listen(PORT, () => console.log('mk-resolver on ' + PORT));
