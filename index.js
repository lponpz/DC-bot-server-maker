require("dotenv").config();
const {Client,GatewayIntentBits,PermissionFlagsBits,ChannelType,SlashCommandBuilder,REST,Routes,EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle}=require("discord.js");
const fs=require("fs");
const {DISCORD_TOKEN:token,CLIENT_ID:clientId}=process.env;
const DEAL_DISCOUNT_PERCENT=Math.max(5,Number(process.env.DEAL_DISCOUNT_PERCENT||20));
const DEAL_SCAN_SECONDS=Math.max(30,Number(process.env.DEAL_SCAN_SECONDS||60));
const DEAL_SCAN_PAGES=Math.max(1,Math.min(20,Number(process.env.DEAL_SCAN_PAGES||10)));
if(!token||!clientId) throw new Error("Set DISCORD_TOKEN and CLIENT_ID in .env");
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,GatewayIntentBits.GuildMessageReactions,GatewayIntentBits.GuildInvites,GatewayIntentBits.GuildMembers,GatewayIntentBits.MessageContent,GatewayIntentBits.GuildVoiceStates]});
const roles=[
["👑 Owner",0xF1C40F,true],["🛡️ Administrator",0xE74C3C,true],["🔨 Senior Moderator",0xE67E22,true],["🛡️ Moderator",0x3498DB,true],["🤖 Bot",0x5865F2,true],
["👑 SMP Owner",0xF1C40F,true],["🛡️ SMP Staff",0xE74C3C,true],["💎 VIP Trader",0x9B59B6,true],["⭐ Trusted Trader",0xF1C40F,true],["🏪 Verified Seller",0x2ECC71,true],["🛒 Seller",0x27AE60,false],["💰 Buyer",0x3498DB,false],["🔄 Trader",0xF39C12,false],["💎 Collector",0x00CEC9,false],["🔥 Flipper",0xE17055,false],["💻 Developer",0x5865F2,true],["☕ Java Developer",0xE67E22,false],["🧩 Paper Developer",0x2ECC71,false],["⚡ Velocity Developer",0x9B59B6,false],["🧪 Tester",0xE84393,false],["🎨 Designer",0x00B894,false],["🐛 Bug Hunter",0xD63031,false],["📦 Plugin Creator",0x0984E3,false],["🏆 Contributor",0x6C5CE7,false],["🌟 Community Member",0x95A5A6,false],["✨ New Member",0x7F8C8D,false]
];
const animatedRoleColors={
 "💎 VIP Trader":[0x9B59B6,0x5865F2,0x00CEC9,0xE056FD],
 "⭐ Trusted Trader":[0xF1C40F,0xF39C12,0xE67E22,0xF8C471],
 "🏪 Verified Seller":[0x2ECC71,0x00B894,0x1ABC9C,0x27AE60],
 "🔥 Flipper":[0xE17055,0xE74C3C,0xF39C12,0xD63031],
 "💻 Developer":[0x5865F2,0x3498DB,0x6C5CE7,0x0984E3],
 "🏆 Contributor":[0x6C5CE7,0x9B59B6,0xE056FD,0x5865F2]
};
const groups={"📌 START HERE":[["👋・welcome","text"],["📜・rules","text"],["📢・announcements","text"],["🧭・server-info","text"],["🎭・roles","text"],["💱・how-to-trade","text"]],"🌐 SMP COMMUNITY":[["💬・general","text"],["🤝・introductions","text"],["📸・screenshots","text"],["🏆・leaderboards","text"],["🎉・events","text"],["🎁・giveaways","text"],["💡・suggestions","text"]],"🛒 ITEM MARKET":[["🛍️・item-market","text"],["🏷️・selling-items","text"],["💰・buying-items","text"],["🌾・farm-buying","text"],["🌾・farm-selling","text"],["🔄・item-trades","text"],["💎・rare-items","text"],["📦・bulk-items","text"],["🔥・deals","text"],["⭐・seller-reviews","text"]],"💵 SMP ECONOMY":[["📈・price-check","text"],["💹・market-prices","text"],["🏪・player-shops","text"],["💎・rare-item-prices","text"],["📊・economy-chat","text"]],"🛡️ SAFE TRADING":[["🔐・trade-rules","text"],["🚨・scam-reports","text"],["⚖️・trade-disputes","text"],["✅・trusted-traders","text"]],"☕ PLUGIN DEVELOPMENT":[["☕・java-help","text"],["🧩・paper","text"],["🔧・spigot","text"],["⚡・velocity","text"],["❓・plugin-help","text"],["🔍・code-review","text"],["📦・plugin-showcase","text"],["🐛・bug-reports","text"]],"🤝 SERVICES":[["💼・commissions","text"],["👨‍💻・looking-for-dev","text"],["🎨・design-services","text"],["📢・developer-ads","text"]],"🎫 SUPPORT":[["🎟️・create-ticket","text"],["📮・support","text"],["🤖・bot-commands","text"],["📨・invite-log","text"],["🏠・base","text"],["🌾・farm-buying","text"],["🌾・farm-selling","text"]],"🔊 VOICE":[["🎮・SMP Lounge","voice"],["🛒・Trading Lounge","voice"],["💻・Developer Lounge","voice"],["🔊・General","voice"]],"🔒 STAFF":[["🛡️・staff-chat","text"],["📋・reports","text"],["📜・mod-logs","text"],["💰・market-moderation","text"],["🔧・staff-tools","text"]]};
async function role(g,n,c,h){return g.roles.cache.find(x=>x.name===n)||g.roles.create({name:n,color:c,hoist:h,reason:"SMP marketplace template"})}
async function cat(g,n){return g.channels.cache.find(x=>x.type===ChannelType.GuildCategory&&x.name===n)||g.channels.create({name:n,type:ChannelType.GuildCategory})}
async function channel(g,p,n,t){let x=g.channels.cache.find(c=>c.name===n&&c.parentId===p.id);if(x)return x;return g.channels.create({name:n,parent:p.id,type:t==="voice"?ChannelType.GuildVoice:t==="forum"?ChannelType.GuildForum:ChannelType.GuildText})}
async function setup(g){await g.channels.fetch();await g.roles.fetch();const rm={},cm={},ch={};for(const [n,c,h] of roles)rm[n]=await role(g,n,c,h);for(const [n,items] of Object.entries(groups)){cm[n]=await cat(g,n);for(const [cn,t] of items)ch[cn]=await channel(g,cm[n],cn,t)}const staff=["Owner","Administrator","Senior Moderator","Moderator"];await cm["🔒 STAFF"].permissionOverwrites.edit(g.roles.everyone,{ViewChannel:false});for(const n of staff)await cm["🔒 STAFF"].permissionOverwrites.edit(rm[n],{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});for(const n of ["👋・welcome","📜・rules","📢・announcements","🧭・server-info","🎭・roles","💱・how-to-trade","🔐・trade-rules"])await ch[n].permissionOverwrites.edit(g.roles.everyone,{SendMessages:false,ViewChannel:true});const posts={"🏠・base":"# 🏠 Base Marketplace Hub\\n\\nUse this channel for base locations, base-related trades, farms and build services.\\n\\n**Farm buying:** #🌾・farm-buying\\n**Farm selling:** #🌾・farm-selling\\n**Item market:** #🛍️・item-market\\n\\nDo not post coordinates or private base information without the owner’s permission.\\n","🌾・farm-buying":"# 🌾 Farm Buying\\n\\n**Farm:**\\n**Quantity / Size:**\\n**Price:**\\n**SMP:**\\n**Delivery:**\\n**Proof:**\\n\\nUse clear prices and do not misrepresent farms.\\n","🌾・farm-selling":"# 🌾 Farm Selling\\n\\n**Farm:**\\n**Type:**\\n**Capacity:**\\n**Price:**\\n**SMP:**\\n**Location/Delivery:**\\n**Proof:**\\n\\nNever share private credentials.\\n","👋・welcome":"# 👋 Welcome to the SMP Marketplace Community!\n\n🛒 Buy & sell Minecraft items\n💰 Trade & build your SMP economy\n🏪 Find player shops\n💎 Discover rare items\n💻 Plugin & developer community\n\nRead the rules, choose roles and head to **🛒 ITEM MARKET**.","📜・rules":"# 📜 Rules\n\n1. Be respectful.\n2. No scams, impersonation or deceptive listings.\n3. No stolen, pirated, malicious or prohibited content.\n4. Never share passwords, tokens or private keys.\n5. Use the correct marketplace channel.\n6. Verify trades before sending money/items.\n7. Report suspicious users to staff.\n8. Follow Discord ToS and Community Guidelines.","🧭・server-info":"# 🧭 SMP Marketplace\n\n**Buy • Sell • Trade • Build • Develop**\n\nA player-driven Minecraft SMP marketplace and developer community.\n\nUse forums for individual listings so buyers can find offers and sellers can keep listings organized.","🎭・roles":"# 🎭 Roles\n\n🏷️ Seller\n⭐ Verified Seller\n🛒 Buyer\n💱 Trader\n💎 Trusted Trader\n💻 Developer\n🧪 Tester\n🎨 Designer","💱・how-to-trade":"# 💱 Listing Template\n\n**Item:**\n**Quantity:**\n**Price:**\n**Payment:**\n**Server/SMP:**\n**Delivery:**\n**Proof:**\n\nNever send credentials. Staff do not automatically guarantee private trades.","🔐・trade-rules":"# 🔐 Safe Trading\n\n• Check seller history and reviews.\n• Ask for proof when appropriate.\n• Never share account credentials.\n• Report suspicious listings.\n• For valuable trades, use an official escrow/trade system only if the server provides one."};for(const [n,t] of Object.entries(posts))await ch[n]?.send(t).catch(()=>{});return[Object.keys(groups).length,Object.values(groups).flat().length,roles.length]}
async function makeRolePanel(g,channel,mode){
 const map=mode==="trading"?{"🛒":["🛒 Seller","List items for sale"],"💰":["💰 Buyer","Looking to buy"],"🔄":["🔄 Trader","Trade items"],"⭐":["⭐ Trusted Trader","Trusted marketplace member"],"💎":["💎 Collector","Rare-item collector"],"🔥":["🔥 Flipper","Market flipper"],"🏪":["🏪 Verified Seller","Verified seller"]}:{"💻":["💻 Developer","Minecraft developer"],"☕":["☕ Java Developer","Java development"],"🧩":["🧩 Paper Developer","Paper plugins"],"⚡":["⚡ Velocity Developer","Velocity proxy"],"🧪":["🧪 Tester","Testing & QA"],"🎨":["🎨 Designer","Design & graphics"],"🐛":["🐛 Bug Hunter","Find & report bugs"],"📦":["📦 Plugin Creator","Plugin publishing"],"🏆":["🏆 Contributor","Community contributor"]};
 const title=mode==="trading"?"# 🛒✨ TRADING & MARKET ROLES":"# 💻✨ DEVELOPER & CREATOR ROLES";
 const lines=Object.entries(map).map(([e,[r,d]])=>e+" **"+r+"** — "+d).join("\n");
 const msg=await channel.send(title+"\n\nReact with an emoji to **get** a role. Remove your reaction to **remove** it.\n\n"+lines+"\n\n✨ **Animated:** premium/community roles can smoothly cycle through matching colors.");
 for(const e of Object.keys(map))await msg.react(e); await msg.pin().catch(()=>{}); return msg;
}
async function animateRoles(){
 for(const g of client.guilds.cache.values()){
  for(const [name,colors] of Object.entries(animatedRoleColors)){
   const r=g.roles.cache.find(x=>x.name===name);
   if(!r||r.managed)continue;
   const index=Math.floor(Date.now()/180000)%colors.length;
   await r.setColor(colors[index],"SMP animated role color").catch(()=>{});
  }
 }
}
async function resetBotStructure(g){
 await g.channels.fetch(); await g.roles.fetch();
 const managedCategories=new Set([
 "📌 START HERE","🌐 SMP COMMUNITY","🛒 ITEM MARKET","💵 SMP ECONOMY","🛡️ SAFE TRADING","☕ PLUGIN DEVELOPMENT","🤝 SERVICES","🎫 SUPPORT","🔊 VOICE","🔒 STAFF",
 "📌・START HERE","🌐・PUBLIC COMMUNITY","❤️・LIFESTEAL SMP","⚔️・PVP & TEAMS","💰・TRADING & ECONOMY","🎉・EVENTS & REWARDS","🎫・HELP & REPORTS","🔒・STAFF HQ",
 "📌・SERVER INFO","❤️・LIFESTEAL","⚔️・PVP & TEAMS","💰・ECONOMY","🎉・EVENTS","🎫・SUPPORT","🔒・STAFF",
 "📌・COMPETITIVE INFO","⚔️・RANKED LIFESTEAL","🏟️・TOURNAMENTS","🧰・LOADOUTS",
 "📌・HARDCORE INFO","☠️・HARDCORE LIFESTEAL","🔥・BOUNTIES",
 "📌・CRYSTAL INFO","💎・CRYSTAL PVP","🧪・KITS & LOADOUTS",
 "📌・SEASON INFO","🌱・SEASONAL LIFESTEAL",
 "📌・SKYBLOCK INFO","🏝️・ISLANDS","⛏️・MINIONS",
 "📌・PRISON INFO","⛏️・MINES","💰・PRESTIGE",
 "📌・MCFA START HERE","🎁・MCFA GIVEAWAYS","🌐・BIG COMMUNITY","🎉・EVENTS & REWARDS","🛡️・SAFETY & SUPPORT","🔒・STAFF ONLY",
 "📌 START HERE","🎁 MCFA GIVEAWAYS","🌐 BIG COMMUNITY","🎉 EVENTS & REWARDS","🛡️ SAFETY & SUPPORT","🔒 STAFF ONLY"
 ]);
 const managedRoleNames=new Set(roles.map(x=>x[0]));
 const templateRoleNames=new Set(["👑 Network Owner","🛡️ Admin","🔨 Moderator","🎥 Creator","💎 Supporter","❤️ Lifesteal Player","🔔 Event Pings","👑 Lifesteal Owner","🛡️ Lifesteal Staff","💀 Heart Hunter","💎 Donor","🛡️ Competitive Staff","⚔️ Ranked Fighter","💀 Kill Leader","🏆 Tournament Winner","👑 Hardcore Owner","🛡️ Hardcore Staff","☠️ Survivor","🔥 Bounty Hunter","🏅 Last Survivor","👑 MCFA Owner","🛡️ MCFA Admin","🔨 MCFA Moderator","🎁 Giveaway Host","✅ Verified Member","🎮 Minecraft Player","💎 Premium Member","🔔 Giveaway Pings","🌟 Community Member"]);
 const managedCategoryIds=new Set([...g.channels.cache.values()].filter(ch=>ch.type===ChannelType.GuildCategory&&managedCategories.has(ch.name)).map(ch=>ch.id));
 for(const ch of [...g.channels.cache.values()]){
  if(ch.id===g.id||ch.type===ChannelType.GuildCategory)continue;
  const isTicket=ch.name.startsWith("ticket-");
  const isInsideManagedCategory=managedCategoryIds.has(ch.parentId);
  const isKnownManagedChannel=Object.values(groups).flat().some(x=>x[0]===ch.name);
  if(isTicket||isInsideManagedCategory||isKnownManagedChannel)await ch.delete("Bot-managed structure reset").catch(e=>console.error("Could not delete channel "+ch.name+": "+e.message));
 }
 for(const ch of [...g.channels.cache.values()])if(ch.type===ChannelType.GuildCategory&&managedCategories.has(ch.name))await ch.delete("Bot-managed category reset").catch(e=>console.error("Could not delete category "+ch.name+": "+e.message));
 await g.channels.fetch();
 for(const r of [...g.roles.cache.values()]){
  if(r.managed||r.id===g.id||r.name==="@everyone")continue;
  if(managedRoleNames.has(r.name)||templateRoleNames.has(r.name))await r.delete("Bot-managed roles reset").catch(e=>console.error("Could not delete role "+r.name+": "+e.message));
 }
 await g.channels.fetch(); await g.roles.fetch();
}
async function ensureServerIcon(g){if(g.icon)return false;try{const png=makeSmpIconPng();await g.setIcon(png,"Automatic SMP marketplace icon");return true}catch(e){console.error("Server icon:",e.message);return false;}}
function makeSmpIconPng(){const zlib=require("zlib");const w=256,h=256;const raw=[];for(let y=0;y<h;y++){raw.push(0);for(let x=0;x<w;x++){const dx=x-128,dy=y-128,d=Math.sqrt(dx*dx+dy*dy);let rr=18,gg=25,bb=38;if(d<112){rr=46;gg=204;bb=113;}if(d<88){rr=24;gg=32;bb=48;}if((x>48&&x<208&&y>96&&y<160)||(x>112&&x<144&&y>52&&y<204)){rr=46;gg=204;bb=113;}raw.push(rr,gg,bb,255);}}const crc32=b=>{let c=0xffffffff;for(const n of b){c^=n;for(let k=0;k<8;k++)c=(c>>>1)^(0xedb88320&-(c&1));}return (c^0xffffffff)>>>0};const chunk=(type,data)=>{const t=Buffer.from(type);const d=Buffer.from(data);const out=Buffer.alloc(12+d.length);out.writeUInt32BE(d.length,0);t.copy(out,4);d.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([t,d])),8+d.length);return out};const sig=Buffer.from([137,80,78,71,13,10,26,10]);const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;const idat=zlib.deflateSync(Buffer.from(raw));return Buffer.concat([sig,chunk("IHDR",ihdr),chunk("IDAT",idat),chunk("IEND",Buffer.alloc(0))]);}
async function installMode(g,mode){await g.roles.fetch();for(const [n,c,h] of roles)await role(g,n,c,h);let panel=g.channels.cache.find(x=>x.name==="🎭・roles");if(!panel)panel=await g.channels.create({name:"🎭・roles",type:ChannelType.GuildText});await makeRolePanel(g,panel,mode);return panel.name;}

