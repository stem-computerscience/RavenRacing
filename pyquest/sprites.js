// 8×8 pixel-art sprite library, shared by the game runner and the app (avatars, shop).
// '.' is transparent; each other letter maps to a colour in the sprite's palette.

export const SPRITES = {
  ship:   { p: { a: "#dfe6ee", b: "#3fb6ff", c: "#ff8a2a" }, m: ["...aa...", "..abba..", "..abba..", ".aaaaaa.", "aaaaaaaa", "aa.aa.aa", "a..cc..a", "...cc..."] },
  star:   { p: { y: "#ffd23f", o: "#ffb000" }, m: ["...yy...", "...yy...", "yyyyyyyy", ".yyooyy.", "..yyyy..", ".yy..yy.", "yy....yy", "........"] },
  rock:   { p: { g: "#8a8f98", G: "#5b6068" }, m: ["..gggg..", ".ggGggg.", "gggggGgg", "gGgggggg", "gggggGgg", "ggGggggg", ".ggggGg.", "..gggg.."] },
  basket: { p: { b: "#c98a4b", B: "#8a5a2b" }, m: ["........", "..bbbb..", ".b....b.", "BBBBBBBB", "BbBbBbBB", ".BbBbBb.", ".BBBBBB.", "........"] },
  apple:  { p: { r: "#ff4757", R: "#c0392b", g: "#2ecc71", w: "#ffd1d6" }, m: ["....g...", "...g....", ".rrrrrr.", "rrwrrrrr", "rwrrrrrR", "rrrrrrRR", ".rrrrRR.", "..rRRR.."] },
  coin:   { p: { y: "#ffd23f", o: "#e0a800", w: "#fff6c2" }, m: ["..yyyy..", ".yowwoy.", "yyoyyoyy", "yyoyyoyy", "yyoyyoyy", "yyoyyoyy", ".yooooy.", "..yyyy.."] },
  cat:    { p: { o: "#ff9f43", k: "#222", p: "#ff7aa8" }, m: ["o.....o.", "oo...oo.", "ooooooo.", "okooko o", "oooooo..", "oopppoo.", ".oooooo.", ".o.o.o.."].map((r) => r.replace(" ", "o")) },
  ghost:  { p: { w: "#f1f2f6", k: "#2f3542", b: "#a4b0be" }, m: ["..wwww..", ".wwwwww.", "wwkwwkww", "wwkwwkww", "wwwwwwww", "wwwbbwww", "wwwwwwww", "w.ww.ww."] },
  gem:    { p: { c: "#48dbfb", d: "#0abde3", w: "#e0fbff" }, m: ["........", ".cccccc.", "cwccccdc", "cccccddd", ".cccddd.", "..cddd..", "...dd...", "........"] },
  heart:  { p: { r: "#ff4d6d", w: "#ffc2cf" }, m: ["........", ".rr..rr.", "rwrrrrrr", "rrrrrrrr", ".rrrrrr.", "..rrrr..", "...rr...", "........"] },
  ufo:    { p: { g: "#7bed9f", s: "#ced6e0", d: "#747d8c", y: "#ffd23f" }, m: ["...gg...", "..gggg..", ".ssssss.", "ssssssss", "dydydydy", ".dddddd.", "..y..y..", ".y....y."] },
  fish:   { p: { b: "#1e90ff", l: "#70a1ff", k: "#111", w: "#fff" }, m: ["........", "...bbb..", "b.bbbbb.", "bbblllwk", "bbbllllb", "b.bbbbb.", "...bbb..", "........"] },
  dragon: { p: { g: "#26de81", d: "#20bf6b", r: "#fc5c65", k: "#111" }, m: ["......gg", "....gggk", "d..ggggg", "dd.gggrr", "ddgggg..", ".gggggg.", "..g..g..", ".gg.gg.."] },
  robot:  { p: { s: "#a4b0be", d: "#57606f", b: "#48dbfb", r: "#ff4757" }, m: ["...r....", "...d....", ".ssssss.", ".sbssbs.", ".ssssss.", ".sdddds.", "..s..s..", ".dd..dd."] },
  // game-type sprites (free for everyone)
  hero:   { p: { h: "#ffd23f", s: "#ffd9b3", k: "#222", g: "#2ecc71", b: "#3b3b98" }, m: ["..hhhh..", ".hhhhhh.", "..skks..", "..ssss..", ".gggggg.", "g.gggg.g", "..g..g..", ".bb..bb."] },
  knight: { p: { a: "#c8d6e5", d: "#576574", r: "#ff4757", k: "#222" }, m: ["...r....", "..aar...", ".aaaaa..", ".akkka..", ".aaaaa.d", "aaaaaaad", ".a...a.d", ".dd.dd.."] },
  alien:  { p: { g: "#a29bfe", w: "#fff", k: "#222" }, m: ["g......g", ".g....g.", "..gggg..", ".gwggwg.", "gggggggg", "g.gggg.g", "g.g..g.g", "...gg..."] },
  laser:  { p: { c: "#7bed9f", w: "#fff" }, m: ["...cc...", "...wc...", "...wc...", "...wc...", "...wc...", "...cc...", "........", "........"] },
  bomb:   { p: { k: "#2f3542", r: "#ff4757", y: "#ffd23f" }, m: ["....y...", "...r....", "..kkkk..", ".kkkkkk.", ".kkkkkk.", ".kkkkkk.", "..kkkk..", "........"] },
  frog:   { p: { g: "#2ecc71", d: "#218c4a", w: "#fff", k: "#111" }, m: ["..w..w..", ".gkggkg.", "gggggggg", "gddggddg", ".gggggg.", "g.gggg.g", "gg....gg", "........"] },
  car:    { p: { r: "#ff4757", d: "#c0392b", w: "#9fe3ff", k: "#222" }, m: ["........", "..rrrr..", ".rwwwwr.", "rrrrrrrr", "rdrrrrdr", "rrrrrrrr", ".kk..kk.", "........"] },
  ball:   { p: { w: "#fff", g: "#dfe6e9", s: "#b2bec3" }, m: ["..wwww..", ".wwwwgw.", "wwwwwwgw", "wwwwwwgg", "wwwwwgsg", "wwwwggsg", ".wggsss.", "..ssss.."] },
  slime:  { p: { g: "#26de81", d: "#20bf6b", w: "#fff", k: "#111" }, m: ["........", "...gg...", "..gggg..", ".gwkgwk.", "gggggggg", "gggggggg", "dddddddd", "........"] },
  bat:    { p: { p: "#6c5ce7", r: "#ff4757" }, m: ["........", "p......p", "pp.pp.pp", "ppprrppp", "pppppppp", "p.pppp.p", "........", "........"] },
  boots:  { p: { r: "#ff6b4a", y: "#ffd23f" }, m: ["........", "..rr....", "..rr....", "..rr....", "..rrrr..", "..rrrrr.", "..yyyyy.", "........"] },
  // guide characters and the boss (not for sale)
  wizard:   { p: { h: "#6c5ce7", y: "#ffd23f", s: "#ffd9b3", k: "#222", w: "#f1f2f6" }, m: ["...hh...", "..hhyh..", ".hhhhhh.", "hhhhhhhh", "..sksk..", "..swws..", ".hwwwwh.", ".hh..hh."] },
  octopus:  { p: { p: "#ff7aa8", d: "#e84393", w: "#fff", k: "#222" }, m: ["..pppp..", ".pppppp.", "pwkppwkp", "pppppppp", ".pppppp.", "pdpdpdpd", "p.p..p.p", ".p.pp.p."] },
  cabinet:  { p: { b: "#ff2e88", s: "#48dbfb", k: "#1b1022", y: "#ffd23f" }, m: [".bbbbbb.", ".bkkkkb.", ".bkssKb.".replace("K", "k"), ".bkkkkb.", ".bbbbbb.", ".bybkbb.", ".bbbbbb.", ".bb..bb."] },
  bugbeast: { p: { g: "#a3e635", d: "#4d7c0f", r: "#ff4757", k: "#111" }, m: ["d.d..d.d", ".dggggd.", "ggrggrgg", "gggggggg", "gkgkgkgg", ".gggggg.", "d.d..d.d", "d......d"] },
};
export const GUIDES = { space: "robot", fantasy: "wizard", arcade: "cabinet", ocean: "octopus" };

