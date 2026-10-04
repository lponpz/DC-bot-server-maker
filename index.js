require("dotenv").config();
const {Client,GatewayIntentBits,PermissionFlagsBits,ChannelType,SlashCommandBuilder,REST,Routes,EmbedBuilder}=require("discord.js");
const fs=require("fs");
const {DISCORD_TOKEN:token,CLIENT_ID:clientId}=process.env;
const DEAL_DISCOUNT_PERCENT=Math.max(5,Number(process.env.DEAL_DISCOUNT_PERCENT||20));
const DEAL_SCAN_SECONDS=Math.max(30,Number(process.env.DEAL_SCAN_SECONDS||60));
const DEAL_SCAN_PAGES=Math.max(1,Math.min(20,Number(process.env.DEAL_SCAN_PAGES||10)));
if(!token||!clientId) throw new Error("Set DISCORD_TOKEN and CLIENT_ID in .env");
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.GuildMessageReactions,GatewayIntentBits.GuildInvites,GatewayIntentBits.GuildMembers]});
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
async function resetBotStructure(g){await g.channels.fetch();await g.roles.fetch();const managedRoleNames=new Set(roles.map(x=>x[0]));const botManagedChannels=new Set(Object.values(groups).flat().map(x=>x[0]));for(const ch of [...g.channels.cache.values()]){if(ch.id!==g.id && (botManagedChannels.has(ch.name)||ch.name.startsWith("ticket-")))await ch.delete("SMP bot full reset").catch(()=>{});}for(const r of [...g.roles.cache.values()]){if(!r.managed&&!r.isEveryone()&&managedRoleNames.has(r.name))await r.delete("SMP bot full reset").catch(()=>{});}await g.channels.fetch();await g.roles.fetch();}
async function ensureServerIcon(g){if(g.icon)return false;try{const png=makeSmpIconPng();await g.setIcon(png,"Automatic SMP marketplace icon");return true}catch(e){console.error("Server icon:",e.message);return false;}}
function makeSmpIconPng(){const zlib=require("zlib");const w=256,h=256;const raw=[];for(let y=0;y<h;y++){raw.push(0);for(let x=0;x<w;x++){const dx=x-128,dy=y-128,d=Math.sqrt(dx*dx+dy*dy);let rr=18,gg=25,bb=38;if(d<112){rr=46;gg=204;bb=113;}if(d<88){rr=24;gg=32;bb=48;}if((x>48&&x<208&&y>96&&y<160)||(x>112&&x<144&&y>52&&y<204)){rr=46;gg=204;bb=113;}raw.push(rr,gg,bb,255);}}const crc32=b=>{let c=0xffffffff;for(const n of b){c^=n;for(let k=0;k<8;k++)c=(c>>>1)^(0xedb88320&-(c&1));}return (c^0xffffffff)>>>0};const chunk=(type,data)=>{const t=Buffer.from(type);const d=Buffer.from(data);const out=Buffer.alloc(12+d.length);out.writeUInt32BE(d.length,0);t.copy(out,4);d.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([t,d])),8+d.length);return out};const sig=Buffer.from([137,80,78,71,13,10,26,10]);const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;const idat=zlib.deflateSync(Buffer.from(raw));return Buffer.concat([sig,chunk("IHDR",ihdr),chunk("IDAT",idat),chunk("IEND",Buffer.alloc(0))]);}
async function installMode(g,mode){await g.roles.fetch();for(const [n,c,h] of roles)await role(g,n,c,h);let panel=g.channels.cache.find(x=>x.name==="🎭・roles");if(!panel)panel=await g.channels.create({name:"🎭・roles",type:ChannelType.GuildText});await makeRolePanel(g,panel,mode);return panel.name;}
const command=new SlashCommandBuilder().setName("setup").setDescription("Choose what to install").addStringOption(o=>o.setName("type").setDescription("Setup type").setRequired(true).addChoices({name:"🛒 Trading / Marketplace",value:"trading"},{name:"💻 Developer / Plugins",value:"developer"},{name:"🚀 Full SMP + Trading + Developer",value:"full"})).setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
const extraCommands=[
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
new SlashCommandBuilder().setName("reset-server").setDescription("Reset the bot-managed SMP server structure").addStringOption(o=>o.setName("confirm").setDescription("Type RESET to confirm").setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

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
client.on("interactionCreate",async i=>{if(!i.isChatInputCommand())return;if(i.commandName==="setup"){await i.deferReply({ephemeral:true});try{const type=i.options.getString("type");if(type==="full"){await setup(i.guild);await ensureServerIcon(i.guild);await installMode(i.guild,"trading");await installMode(i.guild,"developer");await i.editReply("🚀 FULL SETUP DONE — SMP + Trading + Developer + Reaction Roles installed.");}else await i.editReply("✅ "+(await installMode(i.guild,type))+" is ready. Check #🎭・roles.");}catch(e){console.error(e);await i.editReply("❌ Setup failed: "+e.message)}}if(i.commandName==="reset-server"){await i.deferReply({ephemeral:true});if(i.options.getString("confirm")!=="RESET")return i.editReply("❌ Confirmation must be exactly RESET.");try{await resetBotStructure(i.guild);await setup(i.guild);await ensureServerIcon(i.guild);await i.editReply("♻️ Bot-managed server structure reset and rebuilt. Existing unrelated channels/roles were left untouched.");}catch(e){console.error(e);await i.editReply("❌ Reset failed: "+e.message)}}
if(i.commandName==="roles")await i.reply({content:"🎭 Go to #🎭・roles and react to the panels.",ephemeral:true});if(i.commandName==="market")await i.reply({content:"🛒 Marketplace is ready: use the Item Market forums for selling, buying, trades, rare items, bulk items and deals.",ephemeral:true});if(i.commandName==="dev")await i.reply({content:"💻 Developer hub is ready: Java, Paper, Spigot, Velocity, code review, plugin showcase and bug reports.",ephemeral:true});
if(i.commandName==="help")await i.reply({content:"🛒 **Market:** /market /deal-scan\n💱 **Trading:** /invite\n🛡️ **Moderation:** /lock /unlock /announce\n🎫 **Support:** /ticket /close-ticket\n🔧 **Utility:** /ping /serverinfo /roles /dev",ephemeral:true});
if(i.commandName==="ping")await i.reply("🏓 Pong! "+client.ws.ping+"ms");
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
  return [...new Set([...html.matchAll(/href=["'](\\/item\\/[a-zA-Z0-9-]+)["']/g)].map(m=>"https://donut.auction"+m[1]))].slice(0,DEAL_SCAN_PAGES);
}
function allInOneParseItem(html,url){
  const name=(html.match(/<h1[^>]*>([^<]+)<\\/h1>/i)||[])[1];
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
