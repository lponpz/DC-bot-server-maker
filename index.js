require("dotenv").config();
const {Client,GatewayIntentBits,PermissionFlagsBits,ChannelType,SlashCommandBuilder,REST,Routes,EmbedBuilder}=require("discord.js");
const {DISCORD_TOKEN:token,CLIENT_ID:clientId,DONUT_API_KEY:donutApiKey}=process.env;
const DEAL_DISCOUNT_PERCENT=Math.max(5,Number(process.env.DEAL_DISCOUNT_PERCENT||20));
const DEAL_SCAN_SECONDS=Math.max(30,Number(process.env.DEAL_SCAN_SECONDS||60));
const DEAL_SCAN_PAGES=Math.max(1,Math.min(20,Number(process.env.DEAL_SCAN_PAGES||10)));
if(!token||!clientId) throw new Error("Set DISCORD_TOKEN and CLIENT_ID in .env");
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.GuildMessageReactions]});
const roles=[
["Owner",0xF1C40F,true],["Administrator",0xE74C3C,true],["Senior Moderator",0xE67E22,true],["Moderator",0x3498DB,true],["Bot",0x5865F2,true],
["👑 SMP Owner",0xF1C40F,true],["🛡️ SMP Staff",0xE74C3C,true],["💎 VIP Trader",0x9B59B6,true],["⭐ Trusted Trader",0xF1C40F,true],["🏪 Verified Seller",0x2ECC71,true],["🛒 Seller",0x27AE60,false],["💰 Buyer",0x3498DB,false],["🔄 Trader",0xF39C12,false],["💎 Collector",0x00CEC9,false],["🔥 Flipper",0xE17055,false],["💻 Developer",0x5865F2,true],["☕ Java Developer",0xE67E22,false],["🧩 Paper Developer",0x2ECC71,false],["⚡ Velocity Developer",0x9B59B6,false],["🧪 Tester",0xE84393,false],["🎨 Designer",0x00B894,false],["🐛 Bug Hunter",0xD63031,false],["📦 Plugin Creator",0x0984E3,false],["🏆 Contributor",0x6C5CE7,false],["🌟 Community Member",0x95A5A6,false],["✨ New Member",0x7F8C8D,false]
];
const groups={"📌 START HERE":[["👋・welcome","text"],["📜・rules","text"],["📢・announcements","text"],["🧭・server-info","text"],["🎭・roles","text"],["💱・how-to-trade","text"]],"🌐 SMP COMMUNITY":[["💬・general","text"],["🤝・introductions","text"],["📸・screenshots","text"],["🏆・leaderboards","text"],["🎉・events","text"],["🎁・giveaways","text"],["💡・suggestions","text"]],"🛒 ITEM MARKET":[["🛍️・item-market","forum"],["🏷️・selling-items","forum"],["💰・buying-items","forum"],["🔄・item-trades","forum"],["💎・rare-items","forum"],["📦・bulk-items","forum"],["🔥・deals","forum"],["⭐・seller-reviews","forum"]],"💵 SMP ECONOMY":[["📈・price-check","text"],["💹・market-prices","text"],["🏪・player-shops","forum"],["💎・rare-item-prices","text"],["📊・economy-chat","text"]],"🛡️ SAFE TRADING":[["🔐・trade-rules","text"],["🚨・scam-reports","forum"],["⚖️・trade-disputes","forum"],["✅・trusted-traders","text"]],"☕ PLUGIN DEVELOPMENT":[["☕・java-help","text"],["🧩・paper","text"],["🔧・spigot","text"],["⚡・velocity","text"],["❓・plugin-help","text"],["🔍・code-review","text"],["📦・plugin-showcase","forum"],["🐛・bug-reports","forum"]],"🤝 SERVICES":[["💼・commissions","forum"],["👨‍💻・looking-for-dev","forum"],["🎨・design-services","forum"],["📢・developer-ads","text"]],"🎫 SUPPORT":[["🎟️・create-ticket","text"],["📮・support","text"],["🤖・bot-commands","text"]],"🔊 VOICE":[["🎮・SMP Lounge","voice"],["🛒・Trading Lounge","voice"],["💻・Developer Lounge","voice"],["🔊・General","voice"]],"🔒 STAFF":[["🛡️・staff-chat","text"],["📋・reports","text"],["📜・mod-logs","text"],["💰・market-moderation","text"],["🔧・staff-tools","text"]]};
async function role(g,n,c,h){return g.roles.cache.find(x=>x.name===n)||g.roles.create({name:n,color:c,hoist:h,reason:"SMP marketplace template"})}
async function cat(g,n){return g.channels.cache.find(x=>x.type===ChannelType.GuildCategory&&x.name===n)||g.channels.create({name:n,type:ChannelType.GuildCategory})}
async function channel(g,p,n,t){let x=g.channels.cache.find(c=>c.name===n&&c.parentId===p.id);if(x)return x;return g.channels.create({name:n,parent:p.id,type:t==="voice"?ChannelType.GuildVoice:t==="forum"?ChannelType.GuildForum:ChannelType.GuildText})}
async function setup(g){await g.channels.fetch();await g.roles.fetch();const rm={},cm={},ch={};for(const [n,c,h] of roles)rm[n]=await role(g,n,c,h);for(const [n,items] of Object.entries(groups)){cm[n]=await cat(g,n);for(const [cn,t] of items)ch[cn]=await channel(g,cm[n],cn,t)}const staff=["Owner","Administrator","Senior Moderator","Moderator"];await cm["🔒 STAFF"].permissionOverwrites.edit(g.roles.everyone,{ViewChannel:false});for(const n of staff)await cm["🔒 STAFF"].permissionOverwrites.edit(rm[n],{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});for(const n of ["👋・welcome","📜・rules","📢・announcements","🧭・server-info","🎭・roles","💱・how-to-trade","🔐・trade-rules"])await ch[n].permissionOverwrites.edit(g.roles.everyone,{SendMessages:false,ViewChannel:true});const posts={"👋・welcome":"# 👋 Welcome to the SMP Marketplace Community!\n\n🛒 Buy & sell Minecraft items\n💰 Trade & build your SMP economy\n🏪 Find player shops\n💎 Discover rare items\n💻 Plugin & developer community\n\nRead the rules, choose roles and head to **🛒 ITEM MARKET**.","📜・rules":"# 📜 Rules\n\n1. Be respectful.\n2. No scams, impersonation or deceptive listings.\n3. No stolen, pirated, malicious or prohibited content.\n4. Never share passwords, tokens or private keys.\n5. Use the correct marketplace channel.\n6. Verify trades before sending money/items.\n7. Report suspicious users to staff.\n8. Follow Discord ToS and Community Guidelines.","🧭・server-info":"# 🧭 SMP Marketplace\n\n**Buy • Sell • Trade • Build • Develop**\n\nA player-driven Minecraft SMP marketplace and developer community.\n\nUse forums for individual listings so buyers can find offers and sellers can keep listings organized.","🎭・roles":"# 🎭 Roles\n\n🏷️ Seller\n⭐ Verified Seller\n🛒 Buyer\n💱 Trader\n💎 Trusted Trader\n💻 Developer\n🧪 Tester\n🎨 Designer","💱・how-to-trade":"# 💱 Listing Template\n\n**Item:**\n**Quantity:**\n**Price:**\n**Payment:**\n**Server/SMP:**\n**Delivery:**\n**Proof:**\n\nNever send credentials. Staff do not automatically guarantee private trades.","🔐・trade-rules":"# 🔐 Safe Trading\n\n• Check seller history and reviews.\n• Ask for proof when appropriate.\n• Never share account credentials.\n• Report suspicious listings.\n• For valuable trades, use an official escrow/trade system only if the server provides one."};for(const [n,t] of Object.entries(posts))await ch[n]?.send(t).catch(()=>{});return[Object.keys(groups).length,Object.values(groups).flat().length,roles.length]}
async function makeRolePanel(g,channel,mode){
 const map=mode==="trading"?{"🛒":"🛒 Seller","💰":"💰 Buyer","🔄":"🔄 Trader","⭐":"⭐ Trusted Trader","💎":"💎 Collector","🔥":"🔥 Flipper","🏪":"🏪 Verified Seller"}:{"💻":"💻 Developer","☕":"☕ Java Developer","🧩":"🧩 Paper Developer","⚡":"⚡ Velocity Developer","🧪":"🧪 Tester","🎨":"🎨 Designer","🐛":"🐛 Bug Hunter","📦":"📦 Plugin Creator","🏆":"🏆 Contributor"};
 const msg=await channel.send((mode==="trading"?"# 🛒 Trading Roles":"# 💻 Developer Roles")+"\nReact below to get/remove your role.\n\n"+Object.entries(map).map(([e,r])=>e+" **"+r+"**").join("\n"));
 for(const e of Object.keys(map))await msg.react(e); await msg.pin().catch(()=>{}); return msg;
}
async function installMode(g,mode){await g.roles.fetch();for(const [n,c,h] of roles)await role(g,n,c,h);let panel=g.channels.cache.find(x=>x.name==="🎭・roles");if(!panel)panel=await g.channels.create({name:"🎭・roles",type:ChannelType.GuildText});await makeRolePanel(g,panel,mode);return panel.name;}
const command=new SlashCommandBuilder().setName("setup").setDescription("Choose what to install").addStringOption(o=>o.setName("type").setDescription("Setup type").setRequired(true).addChoices({name:"🛒 Trading / Marketplace",value:"trading"},{name:"💻 Developer / Plugins",value:"developer"},{name:"🚀 Full SMP + Trading + Developer",value:"full"})).setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
const extraCommands=[
new SlashCommandBuilder().setName("roles").setDescription("Show role panels"),
new SlashCommandBuilder().setName("market").setDescription("Marketplace help"),
new SlashCommandBuilder().setName("dev").setDescription("Developer hub help"),
new SlashCommandBuilder().setName("deal-scan").setDescription("Run a DonutSMP bargain scan now").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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

client.once("ready",async()=>{const rest=new REST({version:"10"}).setToken(token);await rest.put(Routes.applicationCommands(clientId),{body:[command.toJSON(),...extraCommands.map(x=>x.toJSON())]});console.log("Online:",client.user.tag,"• Global commands registered");const run=async()=>{for(const g of client.guilds.cache.values()){try{const r=await scanDeals(g);if(r.sent)console.log("Web deal scanner:",r.sent,"new deals");}catch(e){console.error("Web deal scanner:",e.message)}}};run();setInterval(run,DEAL_SCAN_SECONDS*1000)});
client.on("interactionCreate",async i=>{if(!i.isChatInputCommand())return;if(i.commandName==="setup"){await i.deferReply({ephemeral:true});try{const type=i.options.getString("type");if(type==="full"){await setup(i.guild);await installMode(i.guild,"trading");await installMode(i.guild,"developer");await i.editReply("🚀 FULL SETUP DONE — SMP + Trading + Developer + Reaction Roles installed.");}else await i.editReply("✅ "+(await installMode(i.guild,type))+" is ready. Check #🎭・roles.");}catch(e){console.error(e);await i.editReply("❌ Setup failed: "+e.message)}}if(i.commandName==="roles")await i.reply({content:"🎭 Go to #🎭・roles and react to the panels.",ephemeral:true});if(i.commandName==="market")await i.reply({content:"🛒 Marketplace is ready: use the Item Market forums for selling, buying, trades, rare items, bulk items and deals.",ephemeral:true});if(i.commandName==="dev")await i.reply({content:"💻 Developer hub is ready: Java, Paper, Spigot, Velocity, code review, plugin showcase and bug reports.",ephemeral:true});if(i.commandName==="deal-scan"){await i.deferReply({ephemeral:true});try{const r=await scanDeals(i.guild);await i.editReply("🔥 Web scan complete — checked "+r.total+" Donut.Auction items and posted "+r.sent+" new bargain alerts in #🔥・deals.");}catch(e){await i.editReply("❌ Deal scan failed: "+e.message)}}});
const reactionRoles={"🛒":"🛒 Seller","💰":"💰 Buyer","🔄":"🔄 Trader","⭐":"⭐ Trusted Trader","💎":"💎 Collector","🔥":"🔥 Flipper","🏪":"🏪 Verified Seller","💻":"💻 Developer","☕":"☕ Java Developer","🧩":"🧩 Paper Developer","⚡":"⚡ Velocity Developer","🧪":"🧪 Tester","🎨":"🎨 Designer","🐛":"🐛 Bug Hunter","📦":"📦 Plugin Creator","🏆":"🏆 Contributor"};
client.on("messageReactionAdd",async(r,u)=>{if(u.bot||!r.message.guild)return;const n=reactionRoles[r.emoji.name];if(!n)return;try{const x=r.message.guild.roles.cache.find(z=>z.name===n);if(x)await(await r.message.guild.members.fetch(u.id)).roles.add(x)}catch(e){console.error(e.message)}});
client.on("messageReactionRemove",async(r,u)=>{if(u.bot||!r.message.guild)return;const n=reactionRoles[r.emoji.name];if(!n)return;try{const x=r.message.guild.roles.cache.find(z=>z.name===n);if(x)await(await r.message.guild.members.fetch(u.id)).roles.remove(x)}catch(e){console.error(e.message)}});
client.login(token);