async function setupMCFA(guild,mode="mcfa-full"){
  await guild.channels.fetch(); await guild.roles.fetch();
  const roleDefs=[
    ["👑 MCFA Owner",0xF1C40F,true],["🛡️ MCFA Admin",0xE74C3C,true],["🔨 MCFA Moderator",0xE67E22,true],
    ["🎁 Giveaway Host",0x9B59B6,true],["✅ Verified Member",0x2ECC71,false],["🎮 Minecraft Player",0x3498DB,false],
    ["💎 Premium Member",0x00CEC9,false],["🔔 Giveaway Pings",0xF1C40F,false],["🌟 Community Member",0x95A5A6,false]
  ];
  for(const [name,color,hoist] of roleDefs) await role(guild,name,color,hoist);
  const layout={
    "📌・START HERE":["👋・welcome","📜・rules","📢・announcements","🧭・how-it-works","🎭・get-roles"],
    "🎁・MCFA GIVEAWAYS":["🎁・mcfa-giveaways","📥・giveaway-entries","🏆・winners","📦・prize-proof"],
    "🌐・BIG COMMUNITY":["💬・general-chat","🎮・minecraft-chat","📸・media","🤝・introductions","💡・suggestions","📊・polls"],
    "🎉・EVENTS & REWARDS":["📅・events","🔥・daily-activity","🎯・invite-rewards","💎・reward-info"],
    "🛡️・SAFETY & SUPPORT":["🔐・safety-rules","🚨・report-scams","🎟️・create-ticket","❓・support"],
    "🔒・STAFF ONLY":["🛡️・staff-chat","📋・mod-logs","🎁・giveaway-management"]
  };
  const made={};
  for(const [catName,names] of Object.entries(layout)){
    const category=await cat(guild,catName);
    for(const name of names) made[name]=await channel(guild,category,name,"text");
    if(catName==="🔒・STAFF ONLY"){
      await category.permissionOverwrites.edit(guild.roles.everyone,{ViewChannel:false});
      for(const staffName of ["👑 MCFA Owner","🛡️ MCFA Admin","🔨 MCFA Moderator","🎁 Giveaway Host"]){
        const r=guild.roles.cache.find(x=>x.name===staffName);
        if(r)await category.permissionOverwrites.edit(r,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});
      }
    }
  }
  const info={
    "👋・welcome":"# 🌐 Welcome to the MCFA Community!\n\n🎁 MCFA-themed giveaways & events\n🎮 Minecraft community and chat\n🏆 Winner announcements and prize proof\n🛡️ Scam reports and staff support\n\nRead the rules and check #🎭・get-roles. Never share passwords, session tokens, or Microsoft verification codes.",
    "📜・rules":"# 📜 Community Rules\n\n1. Respect members and staff.\n2. No fake giveaways, fake proofs, or impersonation.\n3. Never ask for passwords, session cookies, recovery codes, or Microsoft verification codes.\n4. Giveaway rules and eligibility must be posted clearly.\n5. No spam, phishing links, malware, or stolen accounts.\n6. Prize providers must have the right to give away the prize.\n7. Follow Discord rules and Minecraft/Microsoft terms.",
    "🧭・how-it-works":"# 🧭 How Giveaways Work\n\n1. Read the giveaway post and eligibility.\n2. Use the giveaway entry button or instructions.\n3. Winners are selected fairly and announced in #🏆・winners.\n4. Prize proof is posted in #📦・prize-proof when safe.\n\nStaff will never need your password or login code to give you a prize.",
    "🎁・mcfa-giveaways":"# 🎁 MCFA GIVEAWAYS\n\nOfficial giveaway posts go here. Each post should state prize, end time, eligibility, winner count and claim deadline. Only run giveaways for accounts/prizes you lawfully own and are permitted to transfer. Never request a winner’s password or verification code.",
    "🔐・safety-rules":"# 🔐 Account Safety\n\nNever enter Microsoft credentials on a random verification page. Never share authentication codes, session cookies or recovery keys. Legitimate giveaways do not need your password. Report suspicious verification links to staff."
  };
  for(const [name,text] of Object.entries(info)) if(made[name]) await made[name].send(text).catch(()=>{});
  if(mode==="mcfa-giveaways"){
    const keep=new Set(["📌・START HERE","🎁・MCFA GIVEAWAYS","🛡️・SAFETY & SUPPORT","🔒・STAFF ONLY"]);
    for(const [catName] of Object.entries(layout)) if(!keep.has(catName)){
      const category=guild.channels.cache.find(x=>x.name===catName&&x.type===ChannelType.GuildCategory);
      if(category)for(const ch of category.children.cache.values())await ch.delete().catch(()=>{});
      if(category&&category.children.cache.size===0)await category.delete().catch(()=>{});
    }
  }
  return Object.values(layout).reduce((n,x)=>n+x.length,0);
}

