// Demo meal plan — 7 days x 3 meals with bilingual (zh/en) recipes
// All 8 cuisine types: 中餐, 西餐, 日料, 韩餐, 东南亚, 印度菜, 中东菜, 墨西哥菜

export interface DemoRecipe {
  id: string
  title: string
  description: string
  ingredients: string
  steps: string
  cookingTime: number
  calories: number
  cuisineType: string
  starred: boolean
}

export interface DemoSlot {
  id: string
  dayOfWeek: number
  mealType: string
  recipe: DemoRecipe | null
  note: string
}

export interface DemoMealPlan {
  id: string
  weekStart: string
  slots: DemoSlot[]
}

interface BilingualContent {
  zh: { title: string; description: string; ingredients: string; steps: string }
  en: { title: string; description: string; ingredients: string; steps: string }
}

interface RecipeDefinition extends BilingualContent {
  id: string
  cookingTime: number
  calories: number
  cuisineType: string
  starred: boolean
}

const recipeDefs: Record<string, RecipeDefinition> = {
  "millet-porridge-eggs": {
    id: "demo-recipe-1",
    zh: {
      title: "小米粥+水煮蛋",
      description: "一碗温热的小米粥配上两个水煮蛋，简单又营养的中式早餐。",
      ingredients: "小米,水,鸡蛋",
      steps: "1.小米淘洗干净\n2.锅中加水烧开，放入小米\n3.小火熬煮20分钟\n4.鸡蛋冷水下锅，水开后煮8分钟\n5.捞出鸡蛋过凉水即可",
    },
    en: {
      title: "Millet Porridge + Boiled Eggs",
      description: "A warm bowl of millet porridge with two boiled eggs — a simple and nutritious Chinese breakfast.",
      ingredients: "millet,water,eggs",
      steps: "1.Rinse millet thoroughly\n2.Bring water to a boil, add millet\n3.Simmer on low heat for 20 minutes\n4.Place eggs in cold water, boil for 8 minutes after water boils\n5.Cool eggs under cold water and serve",
    },
    cookingTime: 25,
    calories: 350,
    cuisineType: "中餐",
    starred: false,
  },
  "kung-pao-chicken": {
    id: "demo-recipe-2",
    zh: {
      title: "宫保鸡丁",
      description: "经典川菜，鸡丁嫩滑、花生酥脆、麻辣鲜香。",
      ingredients: "鸡胸肉,花生米,干辣椒,花椒,葱,姜,蒜,酱油,醋,糖,淀粉",
      steps: "1.鸡胸肉切丁，加料酒、淀粉腌制15分钟\n2.调汁：酱油、醋、糖、淀粉、水调匀\n3.花生米小火炒至金黄备用\n4.热锅凉油，爆香干辣椒和花椒\n5.下鸡丁翻炒至变色\n6.加入葱姜蒜爆香\n7.倒入调好的汁翻炒均匀\n8.最后加入花生米翻炒出锅",
    },
    en: {
      title: "Kung Pao Chicken",
      description: "A classic Sichuan dish — tender chicken, crunchy peanuts, and a bold spicy-savory sauce.",
      ingredients: "chicken breast,peanuts,dried chili peppers,Sichuan peppercorns,scallion,ginger,garlic,soy sauce,vinegar,sugar,cornstarch",
      steps: "1.Dice chicken breast, marinate with cooking wine and cornstarch for 15 min\n2.Mix sauce: soy sauce, vinegar, sugar, cornstarch, and water\n3.Toast peanuts on low heat until golden, set aside\n4.Heat oil, stir-fry dried chilies and Sichuan peppercorns until fragrant\n5.Add chicken, stir-fry until color changes\n6.Add scallion, ginger, and garlic\n7.Pour in sauce and stir-fry evenly\n8.Add peanuts, toss briefly and serve",
    },
    cookingTime: 25,
    calories: 480,
    cuisineType: "中餐",
    starred: false,
  },
  "tomato-eggs-rice": {
    id: "demo-recipe-3",
    zh: {
      title: "番茄炒蛋+米饭",
      description: "国民家常菜，酸甜可口的番茄配上嫩滑的鸡蛋，下饭首选。",
      ingredients: "番茄,鸡蛋,葱,盐,糖,食用油,大米",
      steps: "1.鸡蛋打散加少许盐\n2.番茄切块\n3.热油炒鸡蛋至定型盛出\n4.同一锅炒番茄出汁\n5.加少许糖提鲜\n6.倒回鸡蛋翻炒均匀\n7.撒上葱花出锅",
    },
    en: {
      title: "Tomato Scrambled Eggs + Rice",
      description: "China's quintessential home-style dish — tangy tomatoes with silky scrambled eggs, perfectly paired with steamed rice.",
      ingredients: "tomatoes,eggs,scallion,salt,sugar,cooking oil,rice",
      steps: "1.Beat eggs with a pinch of salt\n2.Cut tomatoes into wedges\n3.S果真ramble eggs in hot oil until set, remove\n4.In the same pan, cook tomatoes until juicy\n5.Add a pinch of sugar to enhance flavor\n6.Return eggs and toss together\n7.Garnish with scallions and serve over rice",
    },
    cookingTime: 20,
    calories: 420,
    cuisineType: "中餐",
    starred: false,
  },
  "soy-milk-buns": {
    id: "demo-recipe-4",
    zh: {
      title: "豆浆+肉包子",
      description: "香浓豆浆配上鲜肉包子，经典中式早餐组合。",
      ingredients: "黄豆,水,面粉,猪肉馅,葱,姜,酱油,盐",
      steps: "1.黄豆提前泡发\n2.用豆浆机打成豆浆\n3.面粉加酵母揉面发酵\n4.肉馅加葱姜末、酱油、盐调匀\n5.包好包子醒发15分钟\n6.上锅蒸15分钟即可",
    },
    en: {
      title: "Soy Milk + Meat Buns",
      description: "Rich soy milk paired with freshly steamed pork buns — a classic Chinese breakfast combo.",
      ingredients: "soybeans,water,flour,ground pork,scallion,ginger,soy sauce,salt",
      steps: "1.Soak soybeans overnight\n2.Blend into soy milk using a soy milk maker\n3.Knead flour with yeast and let rise\n4.Mix pork with minced scallion, ginger, soy sauce, and salt\n5.Fill and shape buns, rest for 15 min\n6.Steam for 15 minutes and serve",
    },
    cookingTime: 35,
    calories: 450,
    cuisineType: "中餐",
    starred: false,
  },
  "braised-spare-ribs": {
    id: "demo-recipe-5",
    zh: {
      title: "红烧排骨",
      description: "色泽红亮、肉质酥烂的经典红烧菜。",
      ingredients: "排骨,酱油,老抽,冰糖,八角,桂皮,姜,葱,料酒",
      steps: "1.排骨冷水下锅焯水去血沫\n2.锅中放少许油，炒冰糖至琥珀色\n3.下排骨翻炒上色\n4.加酱油、老抽、料酒翻炒\n5.加没过排骨的热水，放入八角桂皮姜片\n6.大火烧开转小火炖40分钟\n7.大火收汁，撒葱花出锅",
    },
    en: {
      title: "Braised Spare Ribs",
      description: "Glossy, deep-red spare ribs braised until fork-tender — a beloved Chinese red-cooked classic.",
      ingredients: "pork spare ribs,soy sauce,dark soy sauce,rock sugar,star anise,cinnamon stick,ginger,scallion,cooking wine",
      steps: "1.Blanch ribs in cold water, skim off foam\n2.Melt rock sugar in oil until amber\n3.Add ribs and toss to coat\n4.Add soy sauce, dark soy sauce, and cooking wine\n5.Cover with hot water, add star anise, cinnamon, and ginger\n6.Bring to a boil then simmer 40 min\n7.Reduce sauce on high heat, garnish with scallions",
    },
    cookingTime: 55,
    calories: 550,
    cuisineType: "中餐",
    starred: false,
  },
  "stir-fried-broccoli": {
    id: "demo-recipe-6",
    zh: {
      title: "清炒西兰花",
      description: "清爽脆嫩的快手素菜，健康低卡。",
      ingredients: "西兰花,蒜,盐,食用油",
      steps: "1.西兰花掰小朵，洗净\n2.烧一锅水，加少许盐和油\n3.水开后放入西兰花焯1分钟\n4.捞出过凉水沥干\n5.热锅放油，爆香蒜末\n6.放入西兰花大火快炒\n7.加盐调味出锅",
    },
    en: {
      title: "Stir-fried Broccoli",
      description: "A light, crisp, and quick vegetable side dish — healthy and low-calorie.",
      ingredients: "broccoli,garlic,salt,cooking oil",
      steps: "1.Cut broccoli into florets, rinse well\n2.Boil water with a pinch of salt and oil\n3.Blanch broccoli for 1 minute\n4.Drain and rinse under cold water\n5.Heat oil, sauté minced garlic\n6.Stir-fry broccoli on high heat\n7.Season with salt and serve",
    },
    cookingTime: 12,
    calories: 120,
    cuisineType: "中餐",
    starred: false,
  },
  "milk-bread": {
    id: "demo-recipe-7",
    zh: {
      title: "牛奶+全麦面包",
      description: "简单便捷的西式早餐，适合快节奏的早晨。",
      ingredients: "牛奶,全麦面包",
      steps: "1.牛奶加热至温热\n2.全麦面包烤至微焦\n3.搭配享用",
    },
    en: {
      title: "Milk + Whole Wheat Bread",
      description: "A quick and convenient Western-style breakfast, perfect for busy mornings.",
      ingredients: "milk,whole wheat bread",
      steps: "1.Warm the milk gently\n2.Toast whole wheat bread until golden\n3.Serve together and enjoy",
    },
    cookingTime: 5,
    calories: 280,
    cuisineType: "西餐",
    starred: false,
  },
  "yu-xiang-shredded-pork": {
    id: "demo-recipe-8",
    zh: {
      title: "鱼香肉丝",
      description: "川菜经典，酸甜微辣，肉丝嫩滑，下饭神器。",
      ingredients: "猪里脊,木耳,胡萝卜,青椒,葱姜蒜,豆瓣酱,醋,糖,酱油,淀粉",
      steps: "1.里脊肉切丝，加料酒、淀粉腌制\n2.木耳泡发切丝，胡萝卜切丝，青椒切丝\n3.调鱼香汁：醋、糖、酱油、淀粉、水调匀\n4.热锅凉油，下肉丝滑熟盛出\n5.锅中留底油，下豆瓣酱炒出红油\n6.加葱姜蒜爆香\n7.下木耳丝、胡萝卜丝、青椒丝翻炒\n8.倒入肉丝和鱼香汁翻炒均匀",
    },
    en: {
      title: "Yu Xiang Shredded Pork",
      description: "A Sichuan classic — sweet, sour, and mildly spicy shredded pork that's irresistibly good with rice.",
      ingredients: "pork tenderloin,wood ear mushrooms,carrot,green bell pepper,scallion ginger garlic,bean paste,vinegar,sugar,soy sauce,cornstarch",
      steps: "1.Shred pork, marinate with cooking wine and cornstarch\n2.Soak and shred wood ear mushrooms, julienne carrot and bell pepper\n3.Mix sauce: vinegar, sugar, soy sauce, cornstarch, and water\n4.Stir-fry shredded pork until cooked, set aside\n5.In same pan, fry bean paste until red oil releases\n6.Add scallion, ginger, and garlic\n7.Stir-fry mushrooms, carrot, and bell pepper\n8.Return pork, pour in sauce, toss well",
    },
    cookingTime: 22,
    calories: 450,
    cuisineType: "中餐",
    starred: false,
  },
  "mapo-tofu": {
    id: "demo-recipe-9",
    zh: {
      title: "麻婆豆腐",
      description: "麻辣鲜香的经典川菜，豆腐嫩滑入味。",
      ingredients: "嫩豆腐,猪肉末,豆瓣酱,花椒粉,辣椒粉,葱,姜,蒜,淀粉",
      steps: "1.豆腐切块，热水烫一下\n2.热锅放油，下肉末炒散\n3.加豆瓣酱炒出红油\n4.加姜蒜末爆香\n5.加适量水烧开\n6.放入豆腐轻轻推动\n7.加花椒粉、辣椒粉调味\n8.水淀粉勾芡，撒葱花出锅",
    },
    en: {
      title: "Mapo Tofu",
      description: "A fiery Sichuan classic — silky tofu bathed in a numbing, spicy, and aromatic sauce.",
      ingredients: "silken tofu,ground pork,bean paste,Sichuan peppercorn powder,chili powder,scallion,ginger,garlic,cornstarch",
      steps: "1.Cut tofu into cubes, blanch in hot water\n2.Heat oil, stir-fry ground pork until crumbled\n3.Add bean paste, fry until red oil appears\n4.Sauté ginger and garlic\n5.Add water and bring to a boil\n6.Gently slide in tofu\n7.Season with Sichuan pepper and chili powder\n8.Thicken with cornstarch slurry, garnish with scallions",
    },
    cookingTime: 18,
    calories: 380,
    cuisineType: "中餐",
    starred: false,
  },
  "century-egg-congee": {
    id: "demo-recipe-10",
    zh: {
      title: "皮蛋瘦肉粥",
      description: "绵密顺滑的广式经典粥品，鲜美可口。",
      ingredients: "大米,皮蛋,瘦肉,姜,葱,盐,料酒",
      steps: "1.大米淘洗后浸泡30分钟\n2.瘦肉切丝，加料酒、姜丝腌制\n3.皮蛋切丁\n4.锅中加水烧开，放入大米\n5.小火熬煮30分钟至粥绵密\n6.加入瘦肉丝搅散\n7.加入皮蛋丁煮3分钟\n8.加盐调味，撒葱花",
    },
    en: {
      title: "Century Egg & Pork Congee",
      description: "A silky-smooth Cantonese classic congee, savory and delicious with century egg and tender pork.",
      ingredients: "rice,century egg,lean pork,ginger,scallion,salt,cooking wine",
      steps: "1.Rinse rice and soak for 30 minutes\n2.Shred pork, marinate with cooking wine and ginger\n3.Dice century egg\n4.Boil water, add rice\n5.Simmer for 30 minutes until congee is creamy\n6.Add shredded pork and stir\n7.Add century egg, cook 3 minutes\n8.Season with salt, garnish with scallions",
    },
    cookingTime: 40,
    calories: 380,
    cuisineType: "中餐",
    starred: false,
  },
  "sweet-sour-pork": {
    id: "demo-recipe-11",
    zh: {
      title: "糖醋里脊",
      description: "外酥里嫩的经典糖醋菜，酸甜开胃。",
      ingredients: "猪里脊,鸡蛋,面粉,淀粉,番茄酱,醋,糖,盐",
      steps: "1.里脊切条，加盐、料酒腌制\n2.鸡蛋、面粉、淀粉调成糊\n3.里脊裹糊，六成热油炸至金黄\n4.捞出复炸一次使外皮更酥脆\n5.锅留底油，加番茄酱、糖、醋炒匀\n6.倒入炸好的里脊翻炒均匀",
    },
    en: {
      title: "Sweet and Sour Pork Tenderloin",
      description: "Crispy on the outside, tender inside — a classic sweet and sour dish that wakes up the appetite.",
      ingredients: "pork tenderloin,eggs,flour,cornstarch,tomato ketchup,vinegar,sugar,salt",
      steps: "1.Cut pork into strips, marinate with salt and cooking wine\n2.Mix eggs, flour, and cornstarch into a batter\n3.Coat pork, deep-fry at 350°F until golden\n4.Double-fry for extra crispiness\n5.In the pan, mix ketchup, sugar, and vinegar\n6.Toss fried pork in sauce until evenly coated",
    },
    cookingTime: 30,
    calories: 500,
    cuisineType: "中餐",
    starred: false,
  },
  "garlic-lettuce": {
    id: "demo-recipe-12",
    zh: {
      title: "蒜蓉生菜",
      description: "清脆爽口的快手素菜，蒜香四溢。",
      ingredients: "生菜,蒜,蚝油,食用油",
      steps: "1.生菜洗净掰开\n2.大蒜切末\n3.锅中烧水，水开后放入生菜焯30秒\n4.捞出摆盘\n5.热锅放油，爆香蒜末\n6.加蚝油和少许水炒匀\n7.淋在生菜上",
    },
    en: {
      title: "Garlic Lettuce",
      description: "A crisp and refreshing quick vegetable dish, bursting with garlic aroma.",
      ingredients: "lettuce,garlic,oyster sauce,cooking oil",
      steps: "1.Wash and separate lettuce leaves\n2.Mince garlic\n3.Blanch lettuce in boiling water for 30 seconds\n4.Arrange on a plate\n5.Heat oil, sauté garlic until fragrant\n6.Add oyster sauce and a splash of water, stir\n7.Pour the sauce over the lettuce",
    },
    cookingTime: 8,
    calories: 80,
    cuisineType: "中餐",
    starred: false,
  },
  "oatmeal-nuts": {
    id: "demo-recipe-13",
    zh: {
      title: "燕麦片+坚果",
      description: "高纤维健康早餐，搭配坚果补充优质脂肪。",
      ingredients: "燕麦片,牛奶,核桃仁,杏仁,蜂蜜",
      steps: "1.燕麦片中加入热牛奶\n2.放上核桃仁和杏仁\n3.淋上少许蜂蜜调味",
    },
    en: {
      title: "Oatmeal + Nuts",
      description: "A high-fiber healthy breakfast with nuts for quality fats and a touch of honey.",
      ingredients: "rolled oats,milk,walnuts,almonds,honey",
      steps: "1.Pour hot milk over rolled oats\n2.Top with walnuts and almonds\n3.Drizzle with honey to taste",
    },
    cookingTime: 5,
    calories: 320,
    cuisineType: "西餐",
    starred: false,
  },
  "twice-cooked-pork": {
    id: "demo-recipe-14",
    zh: {
      title: "回锅肉",
      description: "四川名菜，五花肉焦香软糯，配蒜苗一起炒香辣过瘾。",
      ingredients: "五花肉,蒜苗,豆瓣酱,豆豉,姜,蒜,料酒,糖",
      steps: "1.五花肉整块冷水下锅，加姜片料酒煮20分钟\n2.捞出放凉切薄片\n3.蒜苗斜切成段\n4.锅不放油，直接将肉片下锅煎至微卷出油\n5.加入豆瓣酱、豆豉、蒜片翻炒\n6.加少许糖调味\n7.最后加入蒜苗段翻炒至断生",
    },
    en: {
      title: "Twice-Cooked Pork",
      description: "A famous Sichuan dish — crispy, chewy pork belly stir-fried with leeks in a spicy, savory sauce.",
      ingredients: "pork belly,leek,bean paste,fermented black beans,ginger,garlic,cooking wine,sugar",
      steps: "1.Boil whole pork belly with ginger and wine for 20 minutes\n2.Slice thinly after cooling\n3.Cut leeks diagonally into segments\n4.Fry pork slices in dry pan until curled and oil renders\n5.Add bean paste, black beans, and garlic\n6.Add a pinch of sugar\n7.Toss in leeks until just wilted",
    },
    cookingTime: 35,
    calories: 520,
    cuisineType: "中餐",
    starred: false,
  },
  "hot-sour-potatoes": {
    id: "demo-recipe-15",
    zh: {
      title: "酸辣土豆丝",
      description: "家常快手菜，酸辣爽脆，百吃不厌。",
      ingredients: "土豆,干辣椒,花椒,醋,盐,葱,食用油",
      steps: "1.土豆切细丝，泡水去淀粉\n2.冲洗几遍沥干水分\n3.热锅放油，爆香干辣椒和花椒\n4.下土豆丝大火快炒\n5.加醋、盐调味\n6.翻炒均匀，撒葱花出锅",
    },
    en: {
      title: "Hot and Sour Shredded Potatoes",
      description: "A quick home-style dish — tangy, spicy, and delightfully crunchy. You'll never get tired of it.",
      ingredients: "potatoes,dried chili peppers,Sichuan peppercorns,vinegar,salt,scallion,cooking oil",
      steps: "1.Julienne potatoes, soak in water to remove starch\n2.Rinse and drain thoroughly\n3.Heat oil, fry dried chilies and Sichuan peppercorns\n4.Add potato shreds, stir-fry on high heat\n5.Season with vinegar and salt\n6.Toss well, garnish with scallions",
    },
    cookingTime: 12,
    calories: 180,
    cuisineType: "中餐",
    starred: false,
  },
  "fried-egg-toast": {
    id: "demo-recipe-16",
    zh: {
      title: "煎蛋+吐司",
      description: "经典便捷的周末早餐。",
      ingredients: "鸡蛋,吐司面包,黄油,盐,胡椒",
      steps: "1.吐司面包烤至两面微焦\n2.平底锅融化黄油\n3.打入鸡蛋，小火煎至蛋白凝固\n4.撒少许盐和胡椒\n5.煎蛋放在吐司上享用",
    },
    en: {
      title: "Fried Egg + Toast",
      description: "A classic and quick weekend breakfast, done right.",
      ingredients: "eggs,toast bread,butter,salt,pepper",
      steps: "1.Toast bread until golden on both sides\n2.Melt butter in a frying pan\n3.Crack egg, fry on low heat until whites set\n4.Season with salt and pepper\n5.Serve egg on toast and enjoy",
    },
    cookingTime: 8,
    calories: 300,
    cuisineType: "西餐",
    starred: false,
  },
  "sichuan-boiled-fish": {
    id: "demo-recipe-17",
    zh: {
      title: "水煮鱼",
      description: "经典的川菜大菜，鱼肉嫩滑，麻辣鲜香。",
      ingredients: "草鱼/鲈鱼,豆芽,干辣椒,花椒,豆瓣酱,姜,蒜,料酒,淀粉,蛋清",
      steps: "1.鱼片成薄片，加料酒、蛋清、淀粉腌制\n2.豆芽焯水铺在碗底\n3.锅中放油，下豆瓣酱炒出红油\n4.加姜蒜末爆香，加适量水烧开\n5.鱼片逐片下锅，煮至变白捞出\n6.铺在豆芽上，浇上汤汁\n7.撒上干辣椒和花椒\n8.浇热油激发出香味",
    },
    en: {
      title: "Sichuan Boiled Fish",
      description: "A grand Sichuan showpiece — silky fish fillets in a fiery, numbing chili broth.",
      ingredients: "grass carp/sea bass,bean sprouts,dried chili peppers,Sichuan peppercorns,bean paste,ginger,garlic,cooking wine,cornstarch,egg white",
      steps: "1.Slice fish thinly, marinate with wine, egg white, and cornstarch\n2.Blanch bean sprouts, line the bowl\n3.Fry bean paste in oil until red oil releases\n4.Add ginger and garlic, pour in water and bring to boil\n5.Slide fish slices in one by one, cook until white\n6.Layer over bean sprouts, ladle broth on top\n7.Sprinkle dried chilies and Sichuan peppercorns\n8.Pour sizzling hot oil over to release aroma",
    },
    cookingTime: 35,
    calories: 450,
    cuisineType: "中餐",
    starred: false,
  },
  "cucumber-salad": {
    id: "demo-recipe-18",
    zh: {
      title: "凉拌黄瓜",
      description: "清脆爽口的凉菜，解腻开胃。",
      ingredients: "黄瓜,蒜,醋,酱油,糖,辣椒油,芝麻",
      steps: "1.黄瓜拍碎后切段\n2.大蒜切末\n3.调汁：醋、酱油、糖、辣椒油调匀\n4.将料汁浇在黄瓜上\n5.撒上蒜末和芝麻拌匀即可",
    },
    en: {
      title: "Cucumber Salad",
      description: "A crisp, refreshing cold dish that cuts through richness and wakes up the palate.",
      ingredients: "cucumber,garlic,vinegar,soy sauce,sugar,chili oil,sesame seeds",
      steps: "1.Smash cucumber then cut into chunks\n2.Mince garlic\n3.Mix dressing: vinegar, soy sauce, sugar, and chili oil\n4.Pour dressing over cucumber\n5.Top with garlic and sesame seeds, toss well",
    },
    cookingTime: 10,
    calories: 60,
    cuisineType: "中餐",
    starred: false,
  },
  "fresh-meat-wontons": {
    id: "demo-recipe-19",
    zh: {
      title: "鲜肉馄饨",
      description: "皮薄馅大的鲜肉馄饨，汤鲜味美。",
      ingredients: "馄饨皮,猪肉馅,葱,姜,酱油,盐,香油,紫菜,虾皮",
      steps: "1.猪肉馅加葱姜末、酱油、盐、香油调匀\n2.取馄饨皮包入肉馅\n3.锅中烧水，水开下馄饨\n4.煮至馄饨浮起再煮1分钟\n5.碗中放紫菜、虾皮、葱花\n6.连汤带馄饨盛入碗中",
    },
    en: {
      title: "Fresh Meat Wontons",
      description: "Thin-skinned wontons bursting with savory pork filling in a fragrant broth.",
      ingredients: "wonton wrappers,ground pork,scallion,ginger,soy sauce,salt,sesame oil,seaweed,dried shrimp",
      steps: "1.Mix pork with minced scallion, ginger, soy sauce, salt, and sesame oil\n2.Wrap filling in wonton wrappers\n3.Boil water, drop in wontons\n4.Cook until they float, then 1 more minute\n5.Place seaweed, dried shrimp, and scallions in a bowl\n6.Ladle wontons and broth into the bowl",
    },
    cookingTime: 25,
    calories: 350,
    cuisineType: "中餐",
    starred: false,
  },
  "cola-chicken-wings": {
    id: "demo-recipe-20",
    zh: {
      title: "可乐鸡翅",
      description: "甜香软嫩的经典家常菜，可乐的焦糖味让鸡翅格外美味。",
      ingredients: "鸡翅,可乐,酱油,姜,料酒",
      steps: "1.鸡翅洗净划两刀\n2.冷水下锅焯水去血沫\n3.锅中放少许油，下鸡翅煎至两面金黄\n4.倒入可乐没过鸡翅\n5.加酱油、姜片、料酒\n6.大火烧开转中小火炖15分钟\n7.开大火收汁至浓稠裹在鸡翅上",
    },
    en: {
      title: "Cola Chicken Wings",
      description: "Sweet, sticky, and tender — cola's caramel magic transforms chicken wings into an irresistible dish.",
      ingredients: "chicken wings,cola,soy sauce,ginger,cooking wine",
      steps: "1.Wash chicken wings, score two slits each\n2.Blanch in cold water to remove impurities\n3.Fry wings in oil until golden on both sides\n4.Pour in cola to cover wings\n5.Add soy sauce, ginger slices, and cooking wine\n6.Bring to boil then simmer 15 minutes\n7.Reduce sauce on high heat until thick and glazed",
    },
    cookingTime: 30,
    calories: 420,
    cuisineType: "中餐",
    starred: false,
  },
  "tomato-beef-brisket": {
    id: "demo-recipe-21",
    zh: {
      title: "西红柿炖牛腩",
      description: "酸甜浓郁的大菜，牛腩软烂，汤汁拌饭绝配。",
      ingredients: "牛腩,西红柿,土豆,胡萝卜,洋葱,姜,番茄酱,盐,料酒",
      steps: "1.牛腩切块焯水\n2.西红柿切块，土豆胡萝卜切块\n3.热锅放油，炒软西红柿\n4.加番茄酱炒出红油\n5.放入牛腩翻炒\n6.加没过食材的热水\n7.大火烧开转小火炖1.5小时\n8.加入土豆胡萝卜继续炖20分钟\n9.加盐调味出锅",
    },
    en: {
      title: "Tomato Beef Brisket Stew",
      description: "A rich, tangy, and hearty stew — fall-apart beef brisket in a tomato broth that's perfect over rice.",
      ingredients: "beef brisket,tomatoes,potatoes,carrots,onion,ginger,tomato paste,salt,cooking wine",
      steps: "1.Cut brisket into chunks, blanch\n2.Chop tomatoes, potatoes, and carrots\n3.Sauté tomatoes until soft\n4.Add tomato paste, fry until red oil forms\n5.Add beef brisket, stir-fry briefly\n6.Cover with hot water\n7.Boil then simmer 1.5 hours\n8.Add potatoes and carrots, cook 20 more minutes\n9.Season with salt and serve",
    },
    cookingTime: 120,
    calories: 520,
    cuisineType: "中餐",
    starred: false,
  },
  // --- 日料 (Japanese) ---
  "miso-soup": {
    id: "demo-recipe-22",
    zh: {
      title: "味噌汤",
      description: "日式经典汤品，味噌的醇厚搭配豆腐和海带，温暖舒心。",
      ingredients: "味噌,豆腐,海带,葱,水",
      steps: "1.豆腐切小丁\n2.海带泡发切丝\n3.锅中加水烧开，放入海带煮2分钟\n4.加入豆腐煮1分钟\n5.关火，将味噌溶入汤中\n6.撒上葱花即可",
    },
    en: {
      title: "Miso Soup",
      description: "A classic Japanese soup — rich miso broth with silky tofu and seaweed, warm and comforting.",
      ingredients: "miso paste,tofu,seaweed,scallion,water",
      steps: "1.Dice tofu into small cubes\n2.Soak and shred seaweed\n3.Boil water, add seaweed and cook 2 minutes\n4.Add tofu, cook 1 minute\n5.Turn off heat, dissolve miso paste into the broth\n6.Garnish with scallions and serve",
    },
    cookingTime: 10,
    calories: 90,
    cuisineType: "日料",
    starred: false,
  },
  "japanese-curry-rice": {
    id: "demo-recipe-23",
    zh: {
      title: "日式咖喱饭",
      description: "浓郁醇厚的日式咖喱，搭配土豆胡萝卜和鸡肉，米饭绝配。",
      ingredients: "鸡腿肉,土豆,胡萝卜,洋葱,咖喱块,米饭,黄油",
      steps: "1.鸡腿肉切块，蔬菜切滚刀块\n2.黄油融化，炒香洋葱\n3.加入鸡肉煎至变色\n4.加入土豆胡萝卜翻炒\n5.加水没过食材，煮15分钟至蔬菜软烂\n6.关火加入咖喱块搅拌至融化\n7.小火再煮5分钟至浓稠\n8.浇在米饭上享用",
    },
    en: {
      title: "Japanese Curry Rice",
      description: "Rich and velvety Japanese curry with chicken, potatoes, and carrots — a beloved comfort meal.",
      ingredients: "chicken thigh,potatoes,carrots,onion,curry roux blocks,rice,butter",
      steps: "1.Cut chicken and vegetables into bite-sized chunks\n2.Melt butter, sauté onion until translucent\n3.Add chicken, cook until browned\n4.Add potatoes and carrots, stir-fry briefly\n5.Pour in water to cover, simmer 15 min until tender\n6.Turn off heat, add curry roux, stir until dissolved\n7.Simmer 5 more minutes until thickened\n8.Serve over steamed rice",
    },
    cookingTime: 35,
    calories: 580,
    cuisineType: "日料",
    starred: false,
  },
  "teriyaki-chicken": {
    id: "demo-recipe-24",
    zh: {
      title: "照烧鸡",
      description: "日式经典照烧鸡腿，酱汁浓郁甜咸适口，配上米饭完美一餐。",
      ingredients: "鸡腿肉,酱油,味醂,糖,姜,料酒",
      steps: "1.鸡腿肉去骨，用刀背拍松\n2.酱油、味醂、糖、料酒调成照烧汁\n3.平底锅不放油，鸡皮朝下煎至金黄\n4.翻面继续煎至熟\n5.倒入照烧汁，小火收至浓稠\n6.切块盛盘，淋上剩余酱汁",
    },
    en: {
      title: "Teriyaki Chicken",
      description: "Classic Japanese teriyaki chicken thighs — glossy, sweet-savory glaze over tender chicken.",
      ingredients: "chicken thigh,soy sauce,mirin,sugar,ginger,cooking wine",
      steps: "1.Debone chicken thighs, flatten with knife back\n2.Mix soy sauce, mirin, sugar, and wine for teriyaki sauce\n3.Dry-fry chicken skin-side down until golden\n4.Flip and cook through\n5.Pour in teriyaki sauce, simmer until thickened\n6.Slice and serve, drizzle remaining glaze on top",
    },
    cookingTime: 25,
    calories: 420,
    cuisineType: "日料",
    starred: false,
  },
  // --- 韩餐 (Korean) ---
  "kimchi-fried-rice": {
    id: "demo-recipe-25",
    zh: {
      title: "泡菜炒饭",
      description: "韩国经典快手料理，酸辣泡菜配上煎蛋，简单却令人满足。",
      ingredients: "米饭,泡菜,鸡蛋,五花肉,葱,韩式辣酱,芝麻油",
      steps: "1.五花肉切薄片，泡菜切碎\n2.锅中放油，炒香五花肉\n3.加入泡菜翻炒\n4.加入米饭和韩式辣酱炒匀\n5.淋上芝麻油\n6.煎一个太阳蛋放在炒饭上\n7.撒上葱花和芝麻",
    },
    en: {
      title: "Kimchi Fried Rice",
      description: "A Korean quick-fire classic — tangy, spicy kimchi fried rice topped with a sunny-side-up egg.",
      ingredients: "rice,kimchi,eggs,pork belly,scallion,gochujang,sesame oil",
      steps: "1.Slice pork belly thinly, chop kimchi\n2.Fry pork belly until crispy\n3.Add kimchi, stir-fry briefly\n4.Add rice and gochujang, toss until well combined\n5.Drizzle with sesame oil\n6.Fry a sunny-side-up egg, place on top\n7.Garnish with scallions and sesame seeds",
    },
    cookingTime: 15,
    calories: 480,
    cuisineType: "韩餐",
    starred: false,
  },
  "korean-bbq": {
    id: "demo-recipe-26",
    zh: {
      title: "韩式烤肉",
      description: "韩式烤五花肉，焦香四溢，搭配生菜包裹和蘸酱，香而不腻。",
      ingredients: "五花肉,生菜,蒜片,韩式辣酱,烤肉酱,芝麻油",
      steps: "1.五花肉切厚片\n2.平底锅或烤盘烧热，不放油直接烤\n3.烤至两面金黄焦脆\n4.生菜洗净沥干\n5.取一片生菜，放上烤肉、蒜片和蘸酱\n6.包起来一口吃掉",
    },
    en: {
      title: "Korean BBQ",
      description: "Korean-style grilled pork belly — smoky, crispy, and wrapped in lettuce with garlic and dipping sauce.",
      ingredients: "pork belly,lettuce,garlic slices,gochujang,bbq dipping sauce,sesame oil",
      steps: "1.Slice pork belly into thick pieces\n2.Heat a griddle or pan, grill pork without oil\n3.Cook until both sides are golden and crispy\n4.Wash and drain lettuce leaves\n5.Place grilled pork, garlic, and sauce on a lettuce leaf\n6.Wrap and enjoy in one bite",
    },
    cookingTime: 25,
    calories: 550,
    cuisineType: "韩餐",
    starred: false,
  },
  "bibimbap": {
    id: "demo-recipe-27",
    zh: {
      title: "石锅拌饭",
      description: "韩国经典石锅饭，各色蔬菜搭配牛肉和溏心蛋，拌入辣酱美味无比。",
      ingredients: "米饭,牛肉,菠菜,胡萝卜,豆芽,香菇,鸡蛋,韩式辣酱,芝麻油",
      steps: "1.牛肉切片加酱油、糖腌制后炒熟\n2.各色蔬菜分别焯水或炒熟\n3.石锅刷芝麻油，放入米饭\n4.在米饭上依次摆好蔬菜和牛肉\n5.中间打入一个生鸡蛋\n6.石锅加热至底部锅巴形成\n7.加入韩式辣酱，拌匀享用",
    },
    en: {
      title: "Bibimbap",
      description: "Korea's iconic stone bowl rice — colorful vegetables, beef, and a runny egg mixed with spicy gochujang.",
      ingredients: "rice,beef,spinach,carrots,bean sprouts,shiitake mushrooms,eggs,gochujang,sesame oil",
      steps: "1.Marinate sliced beef with soy sauce and sugar, stir-fry until cooked\n2.Blanch or sauté each vegetable separately\n3.Brush stone bowl with sesame oil, add rice\n4.Arrange vegetables and beef on top of rice\n5.Crack a raw egg in the center\n6.Heat the stone bowl until crispy rice forms at the bottom\n7.Add gochujang, mix everything together and enjoy",
    },
    cookingTime: 35,
    calories: 550,
    cuisineType: "韩餐",
    starred: false,
  },
  // --- 东南亚 (Southeast Asian) ---
  "thai-green-curry": {
    id: "demo-recipe-28",
    zh: {
      title: "泰式绿咖喱",
      description: "泰国经典绿咖喱，椰奶香浓搭配鸡肉和蔬菜，微辣清新。",
      ingredients: "鸡胸肉,椰奶,绿咖喱酱,茄子,青椒,罗勒叶,鱼露,糖",
      steps: "1.鸡胸肉切片，茄子切块\n2.锅中倒少许椰奶，加绿咖喱酱炒香\n3.加入鸡肉翻炒至变色\n4.倒入剩余椰奶，煮沸\n5.加入茄子煮5分钟\n6.加鱼露和糖调味\n7.放入青椒和罗勒叶，翻炒均匀即可",
    },
    en: {
      title: "Thai Green Curry",
      description: "A Thai classic — fragrant green curry in creamy coconut milk with tender chicken and fresh vegetables.",
      ingredients: "chicken breast,coconut milk,green curry paste,eggplant,green bell pepper,Thai basil,fish sauce,sugar",
      steps: "1.Slice chicken, cube eggplant\n2.Heat a splash of coconut milk, fry curry paste until fragrant\n3.Add chicken, stir-fry until color changes\n4.Pour in remaining coconut milk, bring to a simmer\n5.Add eggplant, cook 5 minutes\n6.Season with fish sauce and sugar\n7.Add bell pepper and Thai basil, toss and serve",
    },
    cookingTime: 25,
    calories: 420,
    cuisineType: "东南亚",
    starred: false,
  },
  "vietnamese-pho": {
    id: "demo-recipe-29",
    zh: {
      title: "越南河粉",
      description: "越南经典牛肉河粉，牛骨汤底清澈鲜甜，搭配嫩滑牛肉和新鲜香草。",
      ingredients: "河粉,牛骨,牛肉薄片,洋葱,姜,八角,鱼露,豆芽,薄荷叶,青柠",
      steps: "1.牛骨焯水后洗净\n2.加水、洋葱、姜、八角炖2小时熬汤底\n3.河粉用热水泡软\n4.碗中放入河粉和生牛肉薄片\n5.浇上滚烫的牛骨汤\n6.搭配豆芽、薄荷叶和青柠享用",
    },
    en: {
      title: "Vietnamese Pho",
      description: "Vietnam's iconic beef noodle soup — a clear, aromatic bone broth with silky noodles and fresh herbs.",
      ingredients: "rice noodles,beef bones,thinly sliced beef,onion,ginger,star anise,fish sauce,bean sprouts,mint leaves,lime",
      steps: "1.Blanch beef bones, rinse clean\n2.Simmer bones with onion, ginger, and star anise for 2 hours\n3.Soften rice noodles in hot water\n4.Place noodles and raw beef slices in a bowl\n5.Ladle boiling bone broth over the beef\n6.Serve with bean sprouts, mint, and lime wedge",
    },
    cookingTime: 130,
    calories: 380,
    cuisineType: "东南亚",
    starred: false,
  },
  "mango-sticky-rice": {
    id: "demo-recipe-30",
    zh: {
      title: "芒果糯米饭",
      description: "泰国经典甜点，芒果香甜多汁搭配椰香糯米，夏日最美味的享受。",
      ingredients: "芒果,糯米,椰奶,糖,盐,芝麻",
      steps: "1.糯米提前浸泡4小时\n2.蒸锅铺湿布，蒸糯米30分钟\n3.椰奶加糖和少许盐小火加热搅匀\n4.蒸好的糯米倒入椰奶中拌匀静置15分钟\n5.芒果去皮切片\n6.糯米盛盘，摆上芒果片\n7.淋上剩余椰奶，撒上芝麻",
    },
    en: {
      title: "Mango Sticky Rice",
      description: "Thailand's classic dessert — sweet juicy mango paired with coconut-scented sticky rice. Pure summer bliss.",
      ingredients: "mango,glutinous rice,coconut milk,sugar,salt,sesame seeds",
      steps: "1.Soak glutinous rice for 4 hours\n2.Steam rice in a cheesecloth-lined steamer for 30 min\n3.Gently heat coconut milk with sugar and a pinch of salt\n4.Pour coconut milk over steamed rice, let sit 15 min\n5.Slice mango\n6.Serve rice with mango slices\n7.Drizzle remaining coconut milk on top, sprinkle sesame seeds",
    },
    cookingTime: 50,
    calories: 350,
    cuisineType: "东南亚",
    starred: false,
  },
  // --- 印度菜 (Indian) ---
  "butter-chicken": {
    id: "demo-recipe-31",
    zh: {
      title: "黄油鸡",
      description: "印度经典咖喱菜，鸡肉在浓郁番茄奶油酱汁中慢炖，配馕饼或米饭。",
      ingredients: "鸡腿肉,番茄罐头,奶油,黄油,生姜,大蒜,咖喱粉,孜然,姜黄,盐",
      steps: "1.鸡腿肉切块，用咖喱粉、姜黄和盐腌制30分钟\n2.黄油融化，炒香姜蒜末\n3.加入腌好的鸡肉煎至表面金黄\n4.倒入番茄罐头，小火炖20分钟\n5.加入奶油搅匀\n6.再炖5分钟，加盐调味\n7.撒上香菜叶，搭配馕饼或米饭",
    },
    en: {
      title: "Butter Chicken",
      description: "India's beloved curry — tender chicken simmered in a rich, creamy tomato sauce. Perfect with naan or rice.",
      ingredients: "chicken thigh,canned tomatoes,heavy cream,butter,garlic,ginger,curry powder,cumin,turmeric,salt",
      steps: "1.Cube chicken, marinate with curry powder, turmeric, and salt for 30 min\n2.Melt butter, sauté ginger and garlic\n3.Add chicken, sear until golden\n4.Pour in canned tomatoes, simmer 20 minutes\n5.Stir in cream\n6.Cook 5 more minutes, season with salt\n7.Garnish with cilantro, serve with naan or rice",
    },
    cookingTime: 40,
    calories: 520,
    cuisineType: "印度菜",
    starred: false,
  },
  "samosa": {
    id: "demo-recipe-32",
    zh: {
      title: "咖喱角",
      description: "印度经典炸饺，酥脆外皮包裹着香料土豆馅，蘸酱更美味。",
      ingredients: "面粉,土豆,青豌豆,洋葱,姜,咖喱粉,孜然,辣椒,盐,油",
      steps: "1.面粉加水和少许盐揉成面团，醒30分钟\n2.土豆蒸熟压成泥\n3.锅中放油，炒香孜然、洋葱和姜\n4.加入咖喱粉、辣椒、青豌豆翻炒\n5.拌入土豆泥，加盐调味\n6.面团擀开切半，卷成锥形填入馅料\n7.封口捏紧，油锅炸至金黄",
    },
    en: {
      title: "Samosa",
      description: "India's iconic fried pastry — a crispy golden shell filled with spiced potatoes and peas.",
      ingredients: "flour,potatoes,green peas,onion,ginger,curry powder,cumin,chili,salt,oil",
      steps: "1.Mix flour, water, and salt into dough, rest 30 min\n2.Steam potatoes, mash coarsely\n3.Fry cumin, onion, and ginger in oil\n4.Add curry powder, chili, and green peas\n5.Mix in mashed potatoes, season with salt\n6.Roll dough, cut in half, shape into cones\n7.Fill with potato mixture, seal edges, deep-fry until golden",
    },
    cookingTime: 45,
    calories: 280,
    cuisineType: "印度菜",
    starred: false,
  },
  "biryani": {
    id: "demo-recipe-33",
    zh: {
      title: "印度香饭",
      description: "印度经典香米饭，香料腌制鸡肉与米饭层层叠加慢焖，一锅出万般香。",
      ingredients: "鸡肉,印度香米,酸奶,洋葱,姜,蒜,咖喱粉,藏红花,八角,肉桂,盐",
      steps: "1.鸡肉切块，用酸奶、咖喱粉、盐腌制1小时\n2.香米浸泡30分钟后煮至八分熟\n3.锅中放油，炸洋葱至金黄\n4.将鸡肉煎至表面变色\n5.锅中层层铺：米、鸡肉、炸洋葱、藏红花水\n6.最上面再铺一层米\n7.盖紧锅盖，小火焖25分钟\n8.关火静置5分钟后拌匀享用",
    },
    en: {
      title: "Biryani",
      description: "India's majestic layered rice dish — spiced chicken and fragrant basmati rice slow-cooked to perfection.",
      ingredients: "chicken,basmati rice,yogurt,onion,ginger,garlic,curry powder,saffron,star anise,cinnamon,salt",
      steps: "1.Marinate chicken pieces with yogurt, curry powder, and salt for 1 hour\n2.Soak basmati rice 30 min, parboil until 80% done\n3.Fry sliced onions in oil until golden\n4.Sear marinated chicken until color changes\n5.Layer in pot: rice, chicken, fried onions, saffron water\n6.Top with remaining rice\n7.Cover tightly, simmer on low for 25 minutes\n8.Rest 5 minutes off heat, then fluff and serve",
    },
    cookingTime: 90,
    calories: 600,
    cuisineType: "印度菜",
    starred: false,
  },
  // --- 中东菜 (Middle Eastern) ---
  "hummus": {
    id: "demo-recipe-34",
    zh: {
      title: "鹰嘴豆泥",
      description: "中东经典蘸酱，鹰嘴豆与芝麻酱的完美融合，搭配橄榄油和皮塔饼。",
      ingredients: "鹰嘴豆,芝麻酱,橄榄油,柠檬汁,蒜,盐,孜然",
      steps: "1.鹰嘴豆浸泡过夜，煮熟至软烂\n2.沥干后放入料理机\n3.加入芝麻酱、柠檬汁、蒜、盐和孜然\n4.搅打成细腻顺滑的泥\n5.盛入碗中，淋上橄榄油\n6.撒上少许孜然粉和 paprika，搭配皮塔饼",
    },
    en: {
      title: "Hummus",
      description: "A Middle Eastern classic dip — silky chickpeas blended with tahini, lemon, and olive oil.",
      ingredients: "chickpeas,tahini,olive oil,lemon juice,garlic,salt,cumin",
      steps: "1.Soak chickpeas overnight, boil until tender\n2.Drain and transfer to a food processor\n3.Add tahini, lemon juice, garlic, salt, and cumin\n4.Blend until smooth and creamy\n5.Spoon into a bowl, drizzle with olive oil\n6.Sprinkle with cumin and paprika, serve with pita bread",
    },
    cookingTime: 60,
    calories: 200,
    cuisineType: "中东菜",
    starred: false,
  },
  "kebab": {
    id: "demo-recipe-35",
    zh: {
      title: "烤肉串",
      description: "中东经典烤肉串，香料腌制羊肉烤至焦香，搭配烤饼和蔬菜。",
      ingredients: "羊肉,洋葱,蒜,孜然,香菜籽,辣椒粉,盐,橄榄油,烤饼",
      steps: "1.羊肉切块，洋葱切碎\n2.洋葱、蒜、孜然、香菜籽、辣椒粉、盐、橄榄油打成腌料\n3.羊肉块与腌料拌匀，腌制2小时\n4.穿在签子上\n5.烤架或烤箱高温烤至外表焦香\n6.搭配烤饼、烤蔬菜和酸奶酱享用",
    },
    en: {
      title: "Kebab",
      description: "A Middle Eastern grilled classic — spiced lamb skewers charred to perfection, served with flatbread.",
      ingredients: "lamb,onion,garlic,cumin,coriander seeds,chili powder,salt,olive oil,flatbread",
      steps: "1.Cube lamb, chop onion\n2.Blend onion, garlic, cumin, coriander, chili, salt, and olive oil into marinade\n3.Coat lamb with marinade, refrigerate 2 hours\n4.Thread onto skewers\n5.Grill or broil on high until charred and fragrant\n6.Serve with flatbread, grilled vegetables, and yogurt sauce",
    },
    cookingTime: 150,
    calories: 480,
    cuisineType: "中东菜",
    starred: false,
  },
  "falafel": {
    id: "demo-recipe-36",
    zh: {
      title: "法拉费",
      description: "中东经典素食炸丸子，鹰嘴豆与香草混合炸至金黄酥脆，搭配皮塔饼。",
      ingredients: "鹰嘴豆,洋葱,蒜,香菜,孜然,面粉,盐,油,皮塔饼,芝麻酱",
      steps: "1.干鹰嘴豆浸泡过夜（不用煮熟）\n2.将泡好的鹰嘴豆、洋葱、蒜、香菜、孜然、盐用料理机打碎\n3.加入少许面粉搅匀成团\n4.搓成丸子或压成饼\n5.油锅烧至180°C，炸至金黄酥脆\n6.搭配皮塔饼、蔬菜和芝麻酱享用",
    },
    en: {
      title: "Falafel",
      description: "A Middle Eastern vegan staple — deep-fried chickpea and herb patties, crispy outside and tender inside.",
      ingredients: "chickpeas,onion,garlic,cumin,coriander,flour,salt,oil,pita bread,tahini",
      steps: "1.Soak dried chickpeas overnight (do not cook)\n2.Blend chickpeas, onion, garlic, coriander, cumin, and salt in a food processor\n3.Add a little flour, mix into a firm paste\n4.Shape into balls or patties\n5.Deep-fry at 180°C until golden and crispy\n6.Serve in pita with fresh veggies and tahini sauce",
    },
    cookingTime: 30,
    calories: 320,
    cuisineType: "中东菜",
    starred: false,
  },
  // --- 墨西哥菜 (Mexican) ---
  "taco": {
    id: "demo-recipe-37",
    zh: {
      title: "墨西哥卷饼",
      description: "墨西哥经典卷饼，玉米饼包裹牛肉、莎莎酱和牛油果，一口下去层次丰富。",
      ingredients: "玉米饼,牛肉馅,洋葱,番茄,牛油果,青柠,香菜,辣椒粉,孜然,盐",
      steps: "1.牛肉馅加辣椒粉、孜然、盐炒熟\n2.番茄切丁，洋葱切碎\n3.牛油果压成泥，加青柠汁和盐拌匀\n4.玉米饼加热\n5.依次放上牛肉、莎莎酱、牛油果泥\n6.撒上香菜，挤上青柠汁\n7.卷起或对折享用",
    },
    en: {
      title: "Taco",
      description: "Mexico's iconic handheld — warm tortillas filled with seasoned beef, fresh salsa, and creamy avocado.",
      ingredients: "corn tortillas,ground beef,onion,tomato,avocado,lime,cilantro,chili powder,cumin,salt",
      steps: "1.Cook ground beef with chili powder, cumin, and salt\n2.Dice tomato, chop onion\n3.Mash avocado with lime juice and salt\n4.Warm tortillas\n5.Layer beef, salsa, and avocado mash\n6.Top with cilantro and a squeeze of lime\n7.Fold and enjoy",
    },
    cookingTime: 20,
    calories: 400,
    cuisineType: "墨西哥菜",
    starred: false,
  },
  "enchilada": {
    id: "demo-recipe-38",
    zh: {
      title: "安其拉达",
      description: "墨西哥经典烤卷饼，玉米饼卷着鸡肉馅淋上辣椒酱烤至芝士融化。",
      ingredients: "玉米饼,鸡胸肉,芝士,番茄,辣椒,洋葱,蒜,酸奶油,香菜",
      steps: "1.鸡胸肉煮熟撕成丝\n2.番茄、辣椒、洋葱、蒜打成酱，炒制成辣椒酱\n3.玉米饼略加热变软\n4.取玉米饼，放上鸡肉丝和芝士卷起\n5.所有卷饼排入烤盘\n6.浇上辣椒酱，撒满芝士\n7.200°C烤15分钟至芝士融化起泡\n8.淋上酸奶油，撒上香菜",
    },
    en: {
      title: "Enchilada",
      description: "A classic Mexican bake — tortillas rolled with shredded chicken, smothered in chili sauce and melted cheese.",
      ingredients: "corn tortillas,chicken breast,cheese,tomato,chili peppers,onion,garlic,sour cream,cilantro",
      steps: "1.Boil and shred chicken breast\n2.Blend tomato, chili, onion, and garlic into a sauce, simmer\n3.Soften tortillas briefly\n4.Fill each tortilla with chicken and cheese, roll up\n5.Arrange rolls in a baking dish\n6.Cover with chili sauce, top with cheese\n7.Bake at 200°C for 15 min until cheese is bubbly\n8.Drizzle with sour cream, garnish with cilantro",
    },
    cookingTime: 40,
    calories: 480,
    cuisineType: "墨西哥菜",
    starred: false,
  },
  "guacamole": {
    id: "demo-recipe-39",
    zh: {
      title: "鳄梨酱",
      description: "墨西哥经典蘸酱，新鲜牛油果搭配番茄洋葱和香菜，清爽开胃。",
      ingredients: "牛油果,番茄,洋葱,香菜,青柠,辣椒,盐",
      steps: "1.牛油果切开去核，用勺子挖出果肉\n2.用叉子压成粗泥（保留一些颗粒感）\n3.番茄去籽切小丁\n4.洋葱切碎，辣椒切末，香菜切碎\n5.所有材料混合\n6.加入青柠汁和盐调味\n7.拌匀后搭配玉米片食用",
    },
    en: {
      title: "Guacamole",
      description: "Mexico's essential dip — fresh avocados mashed with tomato, onion, cilantro, and lime.",
      ingredients: "avocado,tomato,onion,cilantro,lime,chili pepper,salt",
      steps: "1.Halve avocados, remove pit, scoop out flesh\n2.Mash with a fork, leaving some chunks\n3.Seed and dice tomato finely\n4.Chop onion, mince chili, chop cilantro\n5.Combine all ingredients\n6.Add lime juice and salt to taste\n7.Mix well and serve with tortilla chips",
    },
    cookingTime: 10,
    calories: 160,
    cuisineType: "墨西哥菜",
    starred: false,
  },
}

