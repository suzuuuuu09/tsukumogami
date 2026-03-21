export const yokaiImageMap = {
  鬼: 'oni.png',
  狛犬: 'komainu.png',
  提灯お化け: 'chouchin.png',
  招き猫: 'manekineko.png',
  傘地蔵: 'kasajizou.png',
  化け猫: 'bakeneko.png',
  唐傘おばけ: 'kasa_youkai.png',
  座敷童子: 'zashiki_warashi.png',
  狸: 'tanuki.png',
  河童: 'kappa.png',
  だるま: 'daruma_red.png',
}

export const yokaiList = Object.keys(yokaiImageMap)

export function getRandomYokai() {
  return yokaiList[Math.floor(Math.random() * yokaiList.length)]
}