async function setupTemplate(guild,mode){
  await guild.channels.fetch(); await guild.roles.fetch();
  const templates={
    "lifesteal-public":{roles:[["👑 Network Owner",0xF1C40F,true],["🛡️ Admin",0xE74C3C,true],["🔨 Moderator",0xE67E22,true],["🎥 Creator",0x9B59B6,false],["💎 Supporter",0x00CEC9,false],["❤️ Lifesteal Player",0xE84343,false],["🔔 Event Pings",0x3498DB,false]],groups:{
      "📌・START HERE":["👋・welcome","📜・server-rules","📢・announcements","🧭・how-to-join","🔗・server-ip","🎭・get-roles"],
      "🌐・PUBLIC COMMUNITY":["💬・general-chat","👋・introductions","🎮・minecraft-chat","📸・screenshots-and-clips","😂・memes","💡・suggestions","🗳️・community-polls"],
      "❤️・LIFESTEAL SMP":["❤️・lifesteal-chat","💀・kill-feed","🩸・heart-help","📊・player-stats","🏆・leaderboards","🗺️・world-and-warp-info"],
      "⚔️・PVP & TEAMS":["⚔️・find-a-fight","🤝・team-recruitment","🛡️・base-showcase","🎯・bounty-board","📹・pvp-clips"],
      "💰・TRADING & ECONOMY":["🛒・player-market","💎・rare-loot","🏪・player-shops","📈・price-checks"],
      "🎉・EVENTS & REWARDS":["📅・events","🎁・giveaways","🏆・winners","🌟・community-highlights"],
      "🎫・HELP & REPORTS":["🎟️・create-ticket","❓・player-help","🚨・report-player","🔐・scam-reports"],
      "🔒・STAFF HQ":["🛡️・staff-chat","📋・mod-logs","🚨・player-reports","🎁・event-management"]}},
    "lifesteal":{roles:[["👑 Lifesteal Owner",0xF1C40F,true],["🛡️ Lifesteal Staff",0xE74C3C,true],["💀 Heart Hunter",0x9B59B6,false],["❤️ Lifesteal Player",0xE84343,false],["💎 Donor",0x00CEC9,false]],groups:{
      "📌・SERVER INFO":["👋・welcome","📜・rules","📢・announcements","🧭・how-to-play","🔗・server-ip"],
      "❤️・LIFESTEAL":["💬・lifesteal-chat","💀・kill-feed","❤️・heart-help","🏆・top-killers","📊・leaderboards"],
      "⚔️・PVP & TEAMS":["⚔️・find-a-fight","🤝・team-recruitment","🛡️・base-showcase","📹・pvp-clips"],
      "💰・ECONOMY":["🛒・player-market","💎・rare-loot","🏪・player-shops"],
      "🎉・EVENTS":["📅・events","🎁・giveaways","🏆・winners"],
      "🎫・SUPPORT":["🎟️・create-ticket","🚨・player-reports"],
      "🔒・STAFF":["🛡️・staff-chat","📋・mod-logs"]}},
    "lifesteal-competitive":{roles:[["👑 Network Owner",0xF1C40F,true],["🛡️ Competitive Staff",0xE74C3C,true],["⚔️ Ranked Fighter",0xE67E22,false],["💀 Kill Leader",0x9B59B6,false],["🏆 Tournament Winner",0x00CEC9,false]],groups:{
      "📌・COMPETITIVE INFO":["👋・welcome","📜・rules","📢・season-updates","🗺️・arena-info","📊・rank-system"],
      "⚔️・RANKED LIFESTEAL":["💬・ranked-chat","🎯・find-ranked-fight","🏆・kill-leaderboard","💀・kill-feed","❤️・heart-strategy"],
      "🏟️・TOURNAMENTS":["📅・tournaments","📝・team-signups","🎁・prize-pool","🏆・winners"],
      "🧰・LOADOUTS":["🧪・kit-discussion","🛡️・armor-and-enchants","💎・loot-trading"],
      "🎫・SUPPORT":["🎟️・support-ticket","🚨・cheater-reports"],
      "🔒・STAFF":["🛡️・staff-chat","📋・reports-log"]}},
    "lifesteal-hardcore":{roles:[["👑 Hardcore Owner",0xF1C40F,true],["🛡️ Hardcore Staff",0xE74C3C,true],["☠️ Survivor",0x7F8C8D,false],["🔥 Bounty Hunter",0xE67E22,false],["🏅 Last Survivor",0x9B59B6,false]],groups:{
      "📌・HARDCORE INFO":["👋・welcome","📜・hardcore-rules","📢・season-status","☠️・death-policy","❤️・heart-system"],
      "☠️・SURVIVAL LOG":["💬・hardcore-chat","💀・death-reports","🏹・bounties","🗺️・sightings"],
      "⚔️・RAIDS & PVP":["⚔️・raid-planning","🛡️・base-defense","📹・fight-clips"],
      "🎁・SEASONS":["📅・season-events","🏆・season-winners","🎁・rewards"],
      "🎫・HELP":["🎟️・support-ticket","🚨・rule-reports"],
      "🔒・STAFF":["🛡️・staff-chat","📋・mod-logs"]}},
    "lifesteal-crystal":{roles:[["👑 Crystal Owner",0xF1C40F,true],["🛡️ Crystal Staff",0xE74C3C,true],["💎 Crystal PvPer",0x3498DB,false],["⚔️ Duelist",0x9B59B6,false],["🏆 Crystal Champion",0xE67E22,false]],groups:{
      "📌・CRYSTAL INFO":["👋・welcome","📜・rules","📢・updates","🧪・crystal-guide","🗺️・arena-info"],
      "💎・CRYSTAL PVP":["💬・crystal-chat","⚔️・find-a-duel","🎯・combos-and-aim","🧰・kits-and-loadouts","🏆・elo-leaderboard"],
      "❤️・LIFESTEAL META":["❤️・heart-strategy","💀・kill-feed","📊・stats-and-records"],
      "🎥・MEDIA":["📹・clips","📸・screenshots","🏆・tournament-wins"],
      "🎫・SUPPORT":["🎟️・support-ticket","🚨・cheater-reports"],
      "🔒・STAFF":["🛡️・staff-chat","📋・reports-log"]}},
    "lifesteal-seasonal":{roles:[["👑 Season Owner",0xF1C40F,true],["🛡️ Season Staff",0xE74C3C,true],["🌱 New Season Player",0x2ECC71,false],["🔥 Top Grinder",0xE67E22,false],["🏆 Season Champion",0x9B59B6,false]],groups:{
      "📌・SEASON INFO":["👋・welcome","📜・rules","📢・season-announcements","⏳・season-timer","🎯・season-goals"],
      "🌱・FRESH START":["💬・season-chat","🤝・team-finder","🏡・base-showcase","🗺️・starter-guide"],
      "⚔️・PROGRESSION":["💀・kill-feed","❤️・heart-progress","💰・economy-chat","🏆・season-leaderboard"],
      "🎉・SEASON EVENTS":["📅・weekly-events","🎁・season-rewards","🏆・hall-of-fame"],
      "🎫・SUPPORT":["🎟️・support-ticket","🚨・player-reports"],
      "🔒・STAFF":["🛡️・staff-chat","📋・mod-logs"]}},
    "skyblock":{roles:[["👑 Skyblock Owner",0xF1C40F,true],["🛡️ Skyblock Staff",0xE74C3C,true],["🏝️ Island Owner",0x2ECC71,false],["💎 Island Top",0x9B59B6,false]],groups:{
      "📌・SKYBLOCK INFO":["👋・welcome","📜・rules","📢・updates","🧭・starter-guide"],
      "🏝️・ISLANDS":["💬・skyblock-chat","🤝・island-recruitment","🏡・island-showcase","🏆・island-top"],
      "💰・ECONOMY":["🛒・island-market","💎・rare-items","📈・prices"],
      "🎉・EVENTS":["📅・events","🎁・giveaways","🏆・winners"],
      "🎫・SUPPORT":["🎟️・support-ticket","🚨・reports"],
      "🔒・STAFF":["🛡️・staff-chat","📋・mod-logs"]}},
    "prison":{roles:[["👑 Prison Owner",0xF1C40F,true],["🛡️ Prison Staff",0xE74C3C,true],["⛏️ Miner",0x3498DB,false],["💎 Prestige",0x9B59B6,false]],groups:{
      "📌・PRISON INFO":["👋・welcome","📜・rules","📢・updates","⛏️・mines-guide"],
      "⛏️・MINING & RANKS":["💬・prison-chat","💎・rank-progression","🏆・top-miners","🧰・pickaxe-builds"],
      "💰・ECONOMY":["🛒・sell-and-trade","📈・prices","🏪・player-shops"],
      "🎉・EVENTS":["📅・events","🎁・giveaways","🏆・winners"],
      "🎫・SUPPORT":["🎟️・support-ticket","🚨・reports"],
      "🔒・STAFF":["🛡️・staff-chat","📋・mod-logs"]}},
    "hosting":{roles:[["🖥️ Hosting Owner",0xF1C40F,true],["🛠️ Hosting Admin",0xE74C3C,true],["🎧 Support Team",0x3498DB,true],["💎 Customer",0x2ECC71,false],["🧪 Tester",0x9B59B6,false]],groups:{
      "📌・GET STARTED":["👋・welcome","📜・rules","📢・status-announcements","💳・plans-pricing","📚・knowledge-base"],
      "🖥️・HOSTING":["🌐・panel-links","🚀・server-deployments","⚙️・setup-guides","🧩・modpack-support","🔌・plugin-support"],
      "🎧・SUPPORT DESK":["🎟️・open-ticket","🆘・technical-help","🐛・report-issue","💡・feature-requests"],
      "💬・COMMUNITY":["💬・general-chat","📸・showcase","⭐・reviews"],
      "🔒・STAFF ROOM":["🛡️・staff-chat","📋・support-logs"]}},
    "smp":{roles:[["👑 SMP Owner",0xF1C40F,true],["🛡️ SMP Staff",0xE74C3C,true],["💎 VIP",0x9B59B6,false],["🎮 Player",0x3498DB,false]],groups:{
      "📌・START HERE":["👋・welcome","📜・rules","📢・announcements","🗺️・server-info","🔗・server-ip"],
      "🌍・SMP WORLD":["💬・general","📸・screenshots","🏡・build-showcase","🛒・player-market","⚔️・looking-for-group"],
      "🎉・EVENTS":["📅・events","🎁・giveaways","🏆・leaderboards"],
      "🎫・SUPPORT":["🎟️・create-ticket","🚨・player-reports"],
      "🔒・STAFF":["🛡️・staff-chat","📋・mod-logs"]}},
    "pvp":{roles:[["👑 Network Owner",0xF1C40F,true],["🛡️ PvP Staff",0xE74C3C,true],["⚔️ Competitor",0xE67E22,false],["🏆 Tournament Winner",0x9B59B6,false]],groups:{
      "📌・INFO":["👋・welcome","📜・rules","📢・announcements","🌐・server-status"],
      "⚔️・PVP ARENA":["💬・pvp-chat","🎯・find-a-fight","📹・clips-and-combos","🧠・tips-and-guides","🏆・rankings"],
      "🏟️・TOURNAMENTS":["📅・tournaments","📝・team-recruitment","🎁・prizes"],
      "🛡️・HELP":["🎟️・support-ticket","🚨・report-player"],
      "🔒・STAFF":["🛡️・staff-chat","📋・reports-log"]}},
    "network":{roles:[["👑 Network Owner",0xF1C40F,true],["🛡️ Network Admin",0xE74C3C,true],["🔨 Moderator",0xE67E22,true],["💎 Premium",0x9B59B6,false],["🎮 Member",0x3498DB,false]],groups:{
      "📌・NETWORK INFO":["👋・welcome","📜・rules","📢・network-news","🌐・server-status","🔗・server-addresses"],
      "🎮・GAME MODES":["🌍・survival","⚔️・practice-pvp","💀・lifesteal","🧱・skyblock","🎨・creative-showcase"],
      "🌟・COMMUNITY":["💬・general","📸・media","💡・suggestions","📅・events","🎁・giveaways"],
      "🎫・SUPPORT":["🎟️・open-ticket","🚨・reports"],
      "🔒・STAFF":["🛡️・staff-chat","📋・mod-logs"]}},
    "creator":{roles:[["👑 Creator Owner",0xF1C40F,true],["🎬 Creator",0xE74C3C,true],["🎨 Designer",0x9B59B6,false],["🎮 Community Member",0x3498DB,false]],groups:{
      "📌・WELCOME":["👋・welcome","📜・rules","📢・announcements"],
      "🎬・CONTENT":["📺・latest-videos","🎞️・clips","📸・screenshots","💡・content-ideas"],
      "🤝・COMMUNITY":["💬・general","🎮・gaming-chat","📅・live-events","🎁・giveaways"],
      "🛠️・COLLABS":["🤝・looking-for-collabs","🎨・commissions","📨・business-inquiries"],
      "🔒・STAFF":["🛡️・staff-chat","📋・mod-logs"]}},
    "events":{roles:[["👑 Event Owner",0xF1C40F,true],["🎤 Event Host",0x9B59B6,true],["🛡️ Moderator",0xE74C3C,true],["🔔 Event Pings",0x2ECC71,false]],groups:{
      "📌・EVENT INFO":["👋・welcome","📜・rules","📢・event-announcements","🗓️・event-calendar"],
      "🎉・PARTICIPATE":["📝・sign-ups","💬・event-chat","🎁・prize-info","🏆・winners"],
      "🛟・HELP":["🎟️・support","🚨・report-a-problem"],
      "🔒・STAFF":["🛡️・staff-chat","📋・event-logs"]}}
  };
  const t=templates[mode]; if(!t)throw new Error("Unknown template: "+mode);
  for(const [n,c,h] of t.roles)await role(guild,n,c,h);
  for(const [catName,names] of Object.entries(t.groups)){
    const category=await cat(guild,catName);
    for(const name of names)await channel(guild,category,name,"text");
    if(catName==="🔒・STAFF"||catName==="🔒・STAFF ROOM"){
      await category.permissionOverwrites.edit(guild.roles.everyone,{ViewChannel:false});
      for(const [n] of t.roles.filter(x=>/Owner|Admin|Staff|Moderator|Support Team/.test(x[0]))){
        const r=guild.roles.cache.find(x=>x.name===n); if(r)await category.permissionOverwrites.edit(r,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});
      }
    }
  }
  const welcome=guild.channels.cache.find(c=>c.name==="👋・welcome");
  if(welcome&&!welcome.topic?.includes("template welcome posted"))await welcome.send("# 👋 Welcome!\n\nThis server was created with the **"+mode.toUpperCase()+" template**. Read #📜・rules first, then explore the channels.\n\n🛡️ Staff will never ask for passwords, tokens, or verification codes.").catch(()=>{});
  const rules=guild.channels.cache.find(c=>c.name==="📜・rules");
  if(rules&&!rules.topic?.includes("template rules posted"))await rules.send("# 📜 Community Rules\n\n1. Be respectful.\n2. No spam, scams, phishing, or impersonation.\n3. Keep messages in the correct channels.\n4. Do not share passwords, tokens, or private information.\n5. Follow Discord Terms and Community Guidelines.").catch(()=>{});
  return Object.values(t.groups).reduce((n,x)=>n+x.length,0);
}

