# DC-bot-server-maker

Minecraft community, marketplace and developer Discord bot.

## Start
```bash
git pull origin main
npm install
cp .env.example .env
# Set DISCORD_TOKEN in .env; never commit or share it.
npm start
``

## Added prefix commands
- Voice/TTS: !join, !stay, !leave, !say text, !lang hi|ur|en, !autoread on|off
- Music: !play URL/search, !queue, !skip, !pause, !resume, !stop
- AutoMod/logs: !automod on|off, !setlogs #channel
- Minecraft Java status: !mcset host, !mcstatus
- AI: !ai question, !image prompt (requires API key and model access)
- Community: !level, !poll Question | A | B, !giveaway minutes prize
- Schematics: attach a `.litematic` or `.schem` file and run `!schematic`; buttons show material summary and saved build coordinates. Use `!buildcoords X Y Z` to save an origin. The module currently analyses/plans only; it does not automate public-server building or AFK farming.
- !help lists commands. Existing slash commands, server templates, tickets, role panels, moderation and marketplace scanner are preserved.

## Discord setup
Enable Message Content Intent in Developer Portal. Bot needs Connect/Speak for voice, Manage Messages for AutoMod, and View/Send Messages in log channel. Existing slash commands remain; new modules use the configurable ! prefix.

## 24/7 limitations
!stay saves the voice channel and attempts reconnects while the Node process is alive. Codespaces can sleep/stop, so it cannot guarantee 24/7 uptime there. Use an always-on VPS/container and a process supervisor. Dashboard API is read-only at /health on port 8000 by default.

## Notes
TTS uses a Google Translate TTS endpoint and may be rate-limited. Music streaming depends on third-party source compatibility. AI assistant/image generation require API billing and access. AutoMod is a basic filter, not complete protection. Minecraft status currently checks Java servers.
