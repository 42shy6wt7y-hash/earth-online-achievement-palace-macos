const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const assetsDir = path.join(root, "public", "seed-assets");
const seedFile = path.join(root, "public", "seed-achievements.json");

const achievements = [
  ["protagonist-arrives", "主角登场", "创建角色成功，哭声即为登录音效。", "来到地球服务器，开始本轮人生存档。", "baby"],
  ["run", "润", "月亮怎么变圆了。", "在外国定居。", "moon"],
  ["wait-for-rise", "待涨", "三千点能守住。", "买的股票跌停至少一次。", "stock"],
  ["you-cannot-outrun-me", "你跑不过我", "嘴唇发红，可能是心脏太好了。", "全程马拉松完赛至少一次。", "runner"],
  ["real-or-fake-chef", "真假厨子说", "摊点齁逼多，真假厨子说。", "亲自下厨做饭。", "chef"],
  ["hakimi", "哈基米", "欧玛资立曼波。", "拥有自己的猫。", "cat"],
  ["xiaochuan-heir", "笑川传人", "你吼辣么大声干什么嘛。", "替别人背锅一次。", "bag"],
  ["numb-already", "早已麻痹", "我早已麻痹。", "公共场合大声骂人一次。", "shout"],
  ["human-traitor", "人奸", "Sir AI, this way!", "使用 AI 工具从而为 AI 训练提供数据集。", "robot"],
  ["keyboard-politics", "键政", "梨花飘落在你窗前。", "在互联网发表政治话题相关评论一次。", "flag"],
  ["too-beautiful", "只因你太美", "再看一眼就会爆炸。", "经历过一见钟情。", "heart"],
  ["library-at-dawn", "凌晨图书馆", "你见过凌晨五点的图书馆吗。", "为考试复习通宵一次。", "bookmoon"],
  ["drunkard", "酒蒙子", "喝完酒地球是我的。", "喝断片一次。", "bottle"],
  ["language-pack", "语言包", "我能用八国语言问候你。", "掌握至少三门语言。", "globe"],
  ["enjoy-solitude", "享受孤独", "一个人的夜我的心应该放在哪里。", "一个人生活半年以上。", "solitude"],
  ["load-save", "读档", "还好存档了，再来一遍。", "挑战失败后从头再来。", "reload"],
  ["cyber-bodhisattva", "赛博菩萨", "施主，链接已经放在评论区了。", "给陌生人分享过资源、教程、经验或解决方案。", "link"],
  ["chosen-worker", "天选打工人", "工位是我的复活点，老板是每日 Boss。", "经历过连续加班或一段高强度工作期。", "desk"],
  ["weather-child", "天气之子", "出门即降雨，抬头即剧情。", "没带伞时遇到大雨，或出行被天气狠狠制裁一次。", "rain"],
  ["awkward-immunity", "尴尬免疫", "只要我不尴尬，尴尬就是环境特效。", "经历一次尴尬事件后仍假装无事发生。", "mask"],
  ["human-specimen", "人类观察样本", "该 NPC 行为逻辑无法解释。", "目睹一次非常离谱的人类行为。", "observe"],
  ["reverse-sprint", "反向冲刺", "截止线，也是起跑线。", "在最后期限前极限完成一件事。", "deadline"],
  ["cyber-stall", "赛博摆摊", "世界频道已开张，欢迎路过。", "创建自媒体账号，并发布至少一条作品。", "broadcast"],
  ["family-supply", "家族补给箱", "这次轮到我给出生点送装备。", "为家人买过一次礼物。", "gift"],
  ["first-kiss-save", "初吻存档", "触发事件后，背景音乐自动变大。", "经历过初吻。", "kiss"],
  ["party-contract", "组队契约", "双人模式已开启，掉线需协商。", "结婚，或与伴侣建立长期共同生活关系。", "rings"],
  ["new-account", "新号注册", "欢迎新玩家加入地球服务器。", "拥有自己的孩子，或见证一个新生命进入家庭。", "stroller"],
  ["meteor-check", "流星判定", "许愿窗口只开放了 0.8 秒。", "亲眼看到一次流星。", "meteor"],
  ["deep-sea-loading", "深海加载中", "氧气条出现了，恐惧也出现了。", "尝试过一次潜水。", "diving"],
  ["skyfall-protection", "高空掉落保护", "你从天上下来，并且还能吹牛。", "尝试过一次跳伞。", "parachute"],
  ["one-hp-counterkill", "丝血反杀", "我命由我不由天。", "经历濒死体验并活过来。", "lifebar"],
  ["heal-the-team", "奶一口", "给队友回血是专业的。", "帮家人或朋友渡过难关。", "heal"],
  ["one-hit-short", "还差一刀", "你已超过 99% 的用户，即将提现。", "离成功只差一步但失败了。", "sword"],
  ["extraction-success", "撤离成功", "跑刀还是堵桥？", "经历战争并存活。", "evac"],
  ["spaceman", "太空人", "Oh, I'm floating in space!", "进入太空一次。", "astronaut"],
  ["bought-a-watch", "买了个表", "我去年买了个表。", "购买一次奢侈品。", "watch"]
];