const command=new SlashCommandBuilder().setName("setup").setDescription("Choose a server template to install").addStringOption(o=>o.setName("type").setDescription("Pick a ready-made server layout").setRequired(true).addChoices({name:"🛒 Trading / Marketplace",value:"trading"},{name:"💻 Developer / Plugins",value:"developer"},{name:"🚀 Full SMP + Trading + Developer",value:"full"},{name:"🎁 MCFA Giveaways",value:"mcfa-giveaways"},{name:"🌐 MCFA Big Community",value:"mcfa-community"},{name:"👑 Full MCFA Community + Giveaways",value:"mcfa-full"},{name:"🖥️ Minecraft Hosting Company",value:"hosting"},{name:"🌍 Survival SMP Community",value:"smp"},{name:"⚔️ PvP / Practice Network",value:"pvp"},{name:"🕸️ Multi-Mode Minecraft Network",value:"network"},{name:"🎬 Creator / YouTuber Community",value:"creator"},{name:"🎉 Events & Giveaways Hub",value:"events"}, {name:"🌐 Public Lifesteal — Big Community",value:"lifesteal-public"},{name:"❤️ Classic Lifesteal SMP",value:"lifesteal"},{name:"⚔️ Competitive Lifesteal",value:"lifesteal-competitive"},{name:"☠️ Hardcore Lifesteal",value:"lifesteal-hardcore"},{name:"💎 Crystal PvP Lifesteal",value:"lifesteal-crystal"},{name:"🌱 Seasonal Lifesteal",value:"lifesteal-seasonal"},{name:"🏝️ Skyblock Server",value:"skyblock"},{name:"⛏️ Prison Server",value:"prison"})).setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
const extraCommands=[
new SlashCommandBuilder().setName("mcfa-giveaway").setDescription("Start an MCFA/community giveaway with an entry button").addStringOption(o=>o.setName("prize").setDescription("Prize you are authorized to give away").setRequired(true)).addIntegerOption(o=>o.setName("minutes").setDescription("Duration in minutes (1-10080)").setRequired(true).setMinValue(1).setMaxValue(10080)).addIntegerOption(o=>o.setName("winners").setDescription("Number of winners (1-10)").setRequired(false).setMinValue(1).setMaxValue(10)).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
new SlashCommandBuilder().setName("add-emoji").setDescription("Import a custom emoji from an image URL or Discord emoji ID").addStringOption(o=>o.setName("source").setDescription("Direct image URL or custom emoji ID").setRequired(true)).addStringOption(o=>o.setName("name").setDescription("Emoji name (letters, numbers, underscores)").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
new SlashCommandBuilder().setName("roles").setDescription("Show role panels"),
new SlashCommandBuilder().setName("market").setDescription("Marketplace help"),
new SlashCommandBuilder().setName("dev").setDescription("Developer hub help"),
new SlashCommandBuilder().setName("help").setDescription("Show all server bot commands"),
new SlashCommandBuilder().setName("ping").setDescription("Check bot latency"),
new SlashCommandBuilder().setName("serverinfo").setDescription("Show server information"),
new SlashCommandBuilder().setName("invite").setDescription("Show your invite statistics"),
new SlashCommandBuilder().setName("lock").setDescription("Lock the current channel").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
new SlashCommandBuilder().setName("unlock").setDescription("Unlock the current channel").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
new SlashCommandBuilder().setName("announce").setDescription("Send an announcement").addStringOption(o=>o.setName("message").setDescription("Announcement text").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
new SlashCommandBuilder().setName("ticket").setDescription("Create a private support ticket"),
new SlashCommandBuilder().setName("close-ticket").setDescription("Close the current ticket").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
new SlashCommandBuilder().setName("deal-scan").setDescription("Run a Donut.Auction bargain scan now").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
new SlashCommandBuilder().setName("carl").setDescription("Get the official Carl-bot dashboard"),
new SlashCommandBuilder().setName("reset-server").setDescription("Reset the bot-managed SMP server structure").addStringOption(o=>o.setName("confirm").setDescription("Type RESET to confirm").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
new SlashCommandBuilder().setName("embed").setDescription("Create a professional embed in the current channel").addStringOption(o=>o.setName("title").setDescription("Embed title").setRequired(true)).addStringOption(o=>o.setName("description").setDescription("Embed description").setRequired(true)).addStringOption(o=>o.setName("color").setDescription("Hex color, e.g. #5865F2").setRequired(false)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
new SlashCommandBuilder().setName("purge").setDescription("Bulk delete recent messages").addIntegerOption(o=>o.setName("amount").setDescription("Number of messages (1-100)").setRequired(true).setMinValue(1).setMaxValue(100)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
new SlashCommandBuilder().setName("slowmode").setDescription("Set channel slowmode in seconds").addIntegerOption(o=>o.setName("seconds").setDescription("0 to 21600 seconds").setRequired(true).setMinValue(0).setMaxValue(21600)).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
new SlashCommandBuilder().setName("timeout").setDescription("Timeout a member for minutes").addUserOption(o=>o.setName("member").setDescription("Member to timeout").setRequired(true)).addIntegerOption(o=>o.setName("minutes").setDescription("Duration (1-40320 minutes)").setRequired(true).setMinValue(1).setMaxValue(40320)).addStringOption(o=>o.setName("reason").setDescription("Reason").setRequired(false)).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
new SlashCommandBuilder().setName("untimeout").setDescription("Remove a member timeout").addUserOption(o=>o.setName("member").setDescription("Member to untimeout").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
new SlashCommandBuilder().setName("kick").setDescription("Kick a member").addUserOption(o=>o.setName("member").setDescription("Member to kick").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setRequired(false)).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
new SlashCommandBuilder().setName("ban").setDescription("Ban a member").addUserOption(o=>o.setName("member").setDescription("Member to ban").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setRequired(false)).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
new SlashCommandBuilder().setName("userinfo").setDescription("Show member information").addUserOption(o=>o.setName("member").setDescription("Member to inspect").setRequired(false)),
new SlashCommandBuilder().setName("nickname").setDescription("Change a member nickname").addUserOption(o=>o.setName("member").setDescription("Member").setRequired(true)).addStringOption(o=>o.setName("name").setDescription("New nickname (blank not allowed)").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
new SlashCommandBuilder().setName("tts-join").setDescription("Join your current voice channel and stay connected 24/7"),
new SlashCommandBuilder().setName("tts-leave").setDescription("Disconnect the TTS bot from voice"),
new SlashCommandBuilder().setName("tts-say").setDescription("Speak text aloud in voice chat").addStringOption(o=>o.setName("text").setDescription("Text to speak").setRequired(true).setMaxLength(220)),
new SlashCommandBuilder().setName("tts-autoread").setDescription("Toggle reading this text channel into voice chat").addBooleanOption(o=>o.setName("enabled").setDescription("Enable or disable auto-read").setRequired(true)),
new SlashCommandBuilder().setName("tts-language").setDescription("Choose TTS language").addStringOption(o=>o.setName("language").setDescription("Voice language").setRequired(true).addChoices({name:"Hindi",value:"hi"},{name:"Urdu",value:"ur"},{name:"English",value:"en"}))
];


/* Hindi/Urdu TTS + persistent 24/7 voice connections */
const path=require("path");
let voiceLib;
try {
 const ffmpegPath=require("ffmpeg-static");
 if(ffmpegPath)process.env.PATH=path.dirname(ffmpegPath)+path.delimiter+(process.env.PATH||"");
 voiceLib=require("@discordjs/voice");
} catch(e) { console.error("Voice dependencies unavailable:",e.message); }
const ttsSettingsPath=path.join(__dirname,"tts-settings.json");
let ttsSettings={};
try { ttsSettings=JSON.parse(fs.readFileSync(ttsSettingsPath,"utf8")); } catch {}
const voiceStates=new Map();
function saveTtsSettings(){try{fs.writeFileSync(ttsSettingsPath,JSON.stringify(ttsSettings,null,2));}catch(e){console.error("Could not save TTS settings:",e.message);}}
function getTtsSettings(guildId){if(!ttsSettings[guildId])ttsSettings[guildId]={autoRead:false,language:"hi",textChannelId:null,voiceChannelId:null,stay24_7:true};return ttsSettings[guildId];}
async function connectTtsVoice(channel,stay=true){
 if(!voiceLib)throw new Error("Voice packages unavailable. Run npm install and restart.");
 const {joinVoiceChannel,VoiceConnectionStatus,entersState,createAudioPlayer,NoSubscriberBehavior}=voiceLib;
 const old=voiceStates.get(channel.guild.id);if(old?.connection){try{old.connection.destroy();}catch{}}
 const connection=joinVoiceChannel({channelId:channel.id,guildId:channel.guild.id,adapterCreator:channel.guild.voiceAdapterCreator,selfDeaf:true,selfMute:false});
 const player=createAudioPlayer({behaviors:{noSubscriber:NoSubscriberBehavior.Pause}});connection.subscribe(player);
 const state={connection,player,stay,channelId:channel.id,queue:[],speaking:false};voiceStates.set(channel.guild.id,state);
 connection.on(VoiceConnectionStatus.Disconnected,async()=>{
  if(!state.stay)return;
  try{await Promise.race([entersState(connection,VoiceConnectionStatus.Signalling,5000),entersState(connection,VoiceConnectionStatus.Connecting,5000)]);}
  catch{try{connection.destroy();}catch{}if(state.stay)setTimeout(async()=>{const c=await channel.guild.channels.fetch(state.channelId).catch(()=>null);if(c?.isVoiceBased())connectTtsVoice(c,true).catch(e=>console.error("Voice reconnect:",e.message));},3000);}
 });
 connection.on("error",e=>console.error("Voice connection:",e.message));return state;
}
async function sayTts(guildId,textToSay,language){
 const state=voiceStates.get(guildId);if(!state)throw new Error("Pehle /tts-join se voice channel join karo.");
 const clean=String(textToSay||"").replace(/https?:\/\/\S+/gi," link ").replace(/<@!?\d+>|<@&\d+>|<#\d+>/g,"").slice(0,220).trim();if(!clean)return;
 state.queue.push({text:clean,language:language||getTtsSettings(guildId).language||"hi"});if(state.speaking)return;state.speaking=true;
 try{while(state.queue.length){const item=state.queue.shift();const lang=item.language==="ur"?"ur":item.language==="en"?"en":"hi";
  const url=require("google-tts-api").getAudioUrl(item.text,{lang,slow:false,host:"https://translate.google.com"});
  const resource=voiceLib.createAudioResource(url);state.player.play(resource);
  await voiceLib.entersState(state.player,voiceLib.AudioPlayerStatus.Playing,10000).catch(()=>{});
  await voiceLib.entersState(state.player,voiceLib.AudioPlayerStatus.Idle,Math.max(15000,item.text.length*180)).catch(()=>{});
 }}finally{state.speaking=false;}
}

const dealSeen=new Map();

const money=n=>"$"+Number(n||0).toLocaleString("en-US",{maximumFractionDigits:2});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function donutAuctionPage(url){
 const r=await fetch(url,{headers:{"User-Agent":"SMP-Deal-Scanner/1.0"}});
 if(!r.ok)throw new Error("Donut.Auction HTTP "+r.status);
 return r.text();
}
function extractMoney(s){
 const m=String(s).replace(/,/g,"").match(/\$\s*([0-9]+(?:\.[0-9]+)?)/);
 return m?Number(m[1]):null;
}
function extractDeals(html){
 const out=[];
 const links=[...html.matchAll(/href=["'](\/item\/[a-zA-Z0-9-]+)["']/g)].map(m=>m[1]);
 for(const p of [...new Set(links)]){
  const chunk=html.slice(Math.max(0,html.indexOf(p)-300),Math.min(html.length,html.indexOf(p)+1800));
  const name=(chunk.match(/>([^<>]{2,80})<\/a>/)||[])[1]||"Auction item";
  const vals=[...chunk.matchAll(/(?:Value|value)\s*\$\s*([0-9,]+(?:\.[0-9]+)?)/g)].map(m=>Number(m[1].replace(/,/g,"")));
  const live=(chunk.match(/Latest live unit price is \$\s*([0-9,]+(?:\.[0-9]+)?)/i)||[])[1];
  const value=vals[0]||null, livePrice=live?Number(live.replace(/,/g,"")):null;
  if(value&&livePrice)out.push({name:name.replace(/\s+/g," ").trim(),value,livePrice,url:"https://donut.auction"+p});
 }
 return out;
}
async function scanDeals(guild){
 let html=await donutAuctionPage("https://donut.auction/");
 let deals=extractDeals(html);
 if(!deals.length){
  html=await donutAuctionPage("https://donut.auction/live-prices");
  deals=extractDeals(html);
 }
 const ch=guild.channels.cache.find(c=>c.name==="🔥・deals"&&c.type===ChannelType.GuildForum)||guild.channels.cache.find(c=>c.name==="🔥・deals");
 if(!ch)return {sent:0,total:deals.length};
 let sent=0;
 for(const d of deals){
  const discount=((d.value-d.livePrice)/d.value)*100;
  if(discount<DEAL_DISCOUNT_PERCENT)continue;
  const key=d.url+"|"+d.livePrice;
  if(dealSeen.has(key))continue;
  dealSeen.set(key,Date.now());
  const embed=new EmbedBuilder()
   .setTitle("🔥 BARGAIN FOUND — "+d.name)
   .setDescription("Donut.Auction detected a live price below its current estimated value.")
   .addFields(
    {name:"🏷️ Live price",value:money(d.livePrice),inline:true},
    {name:"📊 Real/reference value",value:money(d.value),inline:true},
    {name:"📉 Below value",value:discount.toFixed(1)+"%",inline:true},
    {name:"💰 Potential gap",value:money(d.value-d.livePrice),inline:true},
    {name:"🔗 Listing / Item",value:d.url,inline:false}
   )
   .setFooter({text:"Source: Donut.Auction • Not affiliated with DonutSMP"});
  if(ch.type===ChannelType.GuildForum)await ch.threads.create({name:"🔥 "+d.name+" — "+discount.toFixed(0)+"% off",message:{embeds:[embed]}}).catch(()=>{});
  else await ch.send({embeds:[embed]}).catch(()=>{});
  sent++;
 }
 for(const [k,t] of dealSeen)if(Date.now()-t>6*60*60*1000)dealSeen.delete(k);
 return {sent,total:deals.length};
}

const inviteCache=new Map();
const giveawayEntries=new Map();
async function refreshInvites(guild){try{const invites=await guild.invites.fetch();inviteCache.set(guild.id,new Map(invites.map(x=>[x.code,x.uses||0])))}catch(e){console.error("Invite cache:",e.message)}}
client.on("guildMemberAdd",async member=>{
 try{
  const old=inviteCache.get(member.guild.id)||new Map(), now=await member.guild.invites.fetch();
  const used=[...now.values()].find(x=>(x.uses||0)>(old.get(x.code)||0));
  inviteCache.set(member.guild.id,new Map(now.map(x=>[x.code,x.uses||0])));
  const ch=member.guild.channels.cache.find(c=>c.name==="📨・invite-log");
  if(ch)await ch.send("🎉 "+member+" joined! Invited by **"+(used?.inviter?.tag||"Unknown")+"** • Uses: **"+(used?.uses||0)+"**");
 }catch(e){console.error("Invite tracker:",e.message)}
});
async function inviteStats(guild,user){
 const inv=await guild.invites.fetch();
 return [...inv.values()].filter(x=>x.inviter?.id===user.id).reduce((n,x)=>n+(x.uses||0),0);
}
client.once("ready",async()=>{const rest=new REST({version:"10"}).setToken(token);await rest.put(Routes.applicationCommands(clientId),{body:[command.toJSON(),...extraCommands.map(x=>x.toJSON())]});console.log("Online:",client.user.tag,"• Global commands registered");for(const g of client.guilds.cache.values())refreshInvites(g);animateRoles();setInterval(animateRoles,180000);const run=async()=>{for(const g of client.guilds.cache.values()){try{const r=await scanDeals(g);if(r.sent)console.log("Web deal scanner:",r.sent,"new deals");}catch(e){console.error("Web deal scanner:",e.message)}}};run();setInterval(run,DEAL_SCAN_SECONDS*1000)});
client.on("interactionCreate",async i=>{if(!i.isChatInputCommand())return;if(i.commandName==="setup"){await i.deferReply({ephemeral:true});try{if(!i.guildId)return i.editReply("❌ Use /setup inside your Discord server, not in DMs.");const guild=i.guild||await client.guilds.fetch(i.guildId);if(!guild||!guild.channels||!guild.roles)return i.editReply("❌ I could not access this server. Please restart the bot and try again.");await guild.channels.fetch();await guild.roles.fetch();const type=i.options.getString("type");if(type==="mcfa-full"||type==="mcfa-community"||type==="mcfa-giveaways"){const n=await setupMCFA(guild,type);await ensureServerIcon(guild);await i.editReply("🎁 MCFA setup complete — created/checked "+n+" channels across giveaway, community and safety sections.");}else if(["hosting","smp","pvp","network","creator","events","lifesteal-public","lifesteal-competitive","lifesteal-hardcore","lifesteal-crystal","lifesteal-seasonal","skyblock","prison"].includes(type)){const n=await setupTemplate(guild,type);await ensureServerIcon(guild);await i.editReply("✅ "+type.toUpperCase()+" template installed! Created/checked "+n+" channels. You can customize names and permissions anytime.");}else if(type==="full"){await setup(guild);await ensureServerIcon(guild);await installMode(guild,"trading");await installMode(guild,"developer");await i.editReply("🚀 FULL SETUP DONE — SMP + Trading + Developer + Reaction Roles installed.");}else await i.editReply("✅ "+(await installMode(guild,type))+" is ready. Check #🎭・roles.");}catch(e){console.error("Setup failed:",e);await i.editReply("❌ Setup failed: "+(e?.message||"Unknown error")+". Check bot server access and permissions.");}}if(i.commandName==="add-emoji"){await i.deferReply({ephemeral:true});try{
 if(!i.guild)throw new Error("Use this command inside your server.");
 if(!i.memberPermissions?.has(PermissionFlagsBits.ManageGuild))throw new Error("You need Manage Server permission.");
 const name=i.options.getString("name").toLowerCase();
 if(!/^[a-z0-9_]{2,32}$/.test(name))throw new Error("Emoji name must be 2–32 characters using letters, numbers, or underscores.");
 const source=i.options.getString("source").trim();
 let urls=[];
 if(/^\d{17,20}$/.test(source)){urls=[`https://cdn.discordapp.com/emojis/${source}.gif?size=128&quality=lossless`,`https://cdn.discordapp.com/emojis/${source}.png?size=128&quality=lossless`,`https://cdn.discordapp.com/emojis/${source}.webp?size=128&quality=lossless`];}
 else if(/^https:\/\//i.test(source)){urls=[source];}else throw new Error("Source must be a direct HTTPS image URL or a Discord emoji ID.");
 let attachment=null,lastError=null;
 for(const url of urls){try{const res=await fetch(url);if(!res.ok)throw new Error("Image URL returned HTTP "+res.status);const type=res.headers.get("content-type")||"";if(!type.startsWith("image/"))throw new Error("URL did not return an image.");const buf=Buffer.from(await res.arrayBuffer());if(buf.length>256*1024)throw new Error("Image must be 256 KB or smaller.");if(!buf.length)throw new Error("Image is empty.");attachment=buf;break;}catch(e){lastError=e;}}
 if(!attachment)throw lastError||new Error("Could not fetch that emoji image.");
 const emoji=await i.guild.emojis.create({attachment,name,reason:"Emoji imported by server manager command"});
 await i.editReply("✅ Added custom emoji "+emoji+" as `:"+emoji.name+":` (ID: `"+emoji.id+"`).");
 }catch(e){console.error("add-emoji failed:",e);await i.editReply("❌ Could not add emoji: "+(e?.message||"Unknown error")+". Ensure the bot has Create Expressions/Manage Emojis permission and the server has an available emoji slot.");}}
if(i.commandName==="reset-server"){await i.deferReply({ephemeral:true});if(i.options.getString("confirm")!=="RESET")return i.editReply("❌ Confirmation must be exactly RESET.");try{if(!i.guild)throw new Error("Run this command inside a server.");await resetBotStructure(i.guild);const summary=await setup(i.guild);await ensureServerIcon(i.guild);await i.editReply("♻️ Reset finished and marketplace structure rebuilt. Checked "+summary[1]+" channels and "+summary[2]+" roles. Unrelated channels/roles were preserved.");}catch(e){console.error(e);await i.editReply("❌ Reset failed: "+e.message)}}
if(i.commandName==="mcfa-giveaway"){
 await i.deferReply({ephemeral:true});
 const prize=i.options.getString("prize"), minutes=i.options.getInteger("minutes"), winners=i.options.getInteger("winners")||1;
 const endAt=Date.now()+minutes*60000, giveawayId=Date.now().toString(36)+Math.random().toString(36).slice(2,7);
 const target=i.channel;
 const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("mcfa_enter:"+giveawayId).setLabel("Enter Giveaway").setEmoji("🎁").setStyle(ButtonStyle.Success));
 const embed=new EmbedBuilder().setTitle("🎁 MCFA COMMUNITY GIVEAWAY").setDescription("**Prize:** "+prize+"\n**Host:** "+i.user+"\n**Winners:** "+winners+"\n**Entries:** 0\n\nPress 🎁 Enter Giveaway to participate.").addFields({name:"⏰ Ends",value:"<t:"+Math.floor(endAt/1000)+":R>",inline:true},{name:"🛡️ Safety",value:"Never share passwords, session cookies, or Microsoft verification codes.",inline:true}).setColor(0x2ECC71).setTimestamp();
 const post=await target.send({embeds:[embed],components:[row]});
 giveawayEntries.set(giveawayId,{guildId:i.guildId,channelId:target.id,messageId:post.id,prize,winners,endAt,users:new Set(),ended:false});
 await i.editReply("✅ Giveaway posted: "+post.url);
 setTimeout(async()=>{
  const data=giveawayEntries.get(giveawayId); if(!data||data.ended)return; data.ended=true;
  const entrants=[...data.users];
  const chosen=[];
  while(entrants.length&&chosen.length<data.winners){const idx=Math.floor(Math.random()*entrants.length);chosen.push(entrants.splice(idx,1)[0]);}
  const ch=await client.channels.fetch(data.channelId).catch(()=>null);
  if(ch){const msg=await ch.messages.fetch(data.messageId).catch(()=>null);if(msg)await msg.edit({components:[]}).catch(()=>{});await ch.send(chosen.length?"🏆 Giveaway ended! Prize: **"+data.prize+"**\nWinner(s): "+chosen.map(id=>"<@"+id+">").join(", "):"🎁 Giveaway ended, but there were no entries.");}
 },minutes*60000);
}
if(i.commandName==="purge"){const amount=i.options.getInteger("amount");try{const deleted=await i.channel.bulkDelete(amount,true);await i.reply({content:"🧹 Deleted "+deleted.size+" recent messages. Messages older than 14 days cannot be bulk-deleted.",ephemeral:true});}catch(e){await i.reply({content:"❌ Purge failed: "+e.message,ephemeral:true});}}
if(i.commandName==="slowmode"){const seconds=i.options.getInteger("seconds");try{await i.channel.setRateLimitPerUser(seconds,"Slowmode set by "+i.user.tag);await i.reply("⏱️ Slowmode set to "+seconds+" second(s).");}catch(e){await i.reply({content:"❌ Slowmode failed: "+e.message,ephemeral:true});}}
if(i.commandName==="timeout"){const user=i.options.getUser("member"),minutes=i.options.getInteger("minutes"),reason=i.options.getString("reason")||"No reason provided";try{const m=await i.guild.members.fetch(user.id);if(m.id===i.user.id||m.id===client.user.id)throw new Error("You cannot timeout yourself or the bot.");await m.timeout(minutes*60000,reason);await i.reply("🔇 Timed out "+user+" for "+minutes+" minute(s). Reason: "+reason);}catch(e){await i.reply({content:"❌ Timeout failed: "+e.message,ephemeral:true});}}
if(i.commandName==="untimeout"){const user=i.options.getUser("member");try{const m=await i.guild.members.fetch(user.id);await m.timeout(null,"Timeout removed by "+i.user.tag);await i.reply("🔊 Timeout removed for "+user+".");}catch(e){await i.reply({content:"❌ Untimeout failed: "+e.message,ephemeral:true});}}
if(i.commandName==="kick"){const user=i.options.getUser("member"),reason=i.options.getString("reason")||"No reason provided";try{const m=await i.guild.members.fetch(user.id);if(!m.kickable)throw new Error("I cannot kick this member. Check role hierarchy and permissions.");await m.kick(reason);await i.reply("👢 Kicked "+user+" • "+reason);}catch(e){await i.reply({content:"❌ Kick failed: "+e.message,ephemeral:true});}}
if(i.commandName==="ban"){const user=i.options.getUser("member"),reason=i.options.getString("reason")||"No reason provided";try{const m=await i.guild.members.fetch(user.id);if(!m.bannable)throw new Error("I cannot ban this member. Check role hierarchy and permissions.");await m.ban({reason});await i.reply("🔨 Banned "+user+" • "+reason);}catch(e){await i.reply({content:"❌ Ban failed: "+e.message,ephemeral:true});}}
if(i.commandName==="userinfo"){const user=i.options.getUser("member")||i.user;const m=await i.guild.members.fetch(user.id).catch(()=>null);const embed=new EmbedBuilder().setTitle("👤 User Info — "+user.username).setThumbnail(user.displayAvatarURL()).addFields({name:"User ID",value:user.id,inline:true},{name:"Created",value:"<t:"+Math.floor(user.createdTimestamp/1000)+":D>",inline:true},{name:"Joined",value:m?.joinedTimestamp?"<t:"+Math.floor(m.joinedTimestamp/1000)+":D>":"Unknown",inline:true},{name:"Roles",value:m?[...m.roles.cache.filter(r=>r.id!==i.guild.id).values()].map(r=>r.toString()).slice(0,20).join(", ")||"None":"Not in server",inline:false}).setColor(0x5865F2);await i.reply({embeds:[embed],ephemeral:true});}
if(i.commandName==="nickname"){const user=i.options.getUser("member"),name=i.options.getString("name");try{const m=await i.guild.members.fetch(user.id);if(!m.manageable)throw new Error("I cannot manage this member due to role hierarchy.");await m.setNickname(name,"Nickname changed by "+i.user.tag);await i.reply("✏️ Updated nickname for "+user+".");}catch(e){await i.reply({content:"❌ Nickname failed: "+e.message,ephemeral:true});}}
if(i.commandName==="roles")await i.reply({content:"🎭 Go to #🎭・roles and react to the panels.",ephemeral:true});if(i.commandName==="market")await i.reply({content:"🛒 Marketplace is ready: use the Item Market forums for selling, buying, trades, rare items, bulk items and deals.",ephemeral:true});if(i.commandName==="dev")await i.reply({content:"💻 Developer hub is ready: Java, Paper, Spigot, Velocity, code review, plugin showcase and bug reports.",ephemeral:true});
if(i.commandName==="help")await i.reply({content:"🛒 **Market:** /market /deal-scan\n💱 **Trading:** /invite\n🛡️ **Moderation:** /lock /unlock /announce\n🎫 **Support:** /ticket /close-ticket\n🔧 **Utility:** /ping /serverinfo /roles /dev",ephemeral:true});
if(i.commandName==="ping")await i.reply("🏓 Pong! "+client.ws.ping+"ms");
if(i.commandName==="embed"){
 const title=i.options.getString("title"),description=i.options.getString("description"),raw=i.options.getString("color")||"#5865F2";
 const hex=/^#?[0-9A-Fa-f]{6}$/.test(raw)?raw.replace("#",""):"5865F2";
 const embed=new EmbedBuilder().setTitle(title).setDescription(description).setColor(parseInt(hex,16)).setTimestamp().setFooter({text:"SMP Marketplace"});
 await i.channel.send({embeds:[embed]});
 await i.reply({content:"✅ Embed sent.",ephemeral:true});
}

if(i.commandName==="carl")await i.reply({content:"🤖 Add/configure **Carl-bot** from its official dashboard: https://carl.gg/\nIt supports reaction roles, automod, logging, moderation and suggestions.",ephemeral:true});
if(i.commandName==="serverinfo")await i.reply({content:"📊 **"+i.guild.name+"**\n👥 Members: "+i.guild.memberCount+"\n🆔 Server ID: "+i.guild.id+"\n🛒 Marketplace + SMP + Developer Hub",ephemeral:true});
if(i.commandName==="invite"){const n=await inviteStats(i.guild,i.user);await i.reply({content:"📨 **"+i.user.username+"** has **"+n+"** invite uses.",ephemeral:true});}
if(i.commandName==="lock"){await i.channel.permissionOverwrites.edit(i.guild.roles.everyone,{SendMessages:false});await i.reply("🔒 Channel locked by "+i.user+".");}
if(i.commandName==="unlock"){await i.channel.permissionOverwrites.edit(i.guild.roles.everyone,{SendMessages:null});await i.reply("🔓 Channel unlocked by "+i.user+".");}
if(i.commandName==="announce"){const m=i.options.getString("message");await i.channel.send({content:"📢 **ANNOUNCEMENT**\n"+m});await i.reply({content:"✅ Announcement sent.",ephemeral:true});}
if(i.commandName==="ticket"){const existing=i.guild.channels.cache.find(c=>c.name==="ticket-"+i.user.id);if(existing)return i.reply({content:"🎫 You already have "+existing,ephemeral:true});const ch=await i.guild.channels.create({name:"ticket-"+i.user.id,type:ChannelType.GuildText,parent:i.guild.channels.cache.find(c=>c.name==="🎫 SUPPORT"&&c.type===ChannelType.GuildCategory)?.id,permissionOverwrites:[{id:i.guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},{id:i.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory]},{id:client.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.ManageChannels]}]});await ch.send("🎫 Welcome "+i.user+"! Staff will help you here. Use **/close-ticket** when finished.");await i.reply({content:"🎫 Ticket created: "+ch,ephemeral:true});}
if(i.commandName==="close-ticket"){if(!i.channel.name.startsWith("ticket-"))return i.reply({content:"❌ This isn't a ticket channel.",ephemeral:true});await i.reply("🔒 Closing ticket...");setTimeout(()=>i.channel.delete().catch(()=>{}),1500);}
if(i.commandName==="deal-scan"){await i.deferReply({ephemeral:true});try{const r=await scanDeals(i.guild);await i.editReply("🔥 Web scan complete — checked "+r.total+" Donut.Auction items and posted "+r.sent+" new bargain alerts in #🔥・deals.");}catch(e){await i.editReply("❌ Deal scan failed: "+e.message)}}});
const reactionRoles={"🛒":"🛒 Seller","💰":"💰 Buyer","🔄":"🔄 Trader","⭐":"⭐ Trusted Trader","💎":"💎 Collector","🔥":"🔥 Flipper","🏪":"🏪 Verified Seller","💻":"💻 Developer","☕":"☕ Java Developer","🧩":"🧩 Paper Developer","⚡":"⚡ Velocity Developer","🧪":"🧪 Tester","🎨":"🎨 Designer","🐛":"🐛 Bug Hunter","📦":"📦 Plugin Creator","🏆":"🏆 Contributor"};
client.on("messageReactionAdd",async(r,u)=>{if(u.bot||!r.message.guild)return;const n=reactionRoles[r.emoji.name];if(!n)return;try{const x=r.message.guild.roles.cache.find(z=>z.name===n);if(x)await(await r.message.guild.members.fetch(u.id)).roles.add(x)}catch(e){console.error(e.message)}});
client.on("messageReactionRemove",async(r,u)=>{if(u.bot||!r.message.guild)return;const n=reactionRoles[r.emoji.name];if(!n)return;try{const x=r.message.guild.roles.cache.find(z=>z.name===n);if(x)await(await r.message.guild.members.fetch(u.id)).roles.remove(x)}catch(e){console.error(e.message)}});
client.login(token);
/* ALL-IN-ONE UPGRADE: ticket center + reliable Donut.Auction item-page scanner */
async function allInOneTicket(guild,user,type="Support"){
  const name="ticket-"+user.id;
  const old=guild.channels.cache.find(c=>c.name===name);
  if(old)return old;
  const parent=guild.channels.cache.find(c=>c.name==="🎫 SUPPORT"&&c.type===ChannelType.GuildCategory);
  const staffNames=["👑 Owner","🛡️ Administrator","🔨 Senior Moderator","🛡️ Moderator","🛡️ SMP Staff"];
  const permissionOverwrites=[
    {id:guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},
    {id:user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]},
    {id:client.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.ManageChannels]}
  ];
  for(const n of staffNames){
    const r=guild.roles.cache.find(x=>x.name===n);
    if(r)permissionOverwrites.push({id:r.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]});
  }
  const ch=await guild.channels.create({name,type:ChannelType.GuildText,parent:parent?.id,permissionOverwrites});
  const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("aio_ticket_close").setLabel("Close Ticket").setEmoji("🔒").setStyle(ButtonStyle.Danger));
  await ch.send({content:"# 🎫 "+type+" Ticket\n\nWelcome "+user+"! Staff will help you here.\n\n**Type:** "+type+"\n**Privacy:** only you and staff can see this channel.\n⚠️ Never share passwords, tokens or API keys.",components:[row]});
  return ch;
}
async function installTicketCenter(guild){
  const ch=guild.channels.cache.find(c=>c.name==="🎟️・create-ticket");
  if(!ch)return;
  const recent=await ch.messages.fetch({limit:30}).catch(()=>null);
  if(recent?.some(m=>m.author.id===client.user.id&&m.components?.some(x=>x.components?.length)))return;
  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("aio_ticket:Support").setLabel("Support").setEmoji("🎫").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("aio_ticket:Trade").setLabel("Trade Help").setEmoji("💱").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("aio_ticket:Report").setLabel("Report / Scam").setEmoji("🚨").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("aio_ticket:Developer").setLabel("Developer").setEmoji("💻").setStyle(ButtonStyle.Secondary)
  );
  await ch.send({content:"# 🎫 SUPPORT CENTER\n\nOpen a private ticket with the button that matches your issue.\n\n🎫 Support • 💱 Trade Help • 🚨 Report / Scam • 💻 Developer\n\nNo public spam, no exposed credentials.",components:[row]});
}
client.once("ready",async()=>{
  for(const g of client.guilds.cache.values())await installTicketCenter(g).catch(e=>console.error("Ticket center:",e.message));
});
client.on("interactionCreate",async i=>{
  if(!i.isButton())return;
  if(i.customId.startsWith("mcfa_enter:")){const id=i.customId.slice("mcfa_enter:".length);const data=giveawayEntries.get(id);if(!data||data.ended)return i.reply({content:"This giveaway has ended or is unavailable.",ephemeral:true});if(data.users.has(i.user.id)){data.users.delete(i.user.id);return i.reply({content:"You left the giveaway.",ephemeral:true});}data.users.add(i.user.id);await i.reply({content:"🎁 You entered the giveaway! Reacting again is not required.",ephemeral:true});const ch=await client.channels.fetch(data.channelId).catch(()=>null);const msg=ch?await ch.messages.fetch(data.messageId).catch(()=>null):null;if(msg){const old=msg.embeds[0];if(old){const updated=EmbedBuilder.from(old).setDescription("**Prize:** "+data.prize+"\n**Host:** giveaway host\n**Winners:** "+data.winners+"\n**Entries:** "+data.users.size+"\n\nPress 🎁 Enter Giveaway to join or leave.");await msg.edit({embeds:[updated]}).catch(()=>{});}}return;}
  if(i.customId.startsWith("aio_ticket:")){
    const type=i.customId.split(":")[1];
    try{const ch=await allInOneTicket(i.guild,i.user,type);await i.reply({content:"🎫 Ticket: "+ch,ephemeral:true});}
    catch(e){await i.reply({content:"❌ Ticket error: "+e.message,ephemeral:true});}
  }
  if(i.customId==="aio_ticket_close"){
    if(!i.channel?.name.startsWith("ticket-"))return i.reply({content:"❌ Not a ticket.",ephemeral:true});
    await i.reply("🔒 Closing ticket...");
    setTimeout(()=>i.channel.delete().catch(()=>{}),1200);
  }
});

/* Web scanner: homepage -> real item pages -> latest live unit price */
async function allInOneAuctionPage(url){
  const r=await fetch(url,{headers:{"User-Agent":"SMP-Marketplace-Bot/2.0","Accept":"text/html,application/xhtml+xml"}});
  if(!r.ok)throw new Error("HTTP "+r.status);
  return r.text();
}
function allInOneItemLinks(html){
  return [...new Set([...html.matchAll(/href=["'](\/item\/[a-zA-Z0-9-]+)["']/g)].map(m=>"https://donut.auction"+m[1]))].slice(0,DEAL_SCAN_PAGES);
}
function allInOneParseItem(html,url){
  const name=(html.match(/<h1[^>]*>([^<]+)<\/h1>/i)||[])[1];
  const value=(html.match(/\\$([0-9,]+(?:\\.[0-9]+)?)/)||[])[1];
  const live=(html.match(/Latest live unit price is \\$\\s*([0-9,]+(?:\\.[0-9]+)?)/i)||[])[1];
  if(!name||!value||!live)return null;
  return {name:name.trim(),value:Number(value.replace(/,/g,"")),livePrice:Number(live.replace(/,/g,"")),url};
}
async function scanDeals(guild){
  const home=await allInOneAuctionPage("https://donut.auction/");
  const links=allInOneItemLinks(home);
  const deals=[];
  for(const url of links){
    try{
      const page=await allInOneAuctionPage(url);
      const d=allInOneParseItem(page,url);
      if(d)deals.push(d);
    }catch(e){console.error("Auction page:",e.message)}
    await sleep(200);
  }
  const ch=guild.channels.cache.find(c=>c.name==="🔥・deals");
  if(!ch)return {sent:0,total:deals.length};
  const good=deals.map(d=>({...d,discount:((d.value-d.livePrice)/d.value)*100,gap:d.value-d.livePrice}))
    .filter(d=>d.discount>=DEAL_DISCOUNT_PERCENT&&d.livePrice>0)
    .sort((a,b)=>b.discount-a.discount).slice(0,8);
  let sent=0;
  for(const d of good){
    const key=d.url+"|"+d.livePrice;
    if(dealSeen.has(key))continue;
    dealSeen.set(key,Date.now());
    const label=d.discount>=50?"🚨 INSANE DEAL":d.discount>=35?"🔥 GREAT DEAL":"💎 GOOD DEAL";
    const embed=new EmbedBuilder().setTitle(label+" • "+d.name)
      .setDescription("Only qualifying bargains are posted here — no dismiss/spam alerts.")
      .addFields(
        {name:"🏷️ Live price",value:"$"+d.livePrice.toLocaleString("en-US"),inline:true},
        {name:"📊 Reference value",value:"$"+d.value.toLocaleString("en-US"),inline:true},
        {name:"📉 Discount",value:d.discount.toFixed(1)+"%",inline:true},
        {name:"💰 Price gap",value:"$"+d.gap.toLocaleString("en-US"),inline:true},
        {name:"🔗 Listing",value:d.url,inline:false}
      ).setTimestamp().setFooter({text:"Donut.Auction • independent community tracker"});
    await ch.send({embeds:[embed]}).catch(()=>{});
    sent++;
  }
  for(const [k,t] of dealSeen)if(Date.now()-t>6*60*60*1000)dealSeen.delete(k);
  return {sent,total:deals.length};
}

client.on("interactionCreate",async i=>{
 if(!i.isChatInputCommand()||!i.guild)return;
 const settings=getTtsSettings(i.guildId);
 try{
  if(i.commandName==="tts-join"){
   const channel=i.member?.voice?.channel;if(!channel)return i.reply({content:"Pehle kisi voice channel mein join karo.",ephemeral:true});
   await connectTtsVoice(channel,true);settings.voiceChannelId=channel.id;settings.stay24_7=true;saveTtsSettings();
   return i.reply({content:"🎙️ Joined "+channel+" • 24/7 reconnect enabled. Use /tts-say to test.",ephemeral:true});
  }
  if(i.commandName==="tts-leave"){
   const state=voiceStates.get(i.guildId);if(state){state.stay=false;state.connection.destroy();voiceStates.delete(i.guildId);}
   settings.voiceChannelId=null;settings.stay24_7=false;saveTtsSettings();return i.reply({content:"👋 Voice disconnected. Use /tts-join to reconnect.",ephemeral:true});
  }
  if(i.commandName==="tts-say"){
   await i.deferReply({ephemeral:true});await sayTts(i.guildId,i.options.getString("text"),settings.language);return i.editReply("🗣️ Added to the voice queue.");
  }
  if(i.commandName==="tts-autoread"){
   settings.autoRead=i.options.getBoolean("enabled");settings.textChannelId=settings.autoRead?i.channelId:null;saveTtsSettings();
   return i.reply({content:settings.autoRead?"🔊 Auto-read enabled for this channel. Bot must be in voice via /tts-join.":"🔇 Auto-read disabled.",ephemeral:true});
  }
  if(i.commandName==="tts-language"){
   settings.language=i.options.getString("language");saveTtsSettings();return i.reply({content:"🌐 TTS language set to **"+settings.language+"**.",ephemeral:true});
  }
 }catch(e){console.error("TTS command:",e);const message="❌ TTS error: "+(e.message||"Unknown error");if(i.deferred||i.replied)return i.followUp({content:message,ephemeral:true}).catch(()=>{});return i.reply({content:message,ephemeral:true}).catch(()=>{});}
});
client.on("messageCreate",async message=>{
 if(!message.guild||message.author.bot)return;const settings=getTtsSettings(message.guild.id);
 if(!settings.autoRead||message.channelId!==settings.textChannelId||!voiceStates.has(message.guild.id))return;
 try{await sayTts(message.guild.id,message.content,settings.language);}catch(e){console.error("TTS auto-read:",e.message);}
});
client.once("ready",async()=>{
 for(const [guildId,settings] of Object.entries(ttsSettings)){
  if(!settings.stay24_7||!settings.voiceChannelId)continue;
  const guild=await client.guilds.fetch(guildId).catch(()=>null);if(!guild)continue;
  const channel=await guild.channels.fetch(settings.voiceChannelId).catch(()=>null);
  if(channel?.isVoiceBased())connectTtsVoice(channel,true).catch(e=>console.error("Saved voice reconnect:",e.message));
 }
});


// Modular feature pack; existing commands/templates remain intact.
require("./features")(client);
