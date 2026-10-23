# lgtv-epg

XMLTV guide for the iptv-org Hungarian playlist (`languages/hun.m3u`), made for CleanYourTV Live TV on LG webOS.

A GitHub Action runs twice a day: `select.js` picks one [iptv-org/epg](https://github.com/iptv-org/epg) source per channel
of the playlist, the grabber downloads two days, and the result is published at
`https://aldork04.github.io/lgtv-epg/guide.xml`.

The programmes are rewritten with `channel=` first and the title and description on their own lines, because CleanYourTV's
guide reader expects that layout.

Another playlist: change `PLAYLIST` in `.github/workflows/epg.yml`.
