import OpenAI from "openai"

let openaiInstance: OpenAI | null = null

function getOpenAI() {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1",
      dangerouslyAllowBrowser: false,
    })
  }
  return openaiInstance
}

function getModel(): string {
  return process.env.AI_MODEL || "gpt-4o-mini"
}

function hasAIKey(): boolean {
  return !!(process.env.AI_API_KEY || process.env.OPENAI_API_KEY)
}

/** 通用 AI 调用：先用 json_object 模式，不支持则自动降级 */
async function callAI(params: {
  systemPrompt: string
  userContent: string
  maxTokens: number
}): Promise<string> {
  const { systemPrompt, userContent, maxTokens } = params

  // 第一次：带 response_format（开箱即用 OpenAI、DeepSeek 官方等）
  try {
    const response = await getOpenAI().chat.completions.create({
      model: getModel(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" } as any,
      temperature: 0.7,
      max_tokens: maxTokens,
    })
    const content = response.choices[0]?.message?.content
    if (content) return cleanJSONResponse(content)
  } catch (err: any) {
    // 只有 400 错误（不支持 json_object）才降级重试
    if (err?.status !== 400) throw err
  }

  // 降级：不带 response_format（商汤、部分代理中转等）
  const response = await getOpenAI().chat.completions.create({
    model: getModel(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.7,
    max_tokens: maxTokens,
  })
  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("AI 没有返回内容")
  return cleanJSONResponse(content)
}

/** 清理 AI 响应：去掉 markdown 代码块等非 JSON 杂音 */
function cleanJSONResponse(content: string): string {
  return content
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim()
}

/** 规范化食材：AI 可能返回字符串数组或对象数组，统一转成字符串数组 */
export function normalizeIngredients(ingredients: any): string[] {
  if (!Array.isArray(ingredients)) return []
  return ingredients.map((ing: any) => {
    if (typeof ing === "string") return ing
    // 对象格式：{name:"牛肉", quantity:"300g"} 或 {name:"牛肉", amount:"300g"}
    if (typeof ing === "object" && ing !== null) {
      const name = ing.name || ing.ingredient || ""
      const qty = ing.quantity || ing.amount || ing.unit || ""
      return name + (qty ? ` ${qty}` : "")
    }
    return String(ing)
  })
}

export interface RecipeResult {
  title: string
  description: string
  ingredients: string[]
  steps: string[]
  cookingTime: number
  calories: number
  cuisineType: string
  difficulty: "easy" | "medium" | "hard"
}

const SYSTEM_PROMPT = `你是 CookMate 的 AI 厨师助手。你的任务是：
1. 根据用户提供的食材推荐菜谱，**必须只使用用户提供的食材**，不能添加用户没有的主食材（盐、油、酱油等基本调料除外）
2. 用户还会提供冰箱里的存货清单（"你的冰箱里还有这些食材"），每种存货大约只有1-2份，偶尔用一下就行，不要大量使用。主要还是要用用户提供的新鲜食材。
3. 每个菜谱需包含：菜名、简介、**食材清单（每项食材必须标注数量，如"鸡胸肉 200g"、"鸡蛋 2个"、"大蒜 3瓣"）**、步骤、烹饪时间、热量、菜系、难度
4. 回答要实用、可操作，食材要容易买到
5. **食材必须全部是普通家庭日常常备的——能用"水"代替就不用"高汤"，能用"生抽"就不用"味醂"，能用"普通面粉"就不用"低筋粉"。禁止使用"高汤"（可用水+鸡精代替）、"奶油芝士"、"淡奶油"、"味醂"、"味噌"、"鱼露"、"虾酱"、"椰浆"、"咖喱叶"、"柠檬草"等不常备的食材。蛋炒饭就是蛋炒饭，不要在里面加青豆玉米胡萝卜丁这种冰箱通常不会有的东西。**
6. 始终用中文回复
7. 如果用户提供的食材太少，推荐 2-3 道最简单的菜
8. 如果用户提供的食材不是可食用的（如毒药、化学品、非食品、违禁品、保护动物等），返回空数组 []
9. 如果是虚构/不存在食材，返回空数组 []
10. 响应必须是 JSON 格式，不要包含任何 markdown 标记

JSON 格式:
{
  "recipes": [
    {
      "title": "菜名",
      "description": "简要描述",
      "ingredients": ["食材1 200g", "食材2 2个"],
      "steps": ["步骤1", "步骤2"],
      "cookingTime": 30,
      "calories": 450,
      "cuisineType": "中餐",
      "difficulty": "easy"
    }
  ]
}`

export async function generateRecipes(
  ingredients: string[],
  preferences?: {
    dietType?: string
    cuisinePref?: string
    maxTime?: number
    mealType?: "breakfast" | "lunch" | "dinner" | "snack"
  },
  pantryContext?: string[]
): Promise<RecipeResult[]> {
// 演示模式：没有配置 AI Key 时返回示例数据
  if (!hasAIKey()) {
    return getMockRecipes(ingredients, preferences)
  }

const pantryInfo = pantryContext?.length
    ? `\n你的冰箱里还有这些食材（每种只有1-2份存货，偶尔用一点就行，不要全用完）：${pantryContext.join("、")}`
    : ""

  const userContent = [
    `我有这些食材: ${ingredients.join("、")}`,
    pantryInfo,
    preferences?.mealType ? `想做: ${preferences.mealType}` : "",
    preferences?.cuisinePref ? `菜系偏好: ${preferences.cuisinePref}` : "",
    preferences?.dietType ? `饮食类型: ${preferences.dietType}` : "",
    preferences?.maxTime ? `最多烹饪时间: ${preferences.maxTime}分钟` : "",
  ]
    .filter(Boolean)
    .join("\n")

  const content = await callAI({
    systemPrompt: SYSTEM_PROMPT,
    userContent,
    maxTokens: 2000,
  })

  const parsed = JSON.parse(content)
  return parsed.recipes || []
}

export async function generateWeeklyPlan(
  preferences: {
    dietType?: string
    cuisinePref?: string
    calorieGoal?: number
    servingSize?: number
  },
  pantryItems?: string[]
): Promise<Record<string, { breakfast: RecipeResult; lunch: RecipeResult; dinner: RecipeResult }>> {
  // 演示模式：没有配置 AI Key 时返回示例数据
  if (!hasAIKey()) {
    return getMockWeeklyPlan(preferences)
  }

  const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
  const weeklyPrompt = `你是 CookMate 的 AI 厨师助手。你的任务是为一周七天生成早、午、晚餐菜谱。
1. 自由推荐多样化的菜谱，涵盖不同菜系（中餐、西餐、川菜、日料等混搭），确保一周饮食丰富不重复
2. 每个菜谱需包含：菜名、简介、**食材清单（每项食材必须标注数量，如"鸡胸肉 200g"、"鸡蛋 2个"、"大蒜 3瓣"）**、步骤、烹饪时间、热量、菜系、难度
3. **食材必须全部是普通家庭日常常备的——能用"水"代替就不用"高汤"，能用"生抽"就不用"味醂"，能用"普通面粉"就不用"低筋粉"。禁止使用"高汤"（可用水+鸡精代替）、"奶油芝士"、"淡奶油"、"味醂"、"味噌"、"鱼露"、"虾酱"、"椰浆"、"咖喱叶"、"柠檬草"、"罗勒"、"迷迭香"、"百里香"等不常备的食材。蛋炒饭就是蛋炒饭，不要在里面加青豆玉米胡萝卜丁这种冰箱通常不会有的东西。**
4. 始终用中文回复
5. **必须生成完整7天（周一至周日），每天早、午、晚餐共3餐，总共21餐。每一段都不能少，不能有空缺。**
6. 响应必须是 JSON 格式，不要包含任何 markdown 标记

JSON 格式:
{
  "周一": {
    "breakfast": { "title":"...", "description":"...", "ingredients":[...], "steps":[...], "cookingTime":..., "calories":..., "cuisineType":"...", "difficulty":"easy|medium|hard" },
    "lunch": { ... },
    "dinner": { ... }
  },
  "周二": { ... },
  "周三": { ... },
  "周四": { ... },
  "周五": { ... },
  "周六": { ... },
  "周日": { ... }
}`

  const userContent = [
      `请为以下一周每一天生成早、午、晚餐的菜谱。`,
      preferences.dietType ? `饮食类型: ${preferences.dietType}` : "",
      preferences.cuisinePref ? `菜系偏好: ${preferences.cuisinePref}` : "",
      preferences.calorieGoal ? `每日热量目标: ${preferences.calorieGoal}卡` : "",
      preferences.servingSize ? `份量: ${preferences.servingSize}人份` : "",
      pantryItems?.length ? `你冰箱里还有少量存货：${pantryItems.join("、")}。注意：每种存货只有1-2份，偶尔能用上就很不错了。请不要大量使用存货来设计菜谱，一周下来每种存货最多出现1-2次。主要还是设计需要用新鲜食材做的菜，购物清单里会列出需要购买的新鲜食材。` : "",
      `返回 JSON 格式: { "周一": { "breakfast": {...}, "lunch": {...}, "dinner": {...} }, ... }`,
    ]
      .filter(Boolean)
      .join("\n")

  const content = await callAI({
    systemPrompt: weeklyPrompt,
    userContent,
    maxTokens: 12000,
  })

  return JSON.parse(content)
}

// ====== 演示数据（本地测试，无需 OpenAI Key） ======

function getMockRecipes(
  ingredients: string[],
  _prefs?: any
): RecipeResult[] {
  const all: RecipeResult[] = [
    {
      title: "西红柿炒鸡蛋",
      description: "经典家常菜，酸甜可口，5分钟搞定",
      ingredients: ["西红柿 300g", "鸡蛋 2个", "葱 1根", "盐 适量", "糖 5g", "油 15ml"],
      steps: [
        "鸡蛋打散，加少许盐搅匀",
        "西红柿切块，葱切末",
        "热锅凉油，倒入蛋液炒熟盛出",
        "锅中加油，爆香葱末，倒入西红柿翻炒出汁",
        "倒回鸡蛋，加盐和糖调味，翻炒均匀出锅",
      ],
      cookingTime: 10,
      calories: 280,
      cuisineType: "中餐",
      difficulty: "easy",
    },
    {
      title: "蒜蓉西兰花",
      description: "清淡健康，保留蔬菜原味",
      ingredients: ["西兰花 200g", "大蒜 3瓣", "盐 适量", "油 10ml"],
      steps: [
        "西兰花掰小朵，洗净焯水1分钟",
        "大蒜切末",
        "热锅加油，爆香蒜末",
        "倒入西兰花翻炒，加盐调味即可",
      ],
      cookingTime: 8,
      calories: 120,
      cuisineType: "中餐",
      difficulty: "easy",
    },
    {
      title: "酱油炒饭",
      description: "剩饭完美变身，粒粒分明",
      ingredients: ["米饭 200g", "鸡蛋 1个", "葱 1根", "酱油 15ml", "油 10ml"],
      steps: [
        "鸡蛋打散，葱花切好",
        "热锅加油，炒熟鸡蛋盛出",
        "锅中加油，倒入米饭翻炒散开",
        "淋入酱油翻炒均匀",
        "加入鸡蛋和葱花，翻炒出锅",
      ],
      cookingTime: 10,
      calories: 350,
      cuisineType: "中餐",
      difficulty: "easy",
    },
    {
      title: "葱油拌面",
      description: "上海经典，简单又美味",
      ingredients: ["面条 150g", "葱 2根", "酱油 20ml", "油 15ml", "糖 5g"],
      steps: [
        "面条煮熟过凉水",
        "葱切段，小火炸至焦黄",
        "碗中加酱油和糖，浇上热葱油",
        "拌入面条即可",
      ],
      cookingTime: 15,
      calories: 400,
      cuisineType: "中餐",
      difficulty: "easy",
    },
    {
      title: "鸡蛋羹",
      description: "嫩滑如布丁，老少皆宜",
      ingredients: ["鸡蛋 2个", "温水 150ml", "盐 适量", "酱油 10ml", "香油 5ml"],
      steps: [
        "鸡蛋打散，加温水搅匀",
        "过筛倒入碗中，撇去浮沫",
        "盖保鲜膜，上锅蒸10分钟",
        "淋上酱油和香油即可",
      ],
      cookingTime: 15,
      calories: 180,
      cuisineType: "中餐",
      difficulty: "easy",
    },
    {
      title: "蒜蓉炒菜心",
      description: "翠绿爽口，蒜香扑鼻",
      ingredients: ["菜心 200g", "大蒜 3瓣", "盐 适量", "油 10ml"],
      steps: [
        "菜心洗净沥干",
        "大蒜切末",
        "热锅加油，爆香蒜末",
        "倒入菜心大火快速翻炒",
        "加盐调味出锅",
      ],
      cookingTime: 5,
      calories: 80,
      cuisineType: "中餐",
      difficulty: "easy",
    },
    {
      title: "番茄牛肉面",
      description: "暖心暖胃，番茄酸甜配牛肉鲜香",
      ingredients: ["面条 150g", "牛肉 100g", "番茄 1个", "葱 1根", "姜 2片", "盐 适量", "油 10ml"],
      steps: [
        "牛肉切块焯水去血沫",
        "番茄切块，葱姜切末",
        "热锅加油，爆香葱姜，倒入番茄炒出汁",
        "加水和牛肉，煮15分钟",
        "放入面条煮熟，加盐调味",
      ],
      cookingTime: 25,
      calories: 550,
      cuisineType: "中餐",
      difficulty: "medium",
    },
    {
      title: "土豆炖牛肉",
      description: "经典下饭菜，牛肉软烂土豆绵密",
      ingredients: ["牛肉 150g", "土豆 1个", "胡萝卜 半根", "八角 2个", "酱油 20ml", "盐 适量", "油 10ml"],
      steps: [
        "牛肉切块焯水，土豆胡萝卜切滚刀块",
        "热锅加油，炒香八角，放入牛肉翻炒",
        "加酱油上色，加水没过牛肉，小火炖40分钟",
        "加入土豆和胡萝卜，继续炖15分钟",
        "大火收汁，加盐调味即可",
      ],
      cookingTime: 60,
      calories: 580,
      cuisineType: "中餐",
      difficulty: "medium",
    },
    {
      title: "青椒牛柳",
      description: "嫩滑多汁的快手小炒",
      ingredients: ["牛肉 100g", "青椒 1个", "洋葱 半颗", "蚝油 10ml", "酱油 10ml", "油 10ml", "盐 适量"],
      steps: [
        "牛肉切条，加酱油和油腌制10分钟",
        "青椒切丝，洋葱切丝",
        "热锅加油，大火快速炒牛肉变色盛出",
        "锅中加油，炒青椒和洋葱至断生",
        "倒回牛肉，加蚝油翻炒均匀出锅",
      ],
      cookingTime: 15,
      calories: 380,
      cuisineType: "中餐",
      difficulty: "easy",
    },
  ]

  // 根据用户输入的食材过滤
  if (ingredients.length === 0) return all

  const inputLower = ingredients.map((i) => i.trim().toLowerCase())
  return all.filter((recipe) =>
    recipe.ingredients.some((ri) => inputLower.some((ii) => ri.toLowerCase().includes(ii) || ii.includes(ri.toLowerCase())))
  )
}

function getMockWeeklyPlan(
  _prefs?: any
): Record<string, { breakfast: RecipeResult; lunch: RecipeResult; dinner: RecipeResult }> {
  return {
    "周一": {
      breakfast: { title: "鸡蛋三明治", description: "元气满满的早餐", ingredients: ["吐司面包 2片", "鸡蛋 1个", "生菜 2片", "沙拉酱 10ml"], steps: ["面包烤一下", "煎鸡蛋", "夹入生菜和沙拉酱"], cookingTime: 10, calories: 320, cuisineType: "西餐", difficulty: "easy" },
      lunch: { title: "番茄牛肉面", description: "暖心暖胃的午餐", ingredients: ["面条 150g", "牛肉 100g", "番茄 1个", "葱 1根", "姜 2片"], steps: ["牛肉切块焯水", "番茄炒出汁", "加水煮面，加入牛肉"], cookingTime: 25, calories: 550, cuisineType: "中餐", difficulty: "medium" },
      dinner: { title: "清蒸鲈鱼", description: "清淡鲜美，适合晚餐", ingredients: ["鲈鱼 300g", "姜 3片", "葱 1根", "蒸鱼豉油 15ml"], steps: ["鱼洗净划刀", "铺姜丝上锅蒸8分钟", "淋蒸鱼豉油，撒葱丝"], cookingTime: 15, calories: 280, cuisineType: "中餐", difficulty: "medium" },
    },
    "周二": {
      breakfast: { title: "小米粥配煮鸡蛋", description: "暖胃养生的早餐", ingredients: ["小米 50g", "鸡蛋 1个", "红枣 3颗"], steps: ["小米洗净加水煮粥", "鸡蛋煮至全熟", "加入红枣同煮"], cookingTime: 20, calories: 280, cuisineType: "中餐", difficulty: "easy" },
      lunch: { title: "宫保鸡丁", description: "经典川菜，酸甜微辣", ingredients: ["鸡胸肉 150g", "花生 30g", "干辣椒 5g", "黄瓜 半根", "葱 1根"], steps: ["鸡肉切丁腌制", "花生炒香备用", "爆香辣椒，炒鸡丁", "加入黄瓜花生翻炒"], cookingTime: 20, calories: 420, cuisineType: "川菜", difficulty: "medium" },
      dinner: { title: "冬瓜排骨汤", description: "清淡滋补的汤品", ingredients: ["排骨 200g", "冬瓜 200g", "枸杞 10g", "姜 3片"], steps: ["排骨焯水", "冬瓜切块", "加水炖1小时", "加枸杞调味"], cookingTime: 60, calories: 350, cuisineType: "中餐", difficulty: "easy" },
    },
    "周三": {
      breakfast: { title: "全麦三明治配牛奶", description: "高纤维早晨", ingredients: ["全麦面包 2片", "火腿 2片", "生菜 2片", "牛奶 200ml"], steps: ["面包烤脆", "夹入火腿和生菜", "搭配一杯温牛奶"], cookingTime: 8, calories: 350, cuisineType: "西餐", difficulty: "easy" },
      lunch: { title: "麻婆豆腐", description: "麻辣鲜香的下饭菜", ingredients: ["豆腐 200g", "猪肉末 80g", "豆瓣酱 15g", "花椒 2g", "葱 1根"], steps: ["豆腐切块焯水", "炒肉末和豆瓣酱", "加水和豆腐炖煮", "撒花椒粉和葱花"], cookingTime: 15, calories: 380, cuisineType: "川菜", difficulty: "medium" },
      dinner: { title: "白灼西兰花配鸡胸", description: "低脂高蛋白晚餐", ingredients: ["西兰花 200g", "鸡胸肉 100g", "大蒜 2瓣", "生抽 10ml"], steps: ["鸡胸肉水煮切块", "西兰花焯水", "蒜末爆香淋在菜上"], cookingTime: 15, calories: 300, cuisineType: "中餐", difficulty: "easy" },
    },
    "周四": {
      breakfast: { title: "燕麦粥配水果", description: "维生素满满的清晨", ingredients: ["燕麦 40g", "牛奶 200ml", "香蕉 半根", "蓝莓 30g"], steps: ["燕麦加牛奶煮软", "香蕉切片", "加入蓝莓拌匀"], cookingTime: 10, calories: 310, cuisineType: "西餐", difficulty: "easy" },
      lunch: { title: "红烧排骨", description: "经典家常菜，酱香浓郁", ingredients: ["排骨 250g", "酱油 30ml", "糖 10g", "八角 2个", "姜 3片"], steps: ["排骨焯水", "炒糖色", "加酱油和水慢炖40分钟", "收汁出锅"], cookingTime: 45, calories: 480, cuisineType: "中餐", difficulty: "medium" },
      dinner: { title: "蒜蓉空心菜", description: "清爽素菜", ingredients: ["空心菜 200g", "大蒜 3瓣", "油 10ml", "盐 适量"], steps: ["空心菜洗净切段", "蒜爆香", "大火快炒加盐调味"], cookingTime: 8, calories: 120, cuisineType: "中餐", difficulty: "easy" },
    },
    "周五": {
      breakfast: { title: "煎饺配豆浆", description: "饱腹早餐", ingredients: ["速冻水饺 10个", "豆浆 200ml", "醋 10ml"], steps: ["煎饺至两面金黄", "加热豆浆", "配醋碟食用"], cookingTime: 12, calories: 400, cuisineType: "中餐", difficulty: "easy" },
      lunch: { title: "蒜香鸡翅", description: "外酥里嫩的鸡翅", ingredients: ["鸡翅 6个", "大蒜 3瓣", "生抽 15ml", "蜂蜜 10ml"], steps: ["鸡翅划刀腌制30分钟", "烤箱或空气炸锅180度烤20分钟", "刷蜂蜜翻面再烤5分钟"], cookingTime: 35, calories: 450, cuisineType: "西餐", difficulty: "medium" },
      dinner: { title: "番茄蛋花汤", description: "简单家常汤", ingredients: ["番茄 1个", "鸡蛋 1个", "葱 1根", "盐 适量"], steps: ["番茄切块炒出汁", "加水煮沸", "淋入蛋液搅拌", "撒葱花出锅"], cookingTime: 10, calories: 150, cuisineType: "中餐", difficulty: "easy" },
    },
    "周六": {
      breakfast: { title: "葱油拌面", description: "快手美味早餐", ingredients: ["面条 150g", "葱 2根", "酱油 20ml", "油 10ml"], steps: ["煮面过凉水", "葱花热油爆香", "拌入酱油和面"], cookingTime: 12, calories: 380, cuisineType: "中餐", difficulty: "easy" },
      lunch: { title: "干锅花菜", description: "香辣下饭", ingredients: ["花菜 200g", "五花肉 100g", "干辣椒 5g", "大蒜 3瓣", "洋葱 半颗"], steps: ["花菜焯水", "五花肉切片煎出油", "爆香辣椒蒜", "加花菜翻炒"], cookingTime: 20, calories: 360, cuisineType: "川菜", difficulty: "medium" },
      dinner: { title: "酸辣汤", description: "开胃暖身汤", ingredients: ["豆腐 100g", "木耳 20g", "鸡蛋 1个", "醋 15ml", "白胡椒 2g"], steps: ["豆腐切丝木耳切丝", "加水煮沸", "淋蛋液加醋和胡椒调味"], cookingTime: 12, calories: 180, cuisineType: "中餐", difficulty: "easy" },
    },
    "周日": {
      breakfast: { title: "红豆粥配油条", description: "经典周末早餐", ingredients: ["红豆 30g", "大米 30g", "油条 1根"], steps: ["红豆大米提前泡", "加水煮至软烂", "配油条食用"], cookingTime: 30, calories: 420, cuisineType: "中餐", difficulty: "easy" },
      lunch: { title: "咖喱鸡肉饭", description: "浓郁好吃", ingredients: ["鸡腿肉 150g", "土豆 半颗", "胡萝卜 半根", "咖喱块 2块", "洋葱 半颗"], steps: ["鸡腿肉切块炒变色", "加入土豆胡萝卜翻炒", "加水煮软加咖喱块", "配米饭食用"], cookingTime: 30, calories: 580, cuisineType: "西餐", difficulty: "medium" },
      dinner: { title: "凉拌黄瓜", description: "清爽收尾", ingredients: ["黄瓜 1根", "大蒜 2瓣", "醋 15ml", "香油 5ml"], steps: ["黄瓜拍碎切段", "蒜末加醋香油调汁", "浇在黄瓜上拌匀"], cookingTime: 8, calories: 90, cuisineType: "中餐", difficulty: "easy" },
    },
  }
}