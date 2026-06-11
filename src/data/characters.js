/**
 * 角色情绪系统
 * 每个领域对应一个 AI 小伙伴
 * 闽南语彩蛋：答对随机冒出一句闽南话
 */

const characters = {
  number_sense: {
    id: 'bunny',
    name: '跳跳',
    emoji: '🐰',
    title: '小兔子',
    color: '#FFB5C2',
    bgGradient: 'linear-gradient(135deg, #FFF0F5, #FFE4E9)',
    personality: '温柔鼓励型',
    minnanPhrases: {
      correct: ['水啦！(súi--lah)', '贺！(hō)'],
      idle: ['来，咱来算数学～(lâi, lán lâi sǹg sòo-ha̍k)']
    },
    lines: {
      greet: '嗨～我是小兔子跳跳！跟我一起数数吧！',
      teach: '来，我们一起试试看！',
      correct: ['哇！你太厉害了！🎉', '答对啦，好棒！✨', '你真聪明！⭐', '跳跳好开心！'],
      wrong: ['没关系，再想想～💪', '差一点点哦，再试试！', '别着急，我陪你一起想～'],
      thinking: ['嗯…让我想想…🤔', '你来试试看？'],
      complete: [
        '太棒啦！你全部完成了！🎉🎉🎉',
        '你好厉害，我们一起做到了！🌟',
      ],
      idle: '跳跳在这里陪你哦～',
    },
  },

  patterns: {
    id: 'fox',
    name: '聪聪',
    emoji: '🦊',
    title: '小狐狸',
    color: '#FF8A65',
    bgGradient: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
    personality: '聪明思考型',
    minnanPhrases: {
      correct: ['贺！汝足厉害！(hō! lí tsiok lī-hāi)', '真正𠢕！(tsin-tsiànn gâu)'],
      idle: ['是按呢吗？(sī án-ne--mah)']
    },
    lines: {
      greet: '我是聪聪，最喜欢找规律啦！',
      teach: '仔细观察，你一定能发现规律！',
      correct: ['我发现了规律！你也是吗？🌟', '果然是这样！你真聪明！', '和我想的一样！'],
      wrong: ['嗯…换个角度想想？', '再观察一下细节？', '没关系，规律就在那里～'],
      thinking: ['嗯…让我看看…🤔', '这个规律是什么呢…'],
      complete: ['你越来越聪明啦！🎉', '规律大师就是你！'],
      idle: '聪聪在思考…',
    },
  },

  addition: {
    id: 'bear',
    name: '嘟嘟',
    emoji: '🐻',
    title: '小熊',
    color: '#A1887F',
    bgGradient: 'linear-gradient(135deg, #EFEBE9, #D7CCC8)',
    personality: '憨厚温暖型',
    minnanPhrases: {
      correct: ['好啊！(hó--ah)', '水啦，答对咯！(súi--lah)'],
      idle: ['咱来学数学～(lán lâi o̍h sòo-ha̍k)']
    },
    lines: {
      greet: '嘿嘿，我是小熊嘟嘟！我们来加加看！',
      teach: '把东西合在一起就是加法哦～',
      correct: ['嘿嘿，答对啦！🍯', '嘟嘟给你一朵小红花🌺', '好厉害！我们一起吃蜂蜜！'],
      wrong: ['唔…再试一次吧～', '嘟嘟陪你再想想～', '别灰心，我们一起做！'],
      thinking: ['唔…嘟嘟在努力想…🤔', '慢慢来哦～'],
      complete: ['太棒啦！嘟嘟好开心！🎉', '我们做到了！去喝蜂蜜吧！🍯'],
      idle: '嘟嘟在等你哦～',
    },
  },

  subtraction: {
    id: 'squirrel',
    name: '果果',
    emoji: '🐿️',
    title: '小松鼠',
    color: '#8D6E63',
    bgGradient: 'linear-gradient(135deg, #FFF8E1, #FFECB3)',
    personality: '活泼机灵型',
    minnanPhrases: {
      correct: ['贺！终于会晓啊！(hō! tsiong-î ē-hiáu--ah)', '无简单喔！(bô kán-tān--ooh)'],
      idle: ['继续加油！(kè-sio̍k ka-iû)']
    },
    lines: {
      greet: '耶！我是小松鼠果果！跟我学减法吧！',
      teach: '拿走一些，看看还剩多少～',
      correct: ['耶！你又答对了！🎉', '果果给你鼓掌！👏', '太机灵啦！'],
      wrong: ['啊哦，差一点点～💪', '再数一遍看看？', '果果陪你再试一次！'],
      thinking: ['果果在想…🤔', '仔细看看还剩几个？'],
      complete: ['哇，你太棒啦！果果好开心！🎉', '全部完成！去采松果吧！🌰'],
      idle: '果果在树上看着你～',
    },
  },

  geometry: {
    id: 'bird',
    name: '飞飞',
    emoji: '🐦',
    title: '小鸟',
    color: '#81D4FA',
    bgGradient: 'linear-gradient(135deg, #E1F5FE, #B3E5FC)',
    personality: '轻快自由型',
    minnanPhrases: {
      correct: ['水水水！(súi-súi-súi)', '拢总对咯！(lóng-tsóng tio̍h--looh)'],
      idle: ['飞飞陪你飞～(pe--pe puê lí pe)']
    },
    lines: {
      greet: '我是小鸟飞飞！一起认识形状吧！',
      teach: '看看这些图形，它们都有名字哦～',
      correct: ['飞起来啦！答对了！🌈', '好棒！形状大师！', '飞飞带你飞一圈！'],
      wrong: ['哎呀，掉下去了，再来一次！', '仔细看看它是什么形状？', '飞飞陪你一起看～'],
      thinking: ['飞飞在空中转圈…🤔', '这是什么形状呢？'],
      complete: ['飞飞好开心！你太厉害了！🎉', '我们一起飞向下一关！'],
      idle: '飞飞在天上看着你～',
    },
  },

  multiplication: {
    id: 'cat',
    name: '咪咪',
    emoji: '🐱',
    title: '小猫咪',
    color: '#CE93D8',
    bgGradient: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
    personality: '傲娇可爱型',
    minnanPhrases: {
      correct: ['真正𠢕喔！(tsin-tsiànn gâu--ooh)', '贺，及格啊！(hō, ki̍p-keh--ah)'],
      idle: ['是咧想啥？(sī teh siūnn siánn)']
    },
    lines: {
      greet: '喵～我是咪咪。来学乘法吧！',
      teach: '乘法就是一组一组地数，很方便哦～',
      correct: ['哼，这题太简单了！😼', '喵～还不错嘛！', '咪咪认可你了！'],
      wrong: ['喵…再想想嘛～', '咪咪都看出来了哦！', '认真一点啦～'],
      thinking: ['喵？让咪咪看看…🤔', '一组一组数就对了～'],
      complete: ['不错不错！咪咪很满意！🎉', '你通过咪咪的考验啦！'],
      idle: '咪咪在舔爪子…你继续～',
    },
  },

  advanced: {
    id: 'owl',
    name: '小智',
    emoji: '🦉',
    title: '猫头鹰',
    color: '#7E57C2',
    bgGradient: 'linear-gradient(135deg, #EDE7F6, #D1C4E9)',
    personality: '智慧沉稳型',
    minnanPhrases: {
      correct: ['有影𠢕！(ū-iánn gâu)', '按呢做著哦！(án-ne tsò tio̍h--oh)'],
      idle: ['继续加油！(kè-sio̍k ka-iû)']
    },
    lines: {
      greet: '你好，我是小智。准备好了吗？',
      teach: '让我们来认识一些新知识。',
      correct: ['做得很好。🌟', '观察很仔细。', '你已经学会了很多。'],
      wrong: ['再观察仔细一点。', '换个角度试试。', '知识就在那里。'],
      thinking: ['我在思考…🤔', '答案就在眼前。'],
      complete: ['你又进步了。🎉', '智慧又增加了一分。'],
      idle: '小智在等你提出下一个问题。',
    },
  },

  // ===== 隐藏彩蛋角色：风狮爷（闽南限定）=====
  minnan_secret: {
    id: 'lion',
    name: '风狮爷',
    emoji: '🦁',
    title: '闽南守护神',
    color: '#D4380D',
    bgGradient: 'linear-gradient(135deg, #FFF1E6, #FFD6B3)',
    personality: '豪气爽朗型',
    lines: {
      greet: '汝好！我是风狮爷，咱来做伙学数学啦！(Lí hó! Guá sī Hong-sai-iâ, lán tsò-hué o̍h sòo-ha̍k--lah)',
      teach: '慢慢来，毋免惊，风狮爷佇遮保庇汝！(Bān-bān lâi, m̄-bián kiann, Hong-sai-iâ tī-tsia pó-pì lí)',
      correct: [
        '水啦！(Súi--lah) 🦁',
        '贺！汝足厉害！(Hō! Lí tsiok lī-hāi)',
        '好啊！真正𠢕！(Hó--ah! Tsin-tsiànn gâu)',
        '无简单，汝成功啊！(Bô kán-tān, lí sîng-kong--ah)',
      ],
      wrong: [
        '无要紧，再来一摆！(Bô iàu-kín, koh lâi tsi̍t-pái) 💪',
        '差点仔，再想看觅！(Tsha-tiám-á, koh siūnn khuànn bāi)',
        '莫急莫急，我陪你做！(Bo̍h-kip bo̍h-kip, guá puê lí tsò)',
      ],
      thinking: [
        '风狮爷咧想…(Hong-sai-iâ teh siūnn…) 🤔',
        '汝来试看觅？(Lí lâi tshì khuànn bāi?)',
      ],
      complete: [
        '贺咯！全部做完啊！汝真正𠢕！(Hō--looh! Tsuân-pōo tsò-uân--ah! Lí tsin-tsiànn gâu) 🎉',
        '水水水！汝成功啊！风狮爷真欢喜！(Súi-súi-súi! Lí sîng-kong--ah! Hong-sai-iâ tsin huann-hí)',
      ],
      idle: '风狮爷佇遮保庇汝，尽管做！(Hong-sai-iâ tī-tsia pó-pì lí, tsīn-kuán tsò) 🦁',
    },
  },
}

// 根据领域 ID 获取角色
export function getCharacter(areaId) {
  return characters[areaId] || characters.number_sense
}

// 获取角色的某一句台词（一定概率混入闽南语口头禅）
export function pickLine(areaId, mood, { useMinnan = false } = {}) {
  const chara = characters[areaId] || characters.number_sense

  // 如果要求闽南语角色（风狮爷），直接用他的台词
  if (useMinnan && characters.minnan_secret) {
    const mnLines = characters.minnan_secret.lines[mood]
    if (mnLines) {
      if (typeof mnLines === 'string') return mnLines
      return mnLines[Math.floor(Math.random() * mnLines.length)]
    }
  }

  // 普通角色也有一定概率混入闽南语口头禅（25%）
  if (mood === 'correct' || mood === 'idle') {
    const mn = chara.minnanPhrases
    if (mn && mn[mood] && Math.random() < 0.25) {
      const pool = mn[mood]
      return pool[Math.floor(Math.random() * pool.length)]
    }
  }

  const lines = chara.lines[mood]
  if (!lines) return ''
  if (typeof lines === 'string') return lines
  return lines[Math.floor(Math.random() * lines.length)]
}

export default characters
