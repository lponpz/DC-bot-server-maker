require("dotenv").config();
const {Client,GatewayIntentBits,PermissionFlagsBits,ChannelType,SlashCommandBuilder,REST,Routes}=require("discord.js");
const {DISCORD_TOKEN:token,CLIENT_ID:clientId,GUILD_ID:guildId}=process.env;
if(!token||!clientId||!guildId) throw new Error("Set DISCORD_TOKEN, CLIENT_ID and GUILD_ID in .env");

const client=new Client({intents:[GatewayIntentBits.Guilds]});
const roles=[
["Owner",0xF1C40F,true],["Administrator",0xE74C3C,true],["Senior Moderator",0xE67E22,true],
["Moderator",0x3498DB,true],["Bot",0x5865F2,true],["Developer",0x2ECC71,true],
["Verified Developer",0x57F287,true],["Trader",0xF1C40F,true],["Seller",0x2ECC71,true],
["Buyer",0x3498DB,true],["Trusted Seller",0x9B59B6,true],["Tester",0xE91E63,true],
["Designer",0x1ABC9C,true],["Contributor",0x16A085,true],["Member",0x95A5A6,false],["New Member",0x7F8C8D,false]
];

const groups={
"📌 START HERE":[["👋・welcome","text"],["📜・rules","text"],["📢・announcements","text"],["🧭・server-info","text"],["🎭・roles","text"],["💱・how-to-trade","text"]],
"💬 COMMUNITY":[["💬・general","text"],["🤝・introductions","text"],["💡・ideas","text"],["📰・minecraft-news","text"],["🤖・bot-commands","text"],["📸・screenshots","text"]],
"🛒 MARKETPLACE":[["🛍️・marketplace","forum"],["💰・buying","forum"],["🏷️・selling","forum"],["🔄・trades","forum"],["💎・rare-items","forum"],["📦・bulk-deals","forum"],["⭐・seller-reviews","forum"]],
"💵 ECONOMY":[["📈・price-check","text"],["💹・market-prices","text"],["🔥・deals","text"],["🎁・giveaways","text"],["🏦・economy-help","text"]],
"🛡️ SAFE TRADING":[["🔐・trade-rules","text"],["🚨・scam-reports","forum"],["⚖️・trade-disputes","forum"],["✅・trusted-sellers","text"]],
"☕ JAVA DEVELOPMENT":[["☕・java-help","text"],["🧩・paper","text"],["🔧・spigot","text"],["⚡・velocity","text"],["🌐・bungeecord","text"],["🧱・minecraft-api","text"],["🐛・debugging","text"]],
"🛠️ PLUGIN DEVELOPMENT":[["❓・plugin-help","text"],["🔍・code-review","text"],["🧪・testing","text"],["📦・plugin-showcase","forum"],["🐞・bug-reports","forum"],["💡・plugin-ideas","forum"],["🔗・resources","text"]],
"🤝 COLLABORATION":[["🤝・collaborations","text"],["💼・commissions","text"],["👨‍💻・looking-for-dev","text"],["📢・developer-ads","text"]],
"📚 RESOURCES":[["📖・tutorials","text"],["🔗・useful-links","text"],["🧰・dev-tools","text"],["📋・faq","text"]],
"🎫 SUPPORT":[["🎟️・create-ticket","text"],["📮・support","text"]],
"🔊 VOICE":[["💻・Coding Lounge","voice"],["🎮・Minecraft","voice"],["🛒・Trading Lounge","voice"],["🔊・General","voice"]],
"🔒 STAFF":[["🛡️・staff-chat","text"],["📋・reports","text"],["📜・mod-logs","text"],["🔧・staff-tools","text"],["💰・market-moderation","text"]]
};

