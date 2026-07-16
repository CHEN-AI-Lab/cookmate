export interface DemoRecipe {
  id: string
  title: string
  description: string | null
  ingredients: string
  steps: string
  cookingTime: number | null
  calories: number | null
  cuisineType: string | null
  difficulty: string | null
  starred: boolean
  createdAt: string
}

export function getDemoRecipes(locale = "zh-CN"): DemoRecipe[] {
  const now = new Date()
  const isZh = locale === "zh-CN"

  return [
    // ── 中餐 ──────────────────────────────────────────────
    {
      id: "demo-rec-1",
      title: isZh ? "宫保鸡丁" : "Kung Pao Chicken",
      description: isZh
        ? "经典川菜，鸡丁嫩滑、花生酥脆、麻辣鲜香。"
        : "A classic Sichuan stir-fry — tender chicken, crunchy peanuts, and bold heat from chilies and Sichuan peppercorns.",
      ingredients: isZh
        ? "鸡胸肉、花生米、干辣椒、花椒、葱、姜、蒜、酱油、醋、糖、淀粉"
        : "Chicken breast, peanuts, dried chilies, Sichuan peppercorns, scallion, ginger, garlic, soy sauce, vinegar, sugar, cornstarch",
      steps: isZh
        ? "鸡胸肉切丁，加料酒、淀粉腌制15分钟。\n调汁：酱油、醋、糖、淀粉、水调匀。\n花生米小火炒至金黄备用。\n热锅凉油，爆香干辣椒和花椒。\n下鸡丁翻炒至变色。\n加入葱姜蒜爆香。\n倒入调好的汁翻炒均匀。\n最后加入花生米翻炒出锅。"
        : "Dice chicken breast; marinate with wine and cornstarch 15 min.\nMix sauce: soy sauce, vinegar, sugar, cornstarch, and water.\nFry peanuts low heat until golden; set aside.\nHeat oil; stir-fry dried chilies and Sichuan peppercorns until fragrant.\nAdd chicken; stir-fry until opaque.\nAdd scallion, ginger, garlic; stir-fry until aromatic.\nPour in sauce; toss to coat.\nFold in peanuts; serve.",
      cookingTime: 25,
      calories: 480,
      cuisineType: "中餐",
      difficulty: "medium",
      starred: true,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-2",
      title: isZh ? "红烧排骨" : "Braised Pork Ribs",
      description: isZh
        ? "色泽红亮、肉质酥烂的经典红烧菜。"
        : "Glossy, fall-off-the-bone pork ribs braised in a rich soy-caramel sauce.",
      ingredients: isZh
        ? "排骨、酱油、老抽、冰糖、八角、桂皮、姜、葱、料酒"
        : "Pork ribs, soy sauce, dark soy sauce, rock sugar, star anise, cinnamon stick, ginger, scallion, cooking wine",
      steps: isZh
        ? "排骨冷水下锅焯水去血沫。\n锅中放少许油，炒冰糖至琥珀色。\n下排骨翻炒上色。\n加酱油、老抽、料酒翻炒。\n加没过排骨的热水，放入八角桂皮姜片。\n大火烧开转小火炖40分钟。\n大火收汁，撒葱花出锅。"
        : "Blanch ribs in cold water; drain.\nHeat oil; caramelise rock sugar until amber.\nAdd ribs; toss to coat in caramel.\nAdd soy sauce, dark soy, wine; stir.\nCover with hot water; add star anise, cinnamon, ginger.\nBoil then simmer 40 min.\nReduce sauce on high heat; garnish with scallion.",
      cookingTime: 55,
      calories: 550,
      cuisineType: "中餐",
      difficulty: "medium",
      starred: true,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-3",
      title: isZh ? "番茄炒蛋" : "Scrambled Eggs with Tomatoes",
      description: isZh
        ? "国民家常菜，酸甜可口的番茄配上嫩滑的鸡蛋。"
        : "China's ultimate comfort food — juicy tomatoes and silky scrambled eggs in a sweet-tangy sauce.",
      ingredients: isZh
        ? "番茄、鸡蛋、葱、盐、糖、食用油"
        : "Tomatoes, eggs, scallion, salt, sugar, cooking oil",
      steps: isZh
        ? "鸡蛋打散加少许盐。\n番茄切块。\n热油炒鸡蛋至定型盛出。\n同一锅炒番茄出汁。\n加少许糖提鲜。\n倒回鸡蛋翻炒均匀。\n撒上葱花出锅。"
        : "Beat eggs with a pinch of salt.\nCut tomatoes into wedges.\nScramble eggs in hot oil; remove.\nIn the same pan, cook tomatoes until juicy.\nAdd a pinch of sugar.\nReturn eggs; toss together.\nSprinkle scallion; serve.",
      cookingTime: 20,
      calories: 420,
      cuisineType: "中餐",
      difficulty: "easy",
      starred: true,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-4",
      title: isZh ? "麻婆豆腐" : "Mapo Tofu",
      description: isZh
        ? "麻辣鲜香的经典川菜，豆腐嫩滑入味。"
        : "Silky tofu in a fiery Sichuan chili-bean sauce — numbing, spicy, and deeply savoury.",
      ingredients: isZh
        ? "嫩豆腐、猪肉末、豆瓣酱、花椒粉、辣椒粉、葱、姜、蒜、淀粉"
        : "Silken tofu, minced pork, doubanjiang (chili bean paste), Sichuan pepper powder, chili powder, scallion, ginger, garlic, cornstarch",
      steps: isZh
        ? "豆腐切块，热水烫一下。\n热锅放油，下肉末炒散。\n加豆瓣酱炒出红油。\n加姜蒜末爆香。\n加适量水烧开。\n放入豆腐轻轻推动。\n加花椒粉、辣椒粉调味。\n水淀粉勾芡，撒葱花出锅。"
        : "Cut tofu into cubes; blanch in hot water.\nHeat oil; stir-fry pork mince until crumbled.\nAdd doubanjiang; fry until oil turns red.\nAdd ginger and garlic; stir-fry.\nPour in water; bring to a boil.\nSlide in tofu; gently push.\nSeason with Sichuan pepper and chili powder.\nThicken with cornstarch slurry; garnish with scallion.",
      cookingTime: 18,
      calories: 380,
      cuisineType: "中餐",
      difficulty: "easy",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-5",
      title: isZh ? "可乐鸡翅" : "Cola Chicken Wings",
      description: isZh
        ? "甜香软嫩的经典家常菜，可乐的焦糖味让鸡翅格外美味。"
        : "Sticky-sweet chicken wings glazed with cola — a playful yet delicious home-style classic.",
      ingredients: isZh
        ? "鸡翅、可乐、酱油、姜、料酒"
        : "Chicken wings, cola, soy sauce, ginger, cooking wine",
      steps: isZh
        ? "鸡翅洗净划两刀。\n冷水下锅焯水去血沫。\n锅中放少许油，下鸡翅煎至两面金黄。\n倒入可乐没过鸡翅。\n加酱油、姜片、料酒。\n大火烧开转中小火炖15分钟。\n开大火收汁至浓稠裹在鸡翅上。"
        : "Score chicken wings; blanch in cold water; drain.\nPan-fry wings in oil until golden on both sides.\nPour in cola to cover wings.\nAdd soy sauce, ginger slices, wine.\nBoil then simmer 15 min.\nReduce sauce on high heat until sticky and glazed.",
      cookingTime: 30,
      calories: 420,
      cuisineType: "中餐",
      difficulty: "easy",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-6",
      title: isZh ? "鱼香肉丝" : "Yu Xiang Shredded Pork",
      description: isZh
        ? "川菜经典，酸甜微辣，肉丝嫩滑，下饭神器。"
        : "Sichuan's famous 'fish-fragrant' shredded pork — tangy, spicy, and savoury all at once.",
      ingredients: isZh
        ? "猪里脊、木耳、胡萝卜、青椒、葱姜蒜、豆瓣酱、醋、糖、酱油、淀粉"
        : "Pork tenderloin, wood ear mushrooms, carrot, green pepper, scallion-ginger-garlic, doubanjiang, vinegar, sugar, soy sauce, cornstarch",
      steps: isZh
        ? "里脊肉切丝，加料酒、淀粉腌制。\n木耳泡发切丝，胡萝卜切丝，青椒切丝。\n调鱼香汁：醋、糖、酱油、淀粉、水调匀。\n热锅凉油，下肉丝滑熟盛出。\n锅中留底油，下豆瓣酱炒出红油。\n加葱姜蒜爆香。\n下木耳丝、胡萝卜丝、青椒丝翻炒。\n倒入肉丝和鱼香汁翻炒均匀。"
        : "Julienne pork; marinate with wine and cornstarch.\nJulienne soaked wood ear, carrot, and green pepper.\nMix 'fish-fragrant' sauce: vinegar, sugar, soy sauce, cornstarch, water.\nStir-fry pork until cooked; set aside.\nFry doubanjiang in reserved oil until red.\nAdd scallion, ginger, garlic.\nStir-fry wood ear, carrot, pepper.\nReturn pork; pour in sauce; toss to coat.",
      cookingTime: 22,
      calories: 450,
      cuisineType: "中餐",
      difficulty: "medium",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-7",
      title: isZh ? "糖醋里脊" : "Sweet and Sour Pork",
      description: isZh
        ? "外酥里嫩的经典糖醋菜，酸甜开胃。"
        : "Crispy on the outside, tender within — the beloved sweet-and-sour pork in a tangy scarlet glaze.",
      ingredients: isZh
        ? "猪里脊、鸡蛋、面粉、淀粉、番茄酱、醋、糖、盐"
        : "Pork tenderloin, egg, flour, cornstarch, ketchup, vinegar, sugar, salt",
      steps: isZh
        ? "里脊切条，加盐、料酒腌制。\n鸡蛋、面粉、淀粉调成糊。\n里脊裹糊，六成热油炸至金黄。\n捞出复炸一次使外皮更酥脆。\n锅留底油，加番茄酱、糖、醋炒匀。\n倒入炸好的里脊翻炒均匀。"
        : "Cut pork into strips; marinate with salt and wine.\nMix batter: egg, flour, cornstarch.\nCoat strips; deep-fry at 170°C until golden.\nDouble-fry for extra crunch.\nHeat oil; stir ketchup, sugar, vinegar into a sauce.\nToss fried pork in sauce; serve.",
      cookingTime: 30,
      calories: 500,
      cuisineType: "中餐",
      difficulty: "medium",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-8",
      title: isZh ? "回锅肉" : "Twice-Cooked Pork",
      description: isZh
        ? "四川名菜，五花肉焦香软糯，配蒜苗一起炒香辣过瘾。"
        : "Sichuan's signature pork belly — boiled, sliced, then wok-fried with leeks and chili bean paste until caramelised.",
      ingredients: isZh
        ? "五花肉、蒜苗、豆瓣酱、豆豉、姜、蒜、料酒、糖"
        : "Pork belly, garlic sprouts, doubanjiang, fermented black beans, ginger, garlic, cooking wine, sugar",
      steps: isZh
        ? "五花肉整块冷水下锅，加姜片料酒煮20分钟。\n捞出放凉切薄片。\n蒜苗斜切成段。\n锅不放油，直接将肉片下锅煎至微卷出油。\n加入豆瓣酱、豆豉、蒜片翻炒。\n加少许糖调味。\n最后加入蒜苗段翻炒至断生。"
        : "Boil whole pork belly with ginger and wine 20 min.\nCool and slice thinly.\nCut garlic sprouts diagonally.\nDry-fry slices in a wok until curled and golden.\nAdd doubanjiang, black beans, garlic slices; stir-fry.\nSeason with sugar.\nToss in garlic sprouts until just wilted.",
      cookingTime: 35,
      calories: 520,
      cuisineType: "中餐",
      difficulty: "medium",
      starred: false,
      createdAt: now.toISOString(),
    },

    // ── 西餐 ──────────────────────────────────────────────
    {
      id: "demo-rec-9",
      title: isZh ? "凯撒沙拉" : "Caesar Salad",
      description: isZh
        ? "经典美式沙拉，脆爽罗马生菜裹上浓郁凯撒酱，配帕玛森芝士和面包丁。"
        : "Crisp romaine lettuce tossed in creamy Caesar dressing, finished with Parmesan and crunchy croutons.",
      ingredients: isZh
        ? "罗马生菜、帕玛森芝士、面包丁、凯撒酱、柠檬、橄榄油、黑胡椒"
        : "Romaine lettuce, Parmesan cheese, croutons, Caesar dressing, lemon, olive oil, black pepper",
      steps: isZh
        ? "罗马生菜洗净撕成大块，甩干水分。\n面包切丁，烤箱180°C烤至金黄。\n碗中调凯撒酱：蛋黄酱、蒜泥、柠檬汁、橄榄油、帕玛森、黑胡椒。\n生菜放入大碗，倒入酱汁拌匀。\n撒上面包丁和帕玛森刨片。"
        : "Wash and tear romaine; spin dry.\nCube bread; bake at 180°C until golden.\nMix dressing: mayo, garlic purée, lemon juice, olive oil, Parmesan, black pepper.\nToss lettuce with dressing.\nTop with croutons and shaved Parmesan.",
      cookingTime: 15,
      calories: 320,
      cuisineType: "西餐",
      difficulty: "easy",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-10",
      title: isZh ? "奶油蘑菇汤" : "Cream of Mushroom Soup",
      description: isZh
        ? "浓郁丝滑的法式经典汤品，蘑菇的鲜香与奶油的醇厚完美融合。"
        : "A silky French classic — earthy mushrooms and rich cream blended into a velvety, comforting soup.",
      ingredients: isZh
        ? "白蘑菇、洋葱、黄油、面粉、鲜奶油、鸡汤、盐、黑胡椒、百里香"
        : "White mushrooms, onion, butter, flour, heavy cream, chicken stock, salt, black pepper, thyme",
      steps: isZh
        ? "蘑菇切片，洋葱切碎。\n黄油融化，炒洋葱至透明。\n加入蘑菇炒至出水变软。\n撒入面粉炒匀。\n倒入鸡汤搅匀，小火煮15分钟。\n用搅拌机打成细腻浓汤。\n倒回锅中，加入鲜奶油搅匀。\n盐和黑胡椒调味，点缀百里香。"
        : "Slice mushrooms; dice onion.\nMelt butter; sauté onion until translucent.\nAdd mushrooms; cook until softened.\nSprinkle flour; stir well.\nPour in stock; stir and simmer 15 min.\nBlend until smooth.\nReturn to pot; stir in cream.\nSeason with salt and pepper; garnish with thyme.",
      cookingTime: 30,
      calories: 280,
      cuisineType: "西餐",
      difficulty: "easy",
      starred: false,
      createdAt: now.toISOString(),
    },

    // ── 日料 ──────────────────────────────────────────────
    {
      id: "demo-rec-11",
      title: isZh ? "味噌汤" : "Miso Soup",
      description: isZh
        ? "日式餐桌必备汤品，味噌的酱香与豆腐海带的鲜美交融。"
        : "Japan's daily staple — a delicate broth where miso, tofu, and seaweed come together in perfect harmony.",
      ingredients: isZh
        ? "味噌、豆腐、海带（或裙带菜）、葱、柴鱼高汤"
        : "White miso paste, silken tofu, wakame seaweed, scallion, dashi stock",
      steps: isZh
        ? "锅中倒入柴鱼高汤烧开。\n豆腐切小丁放入锅中。\n海带泡发后切小段放入。\n关火，将味噌放入汤勺中在汤里化开。\n撒上葱花，立即上桌。"
        : "Bring dashi to a gentle boil.\nDice tofu; add to the broth.\nRehydrate wakame; add to the pot.\nRemove from heat; dissolve miso paste in a ladle of broth.\nGarnish with scallion; serve immediately.",
      cookingTime: 10,
      calories: 120,
      cuisineType: "日料",
      difficulty: "easy",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-12",
      title: isZh ? "日式咖喱饭" : "Japanese Curry Rice",
      description: isZh
        ? "浓稠微甜的日式咖喱，搭配土豆胡萝卜和嫩牛肉，暖心暖胃。"
        : "A thick, mildly sweet Japanese curry loaded with potatoes, carrots, and tender beef — ultimate comfort.",
      ingredients: isZh
        ? "牛肉块、土豆、胡萝卜、洋葱、咖喱块、酱油、米饭"
        : "Beef chunks, potatoes, carrots, onion, Japanese curry roux, soy sauce, steamed rice",
      steps: isZh
        ? "牛肉切块焯水去血沫。\n土豆去皮切块，胡萝卜滚刀切，洋葱切大块。\n锅放油，炒洋葱至焦糖色。\n加入牛肉翻炒。\n加水和酱油，大火烧开转小火炖30分钟。\n加入土豆和胡萝卜再炖15分钟。\n关火加入咖喱块搅拌至融化。\n小火再煮5分钟至浓稠，配米饭食用。"
        : "Cube beef; blanch and drain.\nPeel and cube potatoes; cut carrots into chunks; wedge onion.\nSauté onion in oil until caramelised.\nAdd beef; brown.\nAdd water and soy sauce; boil then simmer 30 min.\nAdd potatoes and carrots; simmer 15 more min.\nTurn off heat; stir in curry roux until dissolved.\nSimmer 5 min until thickened; serve over rice.",
      cookingTime: 55,
      calories: 650,
      cuisineType: "日料",
      difficulty: "medium",
      starred: false,
      createdAt: now.toISOString(),
    },

    // ── 韩餐 ──────────────────────────────────────────────
    {
      id: "demo-rec-13",
      title: isZh ? "韩式拌饭" : "Bibimbap",
      description: isZh
        ? "韩国经典碗饭，五彩时蔬与辣酱拌入米饭，每一口都是惊喜。"
        : "Korea's iconic rice bowl — colourful veggies, gochujang sauce, and a runny yolk mixed into every bite.",
      ingredients: isZh
        ? "米饭、牛肉碎、菠菜、豆芽、胡萝卜、西葫芦、鸡蛋、韩式辣酱、芝麻油"
        : "Steamed rice, minced beef, spinach, bean sprouts, carrot, zucchini, egg, gochujang (Korean chili paste), sesame oil",
      steps: isZh
        ? "牛肉碎加酱油、糖、芝麻油腌制后炒熟。\n菠菜焯水，拌入芝麻油和盐。\n豆芽焯水沥干。\n胡萝卜和西葫芦切丝分别炒软。\n碗中盛米饭，将各色蔬菜和牛肉码在饭上。\n煎一个太阳蛋放在中间。\n淋上韩式辣酱和芝麻油，拌匀食用。"
        : "Marinate beef with soy sauce, sugar, sesame oil; stir-fry.\nBlanch spinach; season with sesame oil and salt.\nBlanch bean sprouts; drain.\nJulienne carrot and zucchini; sauté separately.\nScoop rice into a bowl; arrange veggies and beef on top.\nTop with a sunny-side-up egg.\nDrizzle gochujang and sesame oil; mix well before eating.",
      cookingTime: 35,
      calories: 580,
      cuisineType: "韩餐",
      difficulty: "medium",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-14",
      title: isZh ? "韩式泡菜炒饭" : "Kimchi Fried Rice",
      description: isZh
        ? "用酸辣泡菜和隔夜米饭快速翻炒，简单却让人上瘾的韩式料理。"
        : "A quick, addictive Korean staple — tangy kimchi and day-old rice wok-fried into spicy, savoury perfection.",
      ingredients: isZh
        ? "隔夜米饭、韩式泡菜、五花肉、韩式辣酱、葱、芝麻油、鸡蛋"
        : "Day-old rice, kimchi, pork belly, gochujang, scallion, sesame oil, egg",
      steps: isZh
        ? "泡菜切碎，五花肉切薄片。\n锅不放油，煎五花肉至出油微焦。\n加入泡菜翻炒出香味。\n加入韩式辣酱炒匀。\n倒入米饭大火翻炒均匀。\n淋芝麻油，撒葱花。\n另煎一个荷包蛋放在炒饭上。"
        : "Chop kimchi; slice pork belly thinly.\nDry-fry pork in a pan until golden and rendered.\nAdd kimchi; stir-fry until fragrant.\nAdd gochujang; mix well.\nToss in rice; stir-fry on high heat.\nDrizzle sesame oil; sprinkle scallion.\nTop with a fried egg; serve.",
      cookingTime: 15,
      calories: 520,
      cuisineType: "韩餐",
      difficulty: "easy",
      starred: false,
      createdAt: now.toISOString(),
    },

    // ── 东南亚 ────────────────────────────────────────────
    {
      id: "demo-rec-15",
      title: isZh ? "泰式绿咖喱鸡" : "Thai Green Curry",
      description: isZh
        ? "椰香浓郁、辣中带甜的泰式经典，嫩鸡肉与蔬菜浸在翠绿咖喱酱汁中。"
        : "A fragrant Thai classic — tender chicken and vegetables bathed in a creamy, spicy coconut-green curry sauce.",
      ingredients: isZh
        ? "鸡腿肉、绿咖喱酱、椰奶、青椒、茄子、泰国罗勒、鱼露、椰糖"
        : "Chicken thighs, green curry paste, coconut milk, green peppers, Thai eggplant, Thai basil, fish sauce, palm sugar",
      steps: isZh
        ? "鸡腿肉去骨切块。\n锅放少许椰奶，大火炒绿咖喱酱出香。\n加入鸡肉炒至变色。\n倒入剩余椰奶，加鱼露和椰糖调味。\n加入切好的青椒和茄子煮5分钟。\n撒上泰国罗勒叶，配米饭食用。"
        : "Debone and cube chicken thighs.\nFry green curry paste in a splash of coconut milk until fragrant.\nAdd chicken; stir-fry until opaque.\nPour in remaining coconut milk; season with fish sauce and palm sugar.\nAdd sliced peppers and eggplant; simmer 5 min.\nGarnish with Thai basil; serve with rice.",
      cookingTime: 30,
      calories: 480,
      cuisineType: "东南亚",
      difficulty: "medium",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-16",
      title: isZh ? "越南河粉" : "Vietnamese Pho",
      description: isZh
        ? "清澈鲜美的牛骨汤底，配上滑嫩的河粉和薄切牛肉，越南国魂之味。"
        : "Vietnam's soul food — a crystal-clear beef bone broth ladled over silky rice noodles and rare beef slices.",
      ingredients: isZh
        ? "河粉、牛骨、牛肉薄片、洋葱、姜、八角、桂皮、鱼露、青柠、豆芽、薄荷"
        : "Rice noodles, beef bones, thinly sliced beef, onion, ginger, star anise, cinnamon, fish sauce, lime, bean sprouts, mint",
      steps: isZh
        ? "牛骨焯水洗净。\n另起锅加水、牛骨、洋葱、姜、八角、桂皮，小火炖2小时。\n过滤汤底，加鱼露调味。\n河粉用热水泡软沥干放入碗中。\n摆上生牛肉薄片。\n浇上滚烫的汤底烫熟牛肉。\n配上豆芽、青柠、薄荷和辣椒随个人口味添加。"
        : "Blanch beef bones; rinse.\nSimmer bones with onion, ginger, star anise, cinnamon for 2 hours.\nStrain broth; season with fish sauce.\nSoft rice noodles in hot water; drain into bowls.\nArrange raw beef slices on top.\nLadle boiling broth over to cook the beef.\nServe with bean sprouts, lime, mint, and chili on the side.",
      cookingTime: 140,
      calories: 400,
      cuisineType: "东南亚",
      difficulty: "hard",
      starred: false,
      createdAt: now.toISOString(),
    },

    // ── 印度菜 ────────────────────────────────────────────
    {
      id: "demo-rec-17",
      title: isZh ? "黄油鸡肉咖喱" : "Butter Chicken",
      description: isZh
        ? "印度最受欢迎的咖喱之一，炭烤鸡块浸入浓郁番茄奶油酱中，香气四溢。"
        : "India's most beloved curry — tandoori chicken pieces swimming in a rich, buttery tomato-cream sauce.",
      ingredients: isZh
        ? "鸡腿肉、酸奶、咖喱粉、姜黄粉、番茄酱、鲜奶油、黄油、姜蒜蓉、香料"
        : "Chicken thighs, yogurt, garam masala, turmeric, tomato purée, heavy cream, butter, ginger-garlic paste, spices",
      steps: isZh
        ? "鸡腿肉切块，用酸奶、咖喱粉、姜黄粉腌制2小时。\n烤箱200°C烤15分钟。\n锅中融化黄油，炒姜蒜蓉出香。\n加入番茄酱和香料小火煮10分钟。\n倒入鲜奶油搅匀。\n放入烤好的鸡肉煮5分钟。\n加少许糖和盐调味，配馕饼或米饭食用。"
        : "Cube chicken; marinate with yogurt, garam masala, turmeric 2 hours.\nBake at 200°C for 15 min.\nMelt butter; sauté ginger-garlic paste.\nAdd tomato purée and spices; simmer 10 min.\nStir in cream.\nAdd baked chicken; simmer 5 min.\nSeason with sugar and salt; serve with naan or rice.",
      cookingTime: 45,
      calories: 550,
      cuisineType: "印度菜",
      difficulty: "medium",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-18",
      title: isZh ? "印度香饭" : "Chicken Biryani",
      description: isZh
        ? "层层叠加的香料米饭与腌制鸡肉，用面糊封锅慢蒸，香气扑鼻。"
        : "Aromatic basmati rice and marinated chicken layered and slow-steamed in a sealed pot — a feast for the senses.",
      ingredients: isZh
        ? "长粒米、鸡腿肉、酸奶、洋葱、姜蒜蓉、番红花、香料（丁香、豆蔻、肉桂）、香菜、薄荷"
        : "Basmati rice, chicken thighs, yogurt, onion, ginger-garlic paste, saffron, whole spices (cloves, cardamom, cinnamon), cilantro, mint",
      steps: isZh
        ? "鸡肉切块，用酸奶、香料粉腌制1小时。\n米泡30分钟，煮至八分熟沥干。\n洋葱切薄片炸至金黄酥脆。\n锅底铺一层鸡肉，盖一层米饭，撒炸洋葱和番红花水。\n重复至材料用完。\n面糊封住锅盖缝隙，小火蒸25分钟。\n关火焖5分钟后开盖，撒香菜薄荷。"
        : "Cube chicken; marinate with yogurt and spices 1 hour.\nSoak rice 30 min; parboil until 80% done; drain.\nSlice onion; fry until crispy and golden.\nLayer chicken, then rice, fried onions, and saffron water.\nRepeat layers until ingredients are used.\nSeal pot lid with dough; steam on low heat 25 min.\nRest 5 min; uncover; garnish with cilantro and mint.",
      cookingTime: 75,
      calories: 620,
      cuisineType: "印度菜",
      difficulty: "hard",
      starred: false,
      createdAt: now.toISOString(),
    },

    // ── 中东菜 ────────────────────────────────────────────
    {
      id: "demo-rec-19",
      title: isZh ? "烤肉串" : "Kebab",
      description: isZh
        ? "中东街头经典，孜然香料腌制的羊肉串炭火烤至外焦里嫩。"
        : "A Middle Eastern street-food icon — cumin-spiced lamb skewers chargrilled to smoky perfection.",
      ingredients: isZh
        ? "羊腿肉、洋葱、孜然粉、辣椒粉、蒜、柠檬汁、橄榄油、盐"
        : "Lamb leg, onion, cumin, chili powder, garlic, lemon juice, olive oil, salt",
      steps: isZh
        ? "羊肉切小块，洋葱切碎。\n将羊肉、洋葱、孜然粉、辣椒粉、蒜末、柠檬汁、橄榄油、盐混合腌制2小时。\n穿在竹签或金属签上。\n炭火或烤箱200°C烤10-12分钟，中途翻面。\n搭配馕饼、沙拉和酸奶酱食用。"
        : "Cube lamb; finely dice onion.\nMix lamb with onion, cumin, chili powder, garlic, lemon juice, olive oil, salt; marinate 2 hours.\nThread onto skewers.\nGrill over charcoal or bake at 200°C for 10-12 min, turning once.\nServe with flatbread, salad, and yogurt sauce.",
      cookingTime: 25,
      calories: 460,
      cuisineType: "中东菜",
      difficulty: "medium",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-21",
      title: isZh ? "法拉费" : "Falafel",
      description: isZh
        ? "中东经典素食，鹰嘴豆泥炸至金黄酥脆，夹在皮塔饼中配芝麻酱食用。"
        : "Golden-crisp chickpea fritters stuffed into warm pita with tangy tahini sauce — a beloved Middle Eastern vegetarian staple.",
      ingredients: isZh
        ? "鹰嘴豆、洋葱、蒜、香菜、孜然粉、小茴香粉、面粉、芝麻酱、柠檬汁、橄榄油"
        : "Chickpeas, onion, garlic, cilantro, cumin, coriander, flour, tahini, lemon juice, olive oil",
      steps: isZh
        ? "干鹰嘴豆泡水过夜，沥干。\n鹰嘴豆、洋葱、蒜、香菜、香料放入料理机打碎（不要打成泥）。\n加面粉搅匀，搓成小球。\n油锅加热至170°C，炸4-5分钟至金黄。\n芝麻酱加柠檬汁和水调成酱汁。\n法拉费夹入皮塔饼，配生菜、番茄和芝麻酱食用。"
        : "Soak dried chickpeas overnight; drain.\nPulse chickpeas, onion, garlic, cilantro, and spices in a food processor (not to a paste).\nMix in flour; shape into balls.\nDeep-fry at 170°C for 4-5 min until golden.\nWhisk tahini with lemon juice and water for sauce.\nStuff pita with falafel, lettuce, tomato, and tahini sauce.",
      cookingTime: 35,
      calories: 380,
      cuisineType: "中东菜",
      difficulty: "medium",
      starred: false,
      createdAt: now.toISOString(),
    },

    // ── 墨西哥菜 ──────────────────────────────────────────
    {
      id: "demo-rec-20",
      title: isZh ? "墨西哥卷饼" : "Chicken Tacos",
      description: isZh
        ? "墨西哥经典街头小吃，软玉米饼裹上香料鸡肉、莎莎酱和牛油果。"
        : "Mexico's iconic street food — soft corn tortillas loaded with spiced chicken, fresh salsa, and creamy avocado.",
      ingredients: isZh
        ? "鸡胸肉、玉米饼、牛油果、番茄、洋葱、青柠、香菜、辣椒粉、孜然、酸奶油"
        : "Chicken breast, corn tortillas, avocado, tomato, onion, lime, cilantro, chili powder, cumin, sour cream",
      steps: isZh
        ? "鸡胸肉用辣椒粉、孜然、盐、橄榄油腌制15分钟。\n平底锅煎熟后切碎。\n番茄切丁，洋葱切碎，香菜切碎，挤青柠汁做成莎莎酱。\n牛油果加青柠汁和盐压成泥。\n玉米饼在干锅中加热。\n饼上放鸡肉、牛油果泥、莎莎酱和酸奶油。\n撒上香菜，挤青柠汁食用。"
        : "Marinate chicken with chili powder, cumin, salt, olive oil 15 min.\nPan-fry until cooked; shred.\nDice tomato, onion, and cilantro; mix with lime juice for salsa.\nMash avocado with lime juice and salt.\nWarm tortillas in a dry pan.\nAssemble: chicken, guacamole, salsa, sour cream.\nGarnish with cilantro and a squeeze of lime.",
      cookingTime: 25,
      calories: 440,
      cuisineType: "墨西哥菜",
      difficulty: "easy",
      starred: false,
      createdAt: now.toISOString(),
    },
    {
      id: "demo-rec-22",
      title: isZh ? "鸡肉玉米卷饼" : "Chicken Enchilada",
      description: isZh
        ? "墨西哥经典焗菜，软玉米饼卷入香料鸡丝，淋上红辣椒酱和芝士烤至金黄。"
        : "Soft corn tortillas rolled around spiced shredded chicken, smothered in red enchilada sauce and melted cheese.",
      ingredients: isZh
        ? "鸡胸肉、玉米饼、莫扎里拉芝士、红辣椒酱、洋葱、蒜、孜然、酸奶油、香菜"
        : "Chicken breast, corn tortillas, mozzarella cheese, red enchilada sauce, onion, garlic, cumin, sour cream, cilantro",
      steps: isZh
        ? "鸡胸肉煮熟，撕成细丝。\n锅中炒洋葱蒜末，加鸡肉丝和孜然炒匀。\n玉米饼稍加热，中间放鸡肉丝卷起。\n烤盘底铺一层红辣椒酱，码放卷好的玉米饼。\n浇上剩余红辣椒酱，撒满芝士。\n烤箱180°C烤15分钟至芝士融化冒泡。\n取出撒香菜，配上酸奶油食用。"
        : "Boil chicken breast; shred.\nSauté onion and garlic; add shredded chicken and cumin.\nWarm tortillas; fill with chicken and roll up.\nSpread enchilada sauce in a baking dish; arrange rolled tortillas.\nTop with remaining sauce and cheese.\nBake at 180°C for 15 min until bubbly and golden.\nGarnish with cilantro and sour cream.",
      cookingTime: 35,
      calories: 480,
      cuisineType: "墨西哥菜",
      difficulty: "medium",
      starred: false,
      createdAt: now.toISOString(),
    },
  ]
}