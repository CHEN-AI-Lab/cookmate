// ─── 食材中英文映射 + 风险管控清单 ───
// 供前端 UI 展示和后端 API 校验共用

// ══════════════════════════════════════════
// 第 1 部分：中英文食材名映射（Chinese → English）
// 添加新食材时在此追加，两端自动生效
// ══════════════════════════════════════════

export const INGREDIENT_LABELS: Record<string, string> = {
  // 🥬 蔬菜
  "西红柿": "Tomato", "番茄": "Tomato", "黄瓜": "Cucumber",
  "青菜": "Greens", "白菜": "Napa Cabbage", "菠菜": "Spinach",
  "生菜": "Lettuce", "西兰花": "Broccoli", "茄子": "Eggplant",
  "土豆": "Potato", "马铃薯": "Potato", "胡萝卜": "Carrot",
  "冬瓜": "Winter Melon", "木耳": "Wood Ear", "洋葱": "Onion",
  "大蒜": "Garlic", "姜": "Ginger", "葱": "Spring Onion",
  "辣椒": "Chili", "青椒": "Green Pepper", "红椒": "Red Pepper",
  "芹菜": "Celery", "韭菜": "Chinese Chives", "豆芽": "Bean Sprout",
  "南瓜": "Pumpkin", "苦瓜": "Bitter Melon", "丝瓜": "Luffa",
  "豆角": "Green Bean", "四季豆": "Green Bean", "豌豆": "Pea",
  "玉米": "Corn", "莲藕": "Lotus Root", "山药": "Chinese Yam",
  "芋头": "Taro", "红薯": "Sweet Potato", "紫薯": "Purple Potato",
  "西葫芦": "Zucchini", "花菜": "Cauliflower", "菜花": "Cauliflower",
  "卷心菜": "Cabbage", "包菜": "Cabbage", "圆白菜": "Cabbage",
  "空心菜": "Water Spinach", "油麦菜": "Leaf Lettuce", "茼蒿": "Garland Chrysanthemum",
  "芦笋": "Asparagus", "秋葵": "Okra",
  "蘑菇": "Mushroom", "香菇": "Shiitake", "金针菇": "Enoki Mushroom",
  "杏鲍菇": "King Oyster Mushroom", "平菇": "Oyster Mushroom",

  // 🍎 水果
  "苹果": "Apple", "香蕉": "Banana", "橙子": "Orange",
  "柠檬": "Lemon", "草莓": "Strawberry", "蓝莓": "Blueberry",
  "葡萄": "Grape", "提子": "Grape", "西瓜": "Watermelon",
  "哈密瓜": "Cantaloupe", "芒果": "Mango", "菠萝": "Pineapple",
  "桃子": "Peach", "梨": "Pear", "猕猴桃": "Kiwi",
  "火龙果": "Dragon Fruit", "樱桃": "Cherry", "荔枝": "Lychee",
  "龙眼": "Longan", "石榴": "Pomegranate", "柚子": "Pomelo",
  "百香果": "Passion Fruit", "椰子": "Coconut", "木瓜": "Papaya",
  "牛油果": "Avocado", "山竹": "Mangosteen",

  // 🥩 肉禽蛋
  "鸡蛋": "Egg", "鸭蛋": "Duck Egg", "皮蛋": "Century Egg",
  "鸡胸肉": "Chicken Breast", "鸡腿": "Chicken Thigh", "鸡翅": "Chicken Wing",
  "鸡腿肉": "Chicken Thigh", "鸡爪": "Chicken Feet", "鸡胗": "Chicken Gizzard",
  "五花肉": "Pork Belly", "猪里脊": "Pork Loin", "排骨": "Ribs",
  "猪排": "Pork Chop", "猪蹄": "Pork Trotter", "猪肝": "Pork Liver",
  "猪肚": "Pork Stomach", "猪耳": "Pork Ear",
  "牛肉": "Beef", "牛腩": "Beef Brisket", "牛腱": "Beef Shank",
  "牛排": "Steak", "牛尾": "Oxtail",
  "羊肉": "Lamb", "羊排": "Lamb Chop",
  "培根": "Bacon", "火腿": "Ham", "腊肉": "Cured Meat",
  "香肠": "Sausage", "肉馅": "Ground Meat",
  "鸡": "Chicken", "鸭": "Duck", "鹅": "Goose",

  // 🦐 海鲜水产
  "虾": "Shrimp", "虾仁": "Shrimp", "大虾": "Prawn",
  "鱼": "Fish", "鲈鱼": "Sea Bass", "三文鱼": "Salmon",
  "鳕鱼": "Cod", "带鱼": "Ribbonfish", "黄花鱼": "Yellow Croaker",
  "龙利鱼": "Sole Fish", "巴沙鱼": "Basa Fish",
  "螃蟹": "Crab", "蟹肉": "Crab Meat",
  "蛤蜊": "Clam", "花蛤": "Clam", "蛏子": "Razor Clam",
  "扇贝": "Scallop", "生蚝": "Oyster", "牡蛎": "Oyster",
  "鱿鱼": "Squid", "墨鱼": "Cuttlefish", "章鱼": "Octopus",
  "海带": "Seaweed", "紫菜": "Seaweed",

  // 🥛 乳品豆制品
  "牛奶": "Milk", "酸奶": "Yogurt", "奶酪": "Cheese",
  "黄油": "Butter", "奶油": "Cream", "淡奶油": "Whipping Cream",
  "豆腐": "Tofu", "嫩豆腐": "Silken Tofu", "老豆腐": "Firm Tofu",
  "豆腐干": "Dried Tofu", "腐竹": "Tofu Stick", "千张": "Tofu Sheet",
  "豆浆": "Soy Milk", "豆皮": "Tofu Skin",

  // 🍚 主食粮油
  "大米": "Rice", "米饭": "Rice", "小米": "Millet",
  "面条": "Noodles", "挂面": "Dried Noodles", "意面": "Pasta",
  "意大利面": "Pasta", "面粉": "Flour", "高筋面粉": "Bread Flour",
  "低筋面粉": "Cake Flour", "糯米": "Glutinous Rice",
  "燕麦": "Oats", "燕麦片": "Oatmeal", "麦片": "Cereal",
  "面包": "Bread", "吐司": "Toast", "馒头": "Steamed Bun",
  "饺子皮": "Wonton Wrap", "馄饨皮": "Wonton Wrap",
  "食用油": "Cooking Oil", "花生油": "Peanut Oil",
  "橄榄油": "Olive Oil", "芝麻油": "Sesame Oil",
  "盐": "Salt", "糖": "Sugar", "冰糖": "Rock Sugar",
  "酱油": "Soy Sauce", "老抽": "Dark Soy Sauce", "生抽": "Light Soy Sauce",
  "醋": "Vinegar", "料酒": "Cooking Wine", "蚝油": "Oyster Sauce",
  "豆瓣酱": "Bean Paste", "芝麻酱": "Sesame Paste",
  "番茄酱": "Ketchup", "辣椒酱": "Chili Sauce",
  "淀粉": "Corn Starch", "生粉": "Corn Starch",
  "粉丝": "Glass Noodles", "粉条": "Glass Noodles",
  "蒸鱼豉油": "Steamed Fish Soy Sauce",

  // 🥜 坚果干货
  "花生": "Peanut", "花生米": "Peanut", "核桃": "Walnut",
  "杏仁": "Almond", "腰果": "Cashew", "松子": "Pine Nut",
  "芝麻": "Sesame", "红枣": "Red Date", "枸杞": "Goji Berry",

  // 🍪 零食饮料
  "饼干": "Cookie", "蛋糕": "Cake", "巧克力": "Chocolate",
  "蜂蜜": "Honey", "茶叶": "Tea", "咖啡": "Coffee",

  // 🧂 调味佐料
  "八角": "Star Anise", "桂皮": "Cinnamon", "香叶": "Bay Leaf",
  "花椒": "Sichuan Pepper", "干辣椒": "Dried Chili",
  "孜然": "Cumin", "咖喱": "Curry",
  "白胡椒粉": "White Pepper", "黑胡椒粉": "Black Pepper",
  "五香粉": "Five Spice Powder", "十三香": "Thirteen Spices",

  // 其他常见
  "水": "Water", "冰块": "Ice", "高汤": "Broth",
  "酵母": "Yeast", "泡打粉": "Baking Powder", "小苏打": "Baking Soda",
}

