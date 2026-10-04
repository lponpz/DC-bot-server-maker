require("dotenv").config();
const {Client,GatewayIntentBits,PermissionFlagsBits,ChannelType,SlashCommandBuilder,REST,Routes}=require("discord.js");
const {DISCORD_TOKEN:token,CLIENT_ID:clientId,GUILD_ID:guildId}=process.env;
if(!token||!clientId||!guildId) throw new Error("Set DISCORD_TOKEN, CLIENT_ID and GUILD_ID in .env");

const client=new Client({intents:[GatewayIntentBits.Guilds]});
const roles=[
["Owner",0xF1C40F,true],["Administrator",0xE74C3C,true],["Senior Moderator",0xE67E22,true],
["Moderator",0x3498DB,true],["Bot",0x5865F2,true],["Developer",0x2ECC71,true],
["Verified Developer",0x57F287,true],["Tester",0x9B59B6,true],["Designer",0xE91E63,true],
["Contributor",0x1ABC9C,true],["Member",0x95A5A6,false],["New Member",0x7F8C8D,false]
];
const groups={
"📌 START HERE":[["👋・welcome","text"],["📜・rules","text"],["📢・announcements","text"],["🧭・server-info","text"],["🎭・roles","text"]],
"💬 COMMUNITY":[["💬・general","text"],["🤝・introductions","text"],["💡・ideas","text"],["📰・minecraft-news","text"],["🤖・bot-commands","text"]],
"☕ JAVA DEVELOPMENT":[["☕・java-help","text"],["🧩・paper","text"],["🔧・spigot","text"],["⚡・velocity","text"],["🌐・bungeecord","text"],["🧱・minecraft-api","text"],["🐛・debugging","text"]],
"🛠️ PLUGIN DEVELOPMENT":[["❓・plugin-help","text"],["🔍・code-review","text"],["🧪・testing","text"],["📦・plugin-showcase","forum"],["🐞・bug-reports","forum"],["💡・plugin-ideas","forum"],["🔗・resources","text"]],
"🤝 COLLABORATION":[["🤝・collaborations","text"],["💼・commissions","text"],["👨‍💻・looking-for-dev","text"],["📢・developer-ads","text"]],
"📚 RESOURCES":[["📖・tutorials","text"],["🔗・useful-links","text"],["🧰・dev-tools","text"],["📋・faq","text"]],
"🎫 SUPPORT":[["🎟️・create-ticket","text"],["📮・support","text"]],
"🔊 VOICE":[["💻・Coding Lounge","voice"],["🎮・Minecraft","voice"],["🔊・General","voice"]],
"🔒 STAFF":[["🛡️・staff-chat","text"],["📋・reports","text"],["📜・mod-logs","text"],["🔧・staff-tools","text"]]
};
async function role(g,n,c,h){return g.roles.cache.find(x=>x.name===n)||g.roles.create({name:n,color:c,hoist:h})}
async function cat(g,n){return g.channels.cache.find(x=>x.type===ChannelType.GuildCategory&&x.name===n)||g.channels.create({name:n,type:ChannelType.GuildCategory})}
async function channel(g,p,n,t){
 let x=g.channels.cache.find(c=>c.name===n&&c.parentId===p.id); if(x)return x;
 return g.channels.create({name:n,parent:p.id,type:t==="voice"?ChannelType.GuildVoice:t==="forum"?ChannelType.GuildForum:ChannelType.GuildText});
}
async function setup(g){
 await g.channels.fetch(); await g.roles.fetch();
 const rm={}; for(const [n,c,h] of roles) rm[n]=await role(g,n,c,h);
 const cm={}; const ch={};
 for(const [n,items] of Object.entries(groups)){cm[n]=await cat(g,n);for(const [cn,t] of items)ch[cn]=await channel(g,cm[n],cn,t)}
 const staff=["Owner","Administrator","Senior Moderator","Moderator"];
 await cm["🔒 STAFF"].permissionOverwrites.edit(g.roles.everyone,{ViewChannel:false});
 for(const n of staff) await cm["🔒 STAFF"].permissionOverwrites.edit(rm[n],{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});
 for(const n of ["👋・welcome","📜・rules","📢・announcements","🧭・server-info","🎭・roles"])
   await ch[n].permissionOverwrites.edit(g.roles.everyone,{SendMessages:false,ViewChannel:true});
 await ch["📜・rules"].send("# 📜 Server Rules\n\n1. Be respectful.\n2. No spam or unsolicited advertising.\n3. Keep discussions relevant to Minecraft/development.\n4. No malware, token stealers or destructive code.\n5. Never share passwords or tokens.\n6. Respect developers and their work.\n7. Use the correct channels.\n8. Follow Discord ToS and Community Guidelines.").catch(()=>{});
 await ch["🧭・server-info"].send("# 🧭 Server Info\n\n**Minecraft Plugin Developers**\nBuild • Share • Learn • Develop\n\n☕ Java • 🧩 Paper • 🔧 Spigot • ⚡ Velocity • 🌐 BungeeCord").catch(()=>{});
 await ch["🎭・roles"].send("# 🎭 Roles\n\n💻 Developer\n⭐ Verified Developer\n🧪 Tester\n🎨 Designer\n🤝 Contributor\n🎮 Member").catch(()=>{});
 await ch["👋・welcome"].send("# 👋 Welcome to Minecraft Plugin Developers!\n\nRead the rules, introduce yourself, choose relevant roles and start building.").catch(()=>{});
 return [Object.keys(groups).length,Object.values(groups).flat().length,Object.keys(rm).length];
}
const command=new SlashCommandBuilder().setName("setup").setDescription("Create the complete Minecraft Plugin Developers server setup.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
client.once("ready",async()=>{const rest=new REST({version:"10"}).setToken(token);await rest.put(Routes.applicationGuildCommands(clientId,guildId),{body:[command.toJSON()]});console.log("Bot online:",client.user.tag);});
client.on("interactionCreate",async i=>{if(!i.isChatInputCommand()||i.commandName!=="setup")return;await i.deferReply({ephemeral:true});try{const r=await setup(i.guild);await i.editReply(`✅ Setup complete! ${r[0]} categories, ${r[1]} channels, ${r[2]} roles created/verified.`)}catch(e){console.error(e);await i.editReply("❌ Setup failed: "+e.message)}});
client.login(token);