export const SPRITE_NAMES = Object.keys(SPRITES);

// Draw sprite `name` centred at (x, y), `px` pixels wide, on a 2D canvas context.
export function drawSprite(ctx, name, x, y, px = 32) {
  const s = SPRITES[name] || SPRITES.star;
  const cell = px / 8;
  for (let r = 0; r < 8; r++) {
    const row = s.m[r];
    for (let c = 0; c < 8; c++) {
      const col = s.p[row[c]];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(x - px / 2 + c * cell), Math.round(y - px / 2 + r * cell), Math.ceil(cell), Math.ceil(cell));
    }
  }
}

// Sprite as an inline SVG string (crisp at any size) for the app UI.
export function spriteSVG(name, size = 32, title = "") {
  const s = SPRITES[name] || SPRITES.star;
  let rects = "";
  s.m.forEach((row, r) => [...row].forEach((ch, c) => {
    const col = s.p[ch];
    if (col) rects += `<rect x="${c}" y="${r}" width="1.02" height="1.02" fill="${col}"/>`;
  }));
  const t = title ? `<title>${title.replace(/[<>&"]/g, "")}</title>` : "";
  return `<svg class="px" viewBox="0 0 8 8" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="${title.replace(/[<>&"]/g, "") || name}">${t}${rects}</svg>`;
}