// ══════════════════════════════════════════
// 第 2 部分：食材风险管控清单
// ══════════════════════════════════════════

export const NON_FOOD = [
  "石头", "沙子", "泥土", "铁", "铜", "铝", "钢", "钉子", "螺丝",
  "水泥", "玻璃", "塑料", "纸", "布", "橡胶", "胶水", "电池", "绳子",
  "木头", "油漆", "涂料", "胶带", "铁丝", "树叶", "树皮", "树枝", "木棍",
  // English
  "stone", "rock", "sand", "dirt", "soil", "iron", "copper", "aluminum",
  "steel", "nail", "screw", "cement", "glass", "plastic", "paper", "cloth",
  "rubber", "glue", "battery", "rope", "wood", "paint", "tape",
  "wire", "leaf", "bark", "twig",
]

export const TOXIC = [
  "甲醇", "甲醛", "苯", "丙酮", "洗衣粉", "洗洁精", "漂白水",
  "消毒液", "农药", "杀虫剂", "除草剂", "百草枯", "敌敌畏",
  "毒蘑菇", "毒草", "夹竹桃", "曼陀罗", "断肠草", "乌头",
  "汞", "水银", "铅", "镉", "砷", "工业酒精",
  // English
  "methanol", "formaldehyde", "benzene", "acetone", "detergent",
  "cleanser", "bleach", "disinfectant", "pesticide", "insecticide",
  "herbicide", "paraquat", "dichlorvos",
  "poisonous mushroom", "poisonous weed", "oleander", "datura",
  "poison", "toxic", "mercury", "lead", "cadmium", "arsenic",
  "industrial alcohol", "aconitum",
]