// 8 cuisines: 中餐 西餐 日料 韩餐 东南亚 印度菜 中东菜 墨西哥菜
const dayRecipeKeys: [string, string, string][] = [
  // Day 0 — Monday
  ["millet-porridge-eggs", "kung-pao-chicken", "teriyaki-chicken"],
  // Day 1 — Tuesday
  ["soy-milk-buns", "kimchi-fried-rice", "yu-xiang-shredded-pork"],
  // Day 2 — Wednesday
  ["milk-bread", "thai-green-curry", "mapo-tofu"],
  // Day 3 — Thursday
  ["century-egg-congee", "japanese-curry-rice", "butter-chicken"],
  // Day 4 — Friday
  ["oatmeal-nuts", "korean-bbq", "kebab"],
  // Day 5 — Saturday
  ["fried-egg-toast", "taco", "samosa"],
  // Day 6 — Sunday
  ["fresh-meat-wontons", "falafel", "vietnamese-pho"],
]

const mealTypeKeys = ["breakfast", "lunch", "dinner"] as const

function getMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - ((day + 6) % 7)
  const monday = new Date(now)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString()
}

export function getDemoMealPlan(locale = "zh-CN"): DemoMealPlan {
  const weekStart = getMonday()
  const slots: DemoSlot[] = []
  const isEN = locale === "en"

  dayRecipeKeys.forEach((meals, dayIdx) => {
    meals.forEach((key, mealIdx) => {
      const mealType = mealTypeKeys[mealIdx]
      const def = recipeDefs[key]
      if (!def) return

      const content = isEN ? def.en : def.zh
      const recipe: DemoRecipe = {
        id: `demo-recipe-${dayIdx}-${mealType}`,
        title: content.title,
        description: content.description,
        ingredients: content.ingredients,
        steps: content.steps,
        cookingTime: def.cookingTime,
        calories: def.calories,
        cuisineType: def.cuisineType,
        starred: def.starred,
      }

      slots.push({
        id: `demo-slot-${dayIdx}-${mealType}`,
        dayOfWeek: dayIdx,
        mealType,
        recipe,
        note: content.description.substring(0, 100),
      })
    })
  })

  return { id: "demo-meal-plan", weekStart, slots }
}