async function role(g,n,c,h){return g.roles.cache.find(x=>x.name===n)||g.roles.create({name:n,color:c,hoist:h,reason:"Marketplace community setup"})}
async function cat(g,n){return g.channels.cache.find(x=>x.type===ChannelType.GuildCategory&&x.name===n)||g.channels.create({name:n,type:ChannelType.GuildCategory})}
async function channel(g,p,n,t){
 let x=g.channels.cache.find(c=>c.name===n&&c.parentId===p.id); if(x)return x;
 return g.channels.create({name:n,parent:p.id,type:t==="voice"?ChannelType.GuildVoice:t==="forum"?ChannelType.GuildForum:ChannelType.GuildText});
}
async function setup(g){
 await g.channels.fetch(); await g.roles.fetch();
 const rm={}; for(const [n,c,h] of roles) rm[n]=await role(g,n,c,h);
 const cm={},ch={};
 for(const [n,items] of Object.entries(groups)){cm[n]=await cat(g,n);for(const [cn,t] of items)ch[cn]=await channel(g,cm[n],cn,t)}
 const staff=["Owner","Administrator","Senior Moderator","Moderator"];
 await cm["🔒 STAFF"].permissionOverwrites.edit(g.roles.everyone,{ViewChannel:false});
 for(const n of staff) await cm["🔒 STAFF"].permissionOverwrites.edit(rm[n],{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});
 for(const n of ["👋・welcome","📜・rules","📢・announcements","🧭・server-info","🎭・roles","💱・how-to-trade"])
   await ch[n].permissionOverwrites.edit(g.roles.everyone,{SendMessages:false,ViewChannel:true});

 const posts={
"📜・rules":"# 📜 Community Rules\n\n1. Be respectful.\n2. No spam or unsolicited advertising.\n3. No scams, impersonation, chargeback fraud, or deceptive listings.\n4. Never share passwords, tokens, private keys, or personal information.\n5. Keep trades and listings in the marketplace channels.\n6. Do not sell prohibited, stolen, pirated, or malicious content.\n7. Verify every trade before sending payment or items.\n8. Staff may remove suspicious listings and investigate reports.\n9. Follow Discord Terms and Community Guidelines.\n10. Use common sense.",
"🧭・server-info":"# 🧭 Community\n\n**Minecraft Marketplace & Developer Community**\nBuy • Sell • Trade • Build • Develop\n\nUse the marketplace for item listings, deals and trades. Use developer channels for plugins and Java development.",
"🎭・roles":"# 🎭 Community Roles\n\n🛒 Buyer — looking to purchase\n🏷️ Seller — listing items/services\n⭐ Trusted Seller — earned through community reputation\n💻 Developer — plugin development\n🧪 Tester — testing and feedback\n🎨 Designer — graphics/UI\n🤝 Contributor — community contribution",
"💱・how-to-trade":"# 💱 How to Trade Safely\n\n**Listing format**\nItem/service:\nQuantity:\nPrice:\nPayment method:\nMinecraft version/server:\nDelivery method:\nProof/screenshots:\n\nNever send passwords or account tokens. For expensive trades, use the server's approved trade process if one is provided.",
"👋・welcome":"# 👋 Welcome!\n\nA Minecraft marketplace + developer community for buying, selling, trading and building.\n\nRead the rules, choose roles, then visit **🛒 MARKETPLACE** to start.",
"🔐・trade-rules":"# 🔐 Safe Trading\n\n• Check seller history.\n• Never trust edited screenshots alone.\n• Don't share account credentials.\n• Report suspicious behavior immediately.\n• Staff cannot guarantee a private transaction unless an official escrow/trade system is explicitly provided."
};
 for(const [n,text] of Object.entries(posts)) await ch[n]?.send(text).catch(()=>{});
 return [Object.keys(groups).length,Object.values(groups).flat().length,Object.keys(rm).length];
}
const command=new SlashCommandBuilder().setName("setup").setDescription("Create the Minecraft marketplace + developer community server.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
client.once("ready",async()=>{const rest=new REST({version:"10"}).setToken(token);await rest.put(Routes.applicationGuildCommands(clientId,guildId),{body:[command.toJSON()]});console.log("Bot online:",client.user.tag);});
client.on("interactionCreate",async i=>{if(!i.isChatInputCommand()||i.commandName!=="setup")return;await i.deferReply({ephemeral:true});try{const r=await setup(i.guild);await i.editReply(`✅ Community template installed! ${r[0]} categories, ${r[1]} channels, ${r[2]} roles created/verified.`)}catch(e){console.error(e);await i.editReply("❌ Setup failed: "+e.message)}});
client.login(token);