const iconMap = {
  baby: '<circle cx="128" cy="103" r="30"/><path d="M82 188c8-42 34-62 46-62s38 20 46 62z"/><path d="M88 167c22 18 58 18 80 0"/><circle cx="118" cy="101" r="4" fill="#050505"/><circle cx="138" cy="101" r="4" fill="#050505"/>',
  moon: '<path d="M163 62a50 50 0 1 0 0 100 64 64 0 1 1 0-100z"/><path d="M67 187h116"/><path d="M98 176l30-32 30 32"/>',
  stock: '<path d="M58 66v128h142" fill="none"/><path d="M72 92l36 22 29-18 42 64" fill="none"/><path d="M171 160h32v32" fill="none"/>',
  runner: '<circle cx="132" cy="70" r="18"/><path d="M119 92l-24 43 42 15 31 45" fill="none"/><path d="M108 121l-38 2" fill="none"/><path d="M135 105l38 26" fill="none"/><path d="M136 149l-42 43" fill="none"/>',
  chef: '<path d="M83 103c-24-30 19-54 45-31 26-23 69 1 45 31z"/><rect x="83" y="103" width="90" height="28" rx="7"/><path d="M84 145h86M103 173h50" fill="none"/><path d="M73 188l45-45" fill="none"/>',
  cat: '<path d="M72 101l24-37 24 28h16l24-28 24 37v49c0 31-112 31-112 0z"/><circle cx="110" cy="130" r="5" fill="#050505"/><circle cx="146" cy="130" r="5" fill="#050505"/><path d="M122 153c8 7 14 7 22 0" fill="none"/>',
  bag: '<path d="M92 105h72l18 82H74z"/><path d="M108 105c0-28 40-28 40 0" fill="none"/><path d="M96 150h64" fill="none"/>',
  shout: '<circle cx="103" cy="105" r="30"/><path d="M91 144h55l18 43H73z"/><path d="M151 87l43-19M158 113h49M151 139l43 19" fill="none"/>',
  robot: '<rect x="75" y="82" width="106" height="82" rx="14"/><circle cx="107" cy="120" r="8" fill="#050505"/><circle cx="149" cy="120" r="8" fill="#050505"/><path d="M107 145h42M128 82V55M104 187h48" fill="none"/>',
  flag: '<path d="M78 61v132" fill="none"/><path d="M82 67h99l-18 32 18 31H82z"/><path d="M98 149h70" fill="none"/>',
  heart: '<path d="M128 188S62 148 70 100c6-36 45-38 58-11 13-27 52-25 58 11 8 48-58 88-58 88z"/><path d="M62 62l132 132" fill="none"/>',
  bookmoon: '<path d="M61 80c33-13 52-8 67 8 15-16 34-21 67-8v103c-33-13-52-8-67 8-15-16-34-21-67-8z" fill="none"/><path d="M128 88v103M170 56a26 26 0 1 0 0 52 34 34 0 1 1 0-52z"/>',
  bottle: '<path d="M111 58h34v34l18 28v68H93v-68l18-28z"/><path d="M105 133h46M109 166h38" fill="none"/>',
  globe: '<circle cx="128" cy="128" r="62" fill="none"/><path d="M66 128h124M128 66c-26 26-26 98 0 124M128 66c26 26 26 98 0 124" fill="none"/><circle cx="178" cy="78" r="15"/>',
  solitude: '<path d="M70 187c5-41 29-64 58-64s53 23 58 64z"/><circle cx="128" cy="83" r="26"/><path d="M79 50h98" fill="none"/>',
  reload: '<path d="M184 120a56 56 0 1 1-18-42" fill="none"/><path d="M166 53v34h34" fill="none"/><path d="M110 109h42v42h-42z"/>',
  link: '<path d="M104 105l-28 28a30 30 0 0 0 42 42l25-25" fill="none"/><path d="M152 106l28-28a30 30 0 0 0-42-42l-25 25" fill="none"/><path d="M103 153l50-50" fill="none"/>',
  desk: '<rect x="70" y="88" width="116" height="66" rx="8"/><path d="M88 188h80M101 154l-18 34M155 154l18 34" fill="none"/><circle cx="128" cy="67" r="17"/>',
  rain: '<path d="M68 103c8-37 41-49 65-35 15-23 54-11 58 18 27 4 34 49 2 55H67c-30-5-27-42 1-38z"/><path d="M88 164l-10 22M125 164l-10 22M162 164l-10 22" fill="none"/>',
  mask: '<path d="M68 88c34-18 86-18 120 0-3 60-25 95-60 95S71 148 68 88z"/><circle cx="104" cy="120" r="9" fill="#050505"/><circle cx="152" cy="120" r="9" fill="#050505"/><path d="M106 154c16-10 28-10 44 0" fill="none"/>',
  observe: '<path d="M56 128s28-48 72-48 72 48 72 48-28 48-72 48-72-48-72-48z"/><circle cx="128" cy="128" r="24" fill="#050505"/><circle cx="128" cy="128" r="13"/>',
  deadline: '<path d="M62 190h132" fill="none"/><path d="M76 174h68" fill="none"/><circle cx="158" cy="92" r="38" fill="none"/><path d="M158 70v25l19 14" fill="none"/><path d="M74 92h50M74 119h42" fill="none"/>',
  broadcast: '<rect x="58" y="74" width="126" height="84" rx="8"/><path d="M84 181h88M121 158v23" fill="none"/><circle cx="108" cy="116" r="16"/><path d="M141 101c14 12 14 30 0 42M161 88c27 25 27 55 0 80" fill="none"/>',
  gift: '<rect x="65" y="103" width="126" height="82" rx="8"/><path d="M128 103v82M65 130h126" fill="none"/><path d="M128 103c-31-21-45-48-18-53 19-3 18 28 18 53zm0 0c31-21 45-48 18-53-19-3-18 28-18 53z"/>',
  kiss: '<path d="M96 94c23 0 32 24 32 24s9-24 32-24c22 0 34 20 26 42-10 31-58 55-58 55s-48-24-58-55c-8-22 4-42 26-42z"/><path d="M70 67l35 12M186 67l-35 12" fill="none"/>',
  rings: '<circle cx="105" cy="135" r="38" fill="none"/><circle cx="151" cy="135" r="38" fill="none"/><path d="M95 89l16-22 16 22M141 89l16-22 16 22" fill="none"/>',
  stroller: '<circle cx="98" cy="180" r="14"/><circle cx="162" cy="180" r="14"/><path d="M78 155h104l-18-58H96z"/><path d="M164 97c0-31-26-45-54-32" fill="none"/>',
  meteor: '<path d="M62 159l68-68 35 35-68 68z"/><path d="M154 68l38-16M165 89l44-2M143 52l8-35" fill="none"/>',
  diving: '<circle cx="120" cy="90" r="20"/><path d="M83 126c35-25 65-25 100 0" fill="none"/><path d="M91 151c45 20 72 20 117 0M60 181c48-15 88-15 136 0" fill="none"/>',
  parachute: '<path d="M58 104a70 70 0 0 1 140 0z"/><path d="M58 104l70 84 70-84M128 188v-46" fill="none"/><circle cx="128" cy="195" r="13"/>',
  lifebar: '<rect x="62" y="72" width="132" height="36" rx="8" fill="none"/><rect x="70" y="82" width="34" height="16"/><path d="M92 158l36-40 36 40-36 35z"/><path d="M182 63l-38 64" fill="none"/>',
  heal: '<circle cx="128" cy="128" r="60" fill="none"/><path d="M113 83h30v30h30v30h-30v30h-30v-30H83v-30h30z"/>',
  sword: '<path d="M176 62l-58 83" fill="none"/><path d="M95 168l22-22 18 18-22 22z"/><path d="M77 185l34-34" fill="none"/><path d="M160 71l31-9-9 31"/>',
  evac: '<path d="M66 173h124" fill="none"/><path d="M85 154l35-52 35 52z"/><path d="M57 96h78" fill="none"/><path d="M108 78l27 18-27 18" fill="none"/>',
  astronaut: '<circle cx="128" cy="112" r="42"/><rect x="88" y="93" width="80" height="38" rx="18" fill="#050505"/><path d="M88 166c18 18 62 18 80 0M70 75l-22-22M186 181l23 22" fill="none"/>',
  watch: '<circle cx="128" cy="128" r="45" fill="none"/><path d="M108 83l8-32h24l8 32M108 173l8 32h24l8-32M128 101v27l22 13" fill="none"/>'
};

