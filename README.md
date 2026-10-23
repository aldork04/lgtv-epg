# lgtv-epg

XMLTV guide for the iptv-org Hungarian playlist (`languages/hun.m3u`), made for CleanYourTV Live TV on LG webOS.

A GitHub Action runs twice a day: `select.js` picks one [iptv-org/epg](https://github.com/iptv-org/epg) source per channel
of the playlist (port.hu channels are matched by name, since they carry no iptv-org id; musor.tv and its relatives refuse
GitHub's runners), the grabber downloads two days, and the result is published at
`https://aldork04.github.io/lgtv-epg/guide.xml`.

The programmes are rewritten with `channel=` first and the title and description on their own lines, because CleanYourTV's
guide reader expects that layout.

It also publishes `https://aldork04.github.io/lgtv-epg/playlist.m3u`: only the channels listed in `channels.txt`, in that
order (the order is the channel number on the TV), with the guide address in its header. The guide covers these channels.

M1, M2, Duna, M5 and Duna World come from MédiaKlikk's official streams instead (`overrides.m3u`). Their address has a
short-lived token bound to the home IP, so `tv/mk-resolver.js` runs on the rooted TV (port 8790, started at boot by
`tv/20-mk-resolver` in `/var/lib/webosbrew/init.d/`) and redirects to a fresh one at play time. The TV has to be on and
keep the address 192.168.1.146.

Change the channels or their order: edit `channels.txt`. Another source playlist: change `PLAYLIST` in
`.github/workflows/epg.yml`.