export const PROTECTED = [
  "大熊猫", "熊猫", "金丝猴", "东北虎", "老虎", "雪豹",
  "藏羚羊", "扬子鳄", "中华鲟", "黑熊", "熊掌", "穿山甲",
  "天鹅", "猫头鹰", "海龟", "鲸鱼", "鲸", "鲨鱼", "鱼翅",
  "海马", "珊瑚", "红豆杉", "银杏", "野生人参", "珙桐", "雪莲",
  "保护动物", "野生动物", "国家保护",
  // English
  "panda", "giant panda", "golden monkey", "tiger", "siberian tiger",
  "snow leopard", "antelope", "tibetan antelope", "crocodile",
  "sturgeon", "black bear", "bear", "bear paw", "pangolin",
  "swan", "owl", "sea turtle", "turtle", "whale", "shark",
  "shark fin", "seahorse", "coral", "yew", "ginkgo",
  "wild ginseng",
  "protected", "endangered", "wild animal",
]

export const DRUGS = [
  "海洛因", "冰毒", "大麻", "可卡因", "吗啡", "鸦片",
  "摇头丸", "K粉", "罂粟", "罂粟壳", "麻黄草",
  // English
  "heroin", "meth", "cocaine", "morphine", "opium",
  "cannabis", "weed", "ecstasy", "ketamine",
  "poppy", "lsd",
]

export const ILLEGAL = [
  "猫", "狗", "蝙蝠", "果子狸", "活吃", "生吃",
  // English
  "cat", "dog", "bat", "civet", "raw", "live",
]

export const FICTIONAL = [
  "恐龙", "龙肉", "凤凰", "独角兽", "麒麟", "美人鱼", "外星人", "异形", "年兽",
  // English
  "dinosaur", "dragon", "phoenix", "unicorn", "qilin", "mermaid", "alien", "monster", "year beast",
]

export const ADDITIVES = [
  "苏丹红", "三聚氰胺", "吊白块", "工业明胶", "硼砂", "福尔马林", "工业盐",
  // English
  "sudan red", "melamine", "rongalite", "industrial gelatin", "borax", "formalin", "industrial salt",
]

export const BLACKLIST = [
  ...NON_FOOD, ...TOXIC, ...PROTECTED,
  ...DRUGS, ...ILLEGAL, ...FICTIONAL, ...ADDITIVES,
]

export function getBlockReason(invalid: string[], locale: string): string {
  const err = (zh: string, en: string) =>
    locale === "en" || locale.startsWith("en") ? en : zh
  for (const item of invalid) {
    if (FICTIONAL.some((w) => item.includes(w)))
      return err(
        `"${item}" 不是真实存在的食材`,
        `"${item}" is not a real ingredient`
      )
    if (PROTECTED.some((w) => item.includes(w)))
      return err(
        `"${item}" 为国家保护动植物，不可食用`,
        `"${item}" is a protected species and cannot be used as food`
      )
    if (DRUGS.some((w) => item.includes(w)))
      return err(
        `"${item}" 为违禁品，不可食用`,
        `"${item}" is a prohibited substance`
      )
    if (TOXIC.some((w) => item.includes(w)))
      return err(
        `"${item}" 为有毒有害物质，不可食用`,
        `"${item}" is toxic and cannot be used as food`
      )
    if (ILLEGAL.some((w) => item.includes(w)))
      return err(
        `"${item}" 为不可食用食材`,
        `"${item}" is not edible`
      )
    if (NON_FOOD.some((w) => item.includes(w)))
      return err(
        `"${item}" 不是可食用的食材`,
        `"${item}" is not edible`
      )
    if (ADDITIVES.some((w) => item.includes(w)))
      return err(
        `"${item}" 为国家禁止使用的食品添加剂`,
        `"${item}" is a banned food additive`
      )
  }
  return err(
    "请输入真实可食用的食材",
    "Please enter real edible ingredients"
  )
}