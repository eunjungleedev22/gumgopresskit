/**
 * The biography, at three lengths in four languages.
 *
 * All of it is cut down from the long biography the site carried before, so
 * nothing here is invented. Two passages are deliberately not carried over in
 * any language: the one that opens "Press and venue names cannot measure
 * musical depth", and "under the sun" in the Barcelona closing line. The
 * digging itself stays.
 *
 * The lengths are targets, not measurements. The source does not hold 300
 * words without padding, so the long version runs short rather than saying
 * less with more. Actual counts are in the README.
 */

export type Lang = 'en' | 'es' | 'ca' | 'zh';
export type Len = '50' | '150' | '300';

export const LANGS: Lang[] = ['en', 'es', 'ca', 'zh'];
export const LENS: Len[] = ['50', '150', '300'];

/** The html lang attribute each panel takes, so the right face is used. */
export const HTML_LANG: Record<Lang, string> = {
  en: 'en',
  es: 'es',
  ca: 'ca',
  zh: 'zh-Hans',
};

export const BIOS: Record<Lang, Record<Len, string>> = {
  en: {
    '50':
      "GUMGO is a Korean DJ and vinyl curator based in Barcelona, digging the record shops of every city she plays. Trained on the janggu from age nine, she plays dub techno, electro and minimal built on bass and percussion. Featured in Mixmag Asia's Artists Exciting Us 2026; sets for HÖR Berlin and Oslated. Debut EP due 2027.",
    '150':
      "Born in Korea, GUMGO debuted in Singapore in 2024 and built her sound on dancefloors across Southeast Asia before taking it to Europe. She studied samulnori on the janggu for four years from age nine; along with her love of boom bap, it shaped her taste for heavy bass and hard-hitting percussion.\n\nIn her vinyl-focused sets, bass and percussion carry the flow through minimal, dub techno, electro and acid. Long grooves and metallic textures build a dark, hypnotic and slightly eerie atmosphere, drawing the floor toward SAMADHI, a state of deep absorption. Less a performance than a release.\n\nShe has played Headquarters and RASA in Singapore, an all-night set at Bar Temp Bangkok, Output Busan, Faust Seoul and Studio Stereo Barcelona. In 2026 she performed for HÖR Berlin, recorded for 20ft Radio, was featured in Mixmag Asia's Artists Exciting Us and contributed Oslated Special Mix 097. Now based in Barcelona, she digs the record shops of every city she plays. Her debut EP is due in 2027.",
    '300':
      "Born in Korea, GUMGO debuted in Singapore in 2024 and built her sound on dancefloors across Southeast Asia before taking it to Europe. From age nine she studied samulnori, Korean traditional percussion, on the janggu for four years. That training, along with her love of boom bap, shaped her taste for heavy bass and hard-hitting percussion.\n\nIn her vinyl-focused sets, bass and percussion carry the flow through minimal, dub techno, electro and acid. Long grooves and metallic textures build a dark, hypnotic and slightly eerie atmosphere, drawing the floor toward SAMADHI, a state of deep absorption. Less a performance than a release.\n\nShe has played at Headquarters and RASA in Singapore. Her other appearances include an all-night set at Bar Temp Bangkok and sets at Output Busan, Faust Seoul, Ganok in Lviv and Studio Stereo Barcelona. She has also hosted her own parties in Seoul and Singapore.\n\nOn radio and in mix series she has recorded for HÖR Berlin and 20ft Radio in Kyiv, for Seoul Community Radio, Aaja Music in London, Headstream in Bali, Shutter Rhythms and TOHA Radio, and contributed Oslated Special Mix 097. In 2026 she was featured in Mixmag Asia's Artists Exciting Us series.\n\nNow based in Barcelona, she digs through the city's record shops and lets new influences deepen her selection. Her debut EP is finished and set for release in 2027.",
  },

  es: {
    '50':
      'GUMGO es una DJ y seleccionadora de vinilo coreana afincada en Barcelona, que rebusca en las tiendas de discos de cada ciudad donde pincha. Formada en el janggu desde los nueve años, toca dub techno, electro y minimal construidos sobre bajo y percusión. Elegida por Mixmag Asia en Artists Exciting Us 2026; sets para HÖR Berlin y Oslated. Primer EP en 2027.',
    '150':
      'Nacida en Corea, GUMGO debutó en Singapur en 2024 y forjó su sonido en las pistas del Sudeste Asiático antes de llevarlo a Europa. A los nueve años empezó a estudiar samulnori con el janggu durante cuatro años; esa base, junto a su afición al boom bap, explica su gusto por los graves densos y la percusión con pegada.\n\nEn sus sets, centrados en el vinilo, el bajo y la percusión sostienen el recorrido entre minimal, dub techno, electro y acid. Los grooves largos y las texturas metálicas levantan una atmósfera oscura, hipnótica y algo inquietante que arrastra a la pista hacia el SAMADHI, un estado de absorción profunda. Más que una actuación, una liberación.\n\nHa pinchado en Headquarters y RASA (Singapur), un all night long en Bar Temp de Bangkok, Output (Busan), Faust (Seúl) y Studio Stereo (Barcelona). En 2026 tocó para HÖR Berlin, grabó para 20ft Radio, entró en Artists Exciting Us de Mixmag Asia y firmó el Oslated Special Mix 097. Afincada en Barcelona, rebusca en las tiendas de discos de cada ciudad donde pincha. Su primer EP llega en 2027.',
    '300':
      'Nacida en Corea, GUMGO debutó en Singapur en 2024 y forjó su sonido en las pistas del Sudeste Asiático antes de llevarlo a Europa. A los nueve años empezó a estudiar samulnori, percusión tradicional coreana, con el janggu, y siguió durante cuatro años. Esa base, junto a su afición al boom bap, explica su gusto por los graves densos y la percusión con pegada.\n\nEn sus sets, centrados en el vinilo, el bajo y la percusión sostienen el recorrido entre minimal, dub techno, electro y acid. Los grooves largos y las texturas metálicas levantan una atmósfera oscura, hipnótica y algo inquietante que arrastra a la pista hacia el SAMADHI, un estado de absorción profunda. Más que una actuación, una liberación.\n\nHa pinchado en Headquarters y RASA, en Singapur. Entre sus otras fechas están un all night long en Bar Temp de Bangkok y sesiones en Output (Busan), Faust (Seúl), Ganok (Lviv) y Studio Stereo (Barcelona). También organiza sus propias fiestas en Seúl y Singapur.\n\nEn radio y series de mixes ha grabado para HÖR Berlin y 20ft Radio (Kyiv), Seoul Community Radio, Aaja Music (Londres), Headstream (Bali), Shutter Rhythms y TOHA Radio, y firmó el Oslated Special Mix 097. En 2026 entró en la serie Artists Exciting Us de Mixmag Asia.\n\nAfincada ahora en Barcelona, rebusca en las tiendas de discos de la ciudad y deja que las nuevas influencias den más hondura a su selección. Su primer EP está terminado y previsto para 2027.',
  },

  ca: {
    '50':
      "GUMGO és una DJ i seleccionadora de vinil coreana instal·lada a Barcelona, que remena les botigues de discos de cada ciutat on punxa. Formada en el janggu des dels nou anys, toca dub techno, electro i minimal construïts sobre baix i percussió. Escollida per Mixmag Asia a Artists Exciting Us 2026; sets per a HÖR Berlin i Oslated. Primer EP el 2027.",
    '150':
      "Nascuda a Corea, GUMGO va debutar a Singapur el 2024 i va forjar el seu so a les pistes del Sud-est Asiàtic abans de portar-lo a Europa. Als nou anys va començar a estudiar samulnori amb el janggu durant quatre anys; aquesta base, juntament amb la seva afició al boom bap, explica el seu gust pels greus densos i la percussió contundent.\n\nEn els seus sets, centrats en el vinil, el baix i la percussió sostenen el recorregut entre minimal, dub techno, electro i acid. Els grooves llargs i les textures metàl·liques aixequen una atmosfera fosca, hipnòtica i una mica inquietant que arrossega la pista cap al SAMADHI, un estat d'absorció profunda. Més que una actuació, un alliberament.\n\nHa punxat a Headquarters i RASA (Singapur), un all night long al Bar Temp de Bangkok, Output (Busan), Faust (Seül) i Studio Stereo (Barcelona). El 2026 va tocar per a HÖR Berlin, va gravar per a 20ft Radio, va entrar a Artists Exciting Us de Mixmag Asia i va signar l'Oslated Special Mix 097. Instal·lada a Barcelona, remena les botigues de discos de cada ciutat on punxa. El seu primer EP arriba el 2027.",
    '300':
      "Nascuda a Corea, GUMGO va debutar a Singapur el 2024 i va forjar el seu so a les pistes del Sud-est Asiàtic abans de portar-lo a Europa. Als nou anys va començar a estudiar samulnori, percussió tradicional coreana, amb el janggu, i hi va seguir quatre anys. Aquesta base, juntament amb la seva afició al boom bap, explica el seu gust pels greus densos i la percussió contundent.\n\nEn els seus sets, centrats en el vinil, el baix i la percussió sostenen el recorregut entre minimal, dub techno, electro i acid. Els grooves llargs i les textures metàl·liques aixequen una atmosfera fosca, hipnòtica i una mica inquietant que arrossega la pista cap al SAMADHI, un estat d'absorció profunda. Més que una actuació, un alliberament.\n\nHa punxat a Headquarters i RASA, a Singapur. Entre les seves altres dates hi ha un all night long al Bar Temp de Bangkok i sessions a Output (Busan), Faust (Seül), Ganok (Lviv) i Studio Stereo (Barcelona). També organitza les seves pròpies festes a Seül i Singapur.\n\nA la ràdio i en sèries de mixos ha gravat per a HÖR Berlin i 20ft Radio (Kíiv), Seoul Community Radio, Aaja Music (Londres), Headstream (Bali), Shutter Rhythms i TOHA Radio, i va signar l'Oslated Special Mix 097. El 2026 va entrar a la sèrie Artists Exciting Us de Mixmag Asia.\n\nInstal·lada ara a Barcelona, remena les botigues de discos de la ciutat i deixa que les noves influències donin més fondària a la seva selecció. El seu primer EP està acabat i previst per al 2027.",
  },

  zh: {
    '50':
      'GUMGO 是一位旅居巴塞罗那的韩国 DJ 与黑胶选曲人，在每一座演出的城市里淘唱片。九岁起学习长鼓，她的 dub techno、electro 与 minimal 建立在低频与打击乐之上。入选 Mixmag Asia 的 Artists Exciting Us 2026，并为 HÖR Berlin 与 Oslated 录制 DJ set。首张 EP 将于 2027 年发行。',
    '150':
      '出生于韩国的 GUMGO 于 2024 年在新加坡首次登台，在东南亚的舞池中打磨自己的声音，随后走向欧洲。九岁起学习长鼓，持续四年；这段训练与她对 Boom Bap 的喜爱，让她偏爱厚重低频与有力的打击乐。\n\n在以黑胶为核心的 DJ set 中，低频与打击乐带动音乐在 Minimal、Dub Techno、Electro 与 Acid 之间流动。绵长的律动与金属质感的音色营造出幽暗、催眠般又略带诡异的氛围，将舞池带向 SAMADHI，一种深度沉浸的状态。与其说是一场表演，不如说是一次释放。\n\n她曾在新加坡的 Headquarters 和 RASA 演出，也包括曼谷 Bar Temp 的整晚 DJ set，以及釜山 Output、首尔 Faust 和巴塞罗那 Studio Stereo。2026 年，她在 HÖR Berlin 演出，为 20ft Radio 录制 DJ set，入选 Mixmag Asia 的 Artists Exciting Us，并为 Oslated 录制 Special Mix 097。如今以巴塞罗那为据点，她在每一座演出的城市里淘唱片。首张 EP 将于 2027 年发行。',
    '300':
      '出生于韩国的 GUMGO 于 2024 年在新加坡首次登台。她在东南亚的舞池中打磨自己的声音，随后走向欧洲。九岁起，她学习四物农乐中的长鼓，持续四年。这段韩国传统打击乐的训练和她对 Boom Bap 的喜爱，让她偏爱厚重低频与有力的打击乐。\n\n在以黑胶为核心的 DJ set 中，低频与打击乐带动音乐在 Minimal、Dub Techno、Electro 与 Acid 之间流动。绵长的律动与金属质感的音色营造出幽暗、催眠般又略带诡异的氛围，将舞池带向 SAMADHI，一种深度沉浸的状态。与其说是一场表演，不如说是一次释放。\n\n她曾在新加坡的 Headquarters 和 RASA 演出。其他演出包括曼谷 Bar Temp 的整晚 DJ set，以及釜山 Output、首尔 Faust、利沃夫 Ganok 和巴塞罗那 Studio Stereo 的演出。她也曾在首尔和新加坡主办自己的派对。\n\n在电台与混音系列方面，她为 HÖR Berlin、基辅 20ft Radio、Seoul Community Radio、伦敦 Aaja Music、巴厘岛 Headstream、Shutter Rhythms 与 TOHA Radio 录制过 DJ set，并为 Oslated 录制 Special Mix 097。2026 年，她入选 Mixmag Asia 的 Artists Exciting Us 系列。\n\n如今她以巴塞罗那为据点，在这座城市的唱片店里继续寻觅，为自己的选曲增添更多层次。她的首张 EP 已经完成，定于 2027 年发行。',
  },
};