function stars() {
  return [
    '<path d="M50 54v16M42 62h16M205 55v18M196 64h18M52 207v12M46 213h12" fill="none"/>',
    '<circle cx="198" cy="198" r="3"/><circle cx="58" cy="118" r="3"/><circle cx="202" cy="126" r="2"/>'
  ].join("");
}

function svg(icon) {
  const body = iconMap[icon] || iconMap.observe;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="512" height="512">
  <rect width="256" height="256" fill="#050505"/>
  <rect x="10" y="10" width="236" height="236" rx="15" fill="none" stroke="#d99d25" stroke-width="5"/>
  <rect x="20" y="20" width="216" height="216" rx="10" fill="none" stroke="#6b4310" stroke-width="2" opacity="0.9"/>
  <circle cx="128" cy="128" r="94" fill="#f5bd3e" opacity="0.08"/>
  <g fill="#f4b93d" stroke="#f4b93d" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
    ${body}
    ${stars()}
  </g>
</svg>
`;
}

fs.mkdirSync(assetsDir, { recursive: true });

const seed = achievements.map(([slug, title, summary, condition, icon], index) => {
  const file = `${slug}.svg`;
  fs.writeFileSync(path.join(assetsDir, file), svg(icon), "utf8");
  return {
    id: `seed-${slug}`,
    title,
    summary,
    condition,
    status: "locked",
    image: `/seed-assets/${file}`,
    order: index + 1,
    tags: ["默认成就"]
  };
});

fs.writeFileSync(seedFile, `${JSON.stringify({ version: 1, achievements: seed }, null, 2)}\n`, "utf8");
console.log(`Generated ${seed.length} seed achievements.`);
