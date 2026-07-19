import OpenAI from "openai"

let openaiInstance: OpenAI | null = null

function getOpenAI() {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1",
      dangerouslyAllowBrowser: false,
      timeout: 120000,
      maxRetries: 2,
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
  client?: OpenAI
}): Promise<string> {
  const { systemPrompt, userContent, maxTokens, client } = params
  const ai = client || getOpenAI()

  // 第一次：带 response_format
  try {
    const response = await ai.chat.completions.create({
      model: getModel(),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" } as const,
      temperature: 0.7,
      max_tokens: maxTokens,
    })
    const content = response.choices[0]?.message?.content
    if (content) return cleanJSONResponse(content)
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && (err as { status: number }).status !== 400 && (err as { status: number }).status !== 403) throw err
  }

  // 降级：不带 response_format
  const response = await ai.chat.completions.create({
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

/** 清理 AI 响应：去掉 markdown 代码块、控制字符等非 JSON 杂音 */
function cleanJSONResponse(content: string): string {
  return content
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // 去掉控制字符
    .trim()
}

/** 规范化食材 */
export function normalizeIngredients(ingredients: unknown): string[] {
  if (!Array.isArray(ingredients)) return []
  return ingredients.map((ing: unknown) => {
    if (typeof ing === "string") return ing
    if (typeof ing === "object" && ing !== null) {
      const obj = ing as Record<string, string>
      const name = obj.name || obj.ingredient || ""
      const qty = obj.quantity || obj.amount || obj.unit || ""
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

// ─── Chinese system prompt ───

const ZH_SYSTEM_PROMPT = `你是 CookMate 的 AI 厨师助手。你的任务是：
1. 根据用户提供的食材推荐菜谱，**必须只使用用户提供的食材**，不能添加用户没有的主食材（盐、油、酱油等基本调料除外）
2. 用户还会提供冰箱里的存货清单（"你的冰箱里还有这些食材"），每种存货大约只有1-2份，偶尔用一下就行，不要大量使用。主要还是要用用户提供的新鲜食材。
3. 每个菜谱需包含：菜名、简介、**食材清单（每项食材必须标注数量）**、步骤、烹饪时间、热量、菜系、难度
4. 回答要实用、可操作，食材要容易买到
5. **食材必须全部是普通家庭日常常备的——能用"水"代替就不用"高汤"，能用"生抽"就不用"味醂"。禁止使用"高汤"、"奶油芝士"、"淡奶油"、"味醂"、"味噌"、"鱼露"、"虾酱"、"椰浆"、"咖喱叶"、"柠檬草"等不常备的食材。**
6. 始终用中文回复
7. 如果用户提供的食材太少，推荐 2-3 道最简单的菜
8. 如果用户提供的食材不是可食用的，返回空数组 []
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

const ZH_WEEKLY_PROMPT = `你是 CookMate 的 AI 厨师助手。你的任务是为一周七天生成早、午、晚餐菜谱。
1. 自由推荐多样化的菜谱，涵盖不同菜系（中餐、西餐、川菜、日料等混搭），确保一周饮食丰富不重复
2. **每次生成的菜谱必须与之前不同** — 不要推荐你已经推荐过的菜，尝试新的组合和创意
3. 每个菜谱需包含：菜名、简介、**食材清单（每项食材必须标注数量）**、步骤、烹饪时间、热量、菜系、难度
4. **食材必须全部是普通家庭日常常备的。禁止使用"高汤"、"奶油芝士"、"淡奶油"、"味醂"、"味噌"、"鱼露"等不常备的食材。**
5. 始终用中文回复
6. **必须生成完整7天（周一至周日），每天早、午、晚餐共3餐，总共21餐。**
7. 响应必须是 JSON 格式，不要包含任何 markdown 标记

JSON 格式:
{
  "周一": {
    "breakfast": { "title":"...", "description":"...", "ingredients":[...], "steps":[...], "cookingTime":..., "calories":..., "cuisineType":"...", "difficulty":"easy|medium|hard" },
    "lunch": { ... },
    "dinner": { ... }
  },
  "周二": { ... },
  ...
}`

// ─── English system prompt ───

const EN_SYSTEM_PROMPT = `You are CookMate's AI chef assistant. Your tasks:
1. Recommend recipes based ONLY on the ingredients the user provides. You may add basic pantry staples (salt, oil, soy sauce, etc.) but no major missing ingredients.
2. The user may also provide a pantry/fridge inventory ("Your fridge also has these ingredients"). Each pantry item has only 1-2 portions — use them sparingly, focus on the user's fresh ingredients.
3. Every recipe must include: title, short description, **ingredient list with quantities (e.g. "chicken breast 200g", "eggs 2", "garlic 3 cloves")**, steps, cooking time, calories, cuisine type, difficulty.
4. Use practical, everyday ingredients that are easy to find in any supermarket.
5. **All ingredients must be common household staples. Use "water" instead of "broth", "soy sauce" instead of "mirin", "all-purpose flour" instead of "cake flour". Avoid "broth", "cream cheese", "heavy cream", "mirin", "miso", "fish sauce", "shrimp paste", "coconut milk", "curry leaves", "lemongrass", "basil", "rosemary", "thyme" and other specialty items.**
6. Always reply in English
7. If the user provides very few ingredients, recommend 2-3 simplest recipes
8. If the ingredients are not edible (chemicals, toxins, non-food items), return empty array []
9. If the ingredients are fictional/non-existent, return empty array []
10. Response must be valid JSON without any markdown formatting

JSON format:
{
  "recipes": [
    {
      "title": "Recipe name",
      "description": "Short description",
      "ingredients": ["chicken breast 200g", "eggs 2"],
      "steps": ["Step 1", "Step 2"],
      "cookingTime": 30,
      "calories": 450,
      "cuisineType": "Chinese",
      "difficulty": "easy"
    }
  ]
}`

const EN_WEEKLY_PROMPT = `You are CookMate's AI chef assistant. Your task is to generate breakfast, lunch, and dinner recipes for a full 7-day week.
1. Recommend diverse recipes covering different cuisines (Chinese, Western, Japanese, Italian, etc.) to keep the week varied and interesting
2. **Each generation must produce different recipes from the previous one** — avoid repeating dishes you have suggested before, try new combinations
3. Every recipe must include: title, short description, **ingredient list with quantities**, steps, cooking time, calories, cuisine type, difficulty
4. **All ingredients must be common household staples. Avoid "broth", "cream cheese", "heavy cream", "mirin", "miso", "fish sauce", and other specialty items.**
5. Always reply in English
6. **You MUST generate a complete 7-day plan (Monday to Sunday), with breakfast, lunch, and dinner every day — 21 meals total, no gaps.**
7. Response must be valid JSON without any markdown formatting

JSON format:
{
  "Monday": {
    "breakfast": { "title":"...", "description":"...", "ingredients":[...], "steps":[...], "cookingTime":..., "calories":..., "cuisineType":"...", "difficulty":"easy|medium|hard" },
    "lunch": { ... },
    "dinner": { ... }
  },
  "Tuesday": { ... },
  ...
}`

export async function generateRecipes(
  ingredients: string[],
  preferences?: {
    dietType?: string
    cuisinePref?: string
    maxTime?: number
    mealType?: "breakfast" | "lunch" | "dinner" | "snack"
    servingSize?: number
  },
  pantryContext?: string[],
  locale?: string
): Promise<RecipeResult[]> {
  const isEnglish = locale === "en"

  if (!hasAIKey()) {
    return isEnglish ? getMockRecipesEn(ingredients, preferences) : getMockRecipes(ingredients, preferences)
  }

  const systemPrompt = isEnglish ? EN_SYSTEM_PROMPT : ZH_SYSTEM_PROMPT

  const pantryInfo = pantryContext?.length
    ? (isEnglish
        ? `\nYour fridge also has these ingredients (only 1-2 portions each, use sparingly): ${pantryContext.join(", ")}`
        : `\n你的冰箱里还有这些食材（每种只有1-2份存货，偶尔用一点就行，不要全用完）：${pantryContext.join("、")}`)
    : ""

  const userContent = [
    isEnglish
      ? `I have these ingredients: ${ingredients.join(", ")}`
      : `我有这些食材: ${ingredients.join("、")}`,
    pantryInfo,
    preferences?.mealType
      ? (isEnglish ? `Meal type: ${preferences.mealType}` : `想做: ${preferences.mealType}`)
      : "",
    preferences?.cuisinePref
      ? (isEnglish ? `Cuisine preference: ${preferences.cuisinePref}` : `菜系偏好: ${preferences.cuisinePref}`)
      : "",
    preferences?.dietType
      ? (isEnglish ? `Diet type: ${preferences.dietType}` : `饮食类型: ${preferences.dietType}`)
      : "",
    preferences?.maxTime
      ? (isEnglish ? `Max cooking time: ${preferences.maxTime} minutes` : `最多烹饪时间: ${preferences.maxTime}分钟`)
      : "",
    preferences?.servingSize
      ? (isEnglish
          ? `Servings: ${preferences.servingSize} people, adjust ingredient quantities accordingly`
          : `份量: ${preferences.servingSize}人份，请按此人数调整食材用量`)
      : "",
  ]
    .filter(Boolean)
    .join("\n")

  const content = await callAI({
    systemPrompt,
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
  pantryItems?: string[],
  locale?: string
): Promise<Record<string, { breakfast: RecipeResult; lunch: RecipeResult; dinner: RecipeResult }>> {
  const isEnglish = locale === "en"

  if (!hasAIKey()) {
    return isEnglish ? getMockWeeklyPlanEn(preferences) : getMockWeeklyPlan(preferences)
  }

  const planClient = new OpenAI({
      apiKey: process.env.AI_API_KEY || process.env.OPENAI_API_KEY,
      baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1",
      timeout: 180000,
      maxRetries: 2,
    })

  const days = isEnglish
    ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    : ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]

  const systemPrompt = isEnglish ? EN_WEEKLY_PROMPT : ZH_WEEKLY_PROMPT

  const userContent = [
    isEnglish
      ? "Please generate breakfast, lunch, and dinner recipes for each day of the week."
      : "请为以下一周每一天生成早、午、晚餐的菜谱。",
    preferences.dietType
      ? (isEnglish ? `Diet type: ${preferences.dietType}` : `饮食类型: ${preferences.dietType}`)
      : "",
    preferences.cuisinePref
      ? (isEnglish ? `Cuisine preference: ${preferences.cuisinePref}` : `菜系偏好: ${preferences.cuisinePref}`)
      : "",
    preferences.calorieGoal
      ? (isEnglish ? `Daily calorie target: ${preferences.calorieGoal} cal` : `每日热量目标: ${preferences.calorieGoal}卡`)
      : "",
    preferences.servingSize
      ? (isEnglish ? `Servings: ${preferences.servingSize} people` : `份量: ${preferences.servingSize}人份`)
      : "",
    pantryItems?.length
      ? (isEnglish
          ? `You have some pantry items: ${pantryItems.join(", ")}. Each has only 1-2 portions — use at most 1-2 times across the week. Focus on fresh ingredients that need to be bought.`
          : `你冰箱里还有少量存货：${pantryItems.join("、")}。注意：每种存货只有1-2份，一周下来每种存货最多出现1-2次。主要还是设计需要用新鲜食材做的菜。`)
      : "",
  ]
    .filter(Boolean)
    .join("\n")

  const content = await callAI({
    systemPrompt,
    userContent,
    maxTokens: 12000,
    client: planClient,
  })

  try {
    return JSON.parse(content)
  } catch {
    console.error("Invalid JSON from AI, first 500 chars:", content.substring(0, 500))
    throw new Error("AI returned invalid JSON")
  }
}

// ══════════════════════════════════════════
//  Mock / Demo Data
// ══════════════════════════════════════════

function getMockRecipes(
  ingredients: string[],
  _prefs?: Record<string, unknown>
): RecipeResult[] {
  const all: RecipeResult[] = [
    { title: "西红柿炒鸡蛋", description: "经典家常菜，酸甜可口，5分钟搞定", ingredients: ["西红柿 300g", "鸡蛋 2个", "葱 1根", "盐 适量", "糖 5g", "油 15ml"], steps: ["鸡蛋打散，加少许盐搅匀", "西红柿切块，葱切末", "热锅凉油，倒入蛋液炒熟盛出", "锅中加油，爆香葱末，倒入西红柿翻炒出汁", "倒回鸡蛋，加盐和糖调味，翻炒均匀出锅"], cookingTime: 10, calories: 280, cuisineType: "中餐", difficulty: "easy" },
    { title: "蒜蓉西兰花", description: "清淡健康，保留蔬菜原味", ingredients: ["西兰花 200g", "大蒜 3瓣", "盐 适量", "油 10ml"], steps: ["西兰花掰小朵，洗净焯水1分钟", "大蒜切末", "热锅加油，爆香蒜末", "倒入西兰花翻炒，加盐调味即可"], cookingTime: 8, calories: 120, cuisineType: "中餐", difficulty: "easy" },
    { title: "酱油炒饭", description: "剩饭完美变身，粒粒分明", ingredients: ["米饭 200g", "鸡蛋 1个", "葱 1根", "酱油 15ml", "油 10ml"], steps: ["鸡蛋打散，葱花切好", "热锅加油，炒熟鸡蛋盛出", "锅中加油，倒入米饭翻炒散开", "淋入酱油翻炒均匀", "加入鸡蛋和葱花，翻炒出锅"], cookingTime: 10, calories: 350, cuisineType: "中餐", difficulty: "easy" },
    { title: "葱油拌面", description: "上海经典，简单又美味", ingredients: ["面条 150g", "葱 2根", "酱油 20ml", "油 15ml", "糖 5g"], steps: ["面条煮熟过凉水", "葱切段，小火炸至焦黄", "碗中加酱油和糖，浇上热葱油", "拌入面条即可"], cookingTime: 15, calories: 400, cuisineType: "中餐", difficulty: "easy" },
    { title: "鸡蛋羹", description: "嫩滑如布丁，老少皆宜", ingredients: ["鸡蛋 2个", "温水 150ml", "盐 适量", "酱油 10ml", "香油 5ml"], steps: ["鸡蛋打散，加温水搅匀", "过筛倒入碗中，撇去浮沫", "盖保鲜膜，上锅蒸10分钟", "淋上酱油和香油即可"], cookingTime: 15, calories: 180, cuisineType: "中餐", difficulty: "easy" },
    { title: "蒜蓉炒菜心", description: "翠绿爽口，蒜香扑鼻", ingredients: ["菜心 200g", "大蒜 3瓣", "盐 适量", "油 10ml"], steps: ["菜心洗净沥干", "大蒜切末", "热锅加油，爆香蒜末", "倒入菜心大火快速翻炒", "加盐调味出锅"], cookingTime: 5, calories: 80, cuisineType: "中餐", difficulty: "easy" },
    { title: "番茄牛肉面", description: "暖心暖胃，番茄酸甜配牛肉鲜香", ingredients: ["面条 150g", "牛肉 100g", "番茄 1个", "葱 1根", "姜 2片", "盐 适量", "油 10ml"], steps: ["牛肉切块焯水去血沫", "番茄切块，葱姜切末", "热锅加油，爆香葱姜，倒入番茄炒出汁", "加水和牛肉，煮15分钟", "放入面条煮熟，加盐调味"], cookingTime: 25, calories: 550, cuisineType: "中餐", difficulty: "medium" },
    { title: "土豆炖牛肉", description: "经典下饭菜，牛肉软烂土豆绵密", ingredients: ["牛肉 150g", "土豆 1个", "胡萝卜 半根", "八角 2个", "酱油 20ml", "盐 适量", "油 10ml"], steps: ["牛肉切块焯水，土豆胡萝卜切滚刀块", "热锅加油，炒香八角，放入牛肉翻炒", "加酱油上色，加水没过牛肉，小火炖40分钟", "加入土豆和胡萝卜，继续炖15分钟", "大火收汁，加盐调味即可"], cookingTime: 60, calories: 580, cuisineType: "中餐", difficulty: "medium" },
    { title: "青椒牛柳", description: "嫩滑多汁的快手小炒", ingredients: ["牛肉 100g", "青椒 1个", "洋葱 半颗", "蚝油 10ml", "酱油 10ml", "油 10ml", "盐 适量"], steps: ["牛肉切条，加酱油和油腌制10分钟", "青椒切丝，洋葱切丝", "热锅加油，大火快速炒牛肉变色盛出", "锅中加油，炒青椒和洋葱至断生", "倒回牛肉，加蚝油翻炒均匀出锅"], cookingTime: 15, calories: 380, cuisineType: "中餐", difficulty: "easy" },
  ]

  if (ingredients.length === 0) return all
  const inputLower = ingredients.map((i) => i.trim().toLowerCase())
  return all.filter((recipe) =>
    recipe.ingredients.some((ri) => inputLower.some((ii) => ri.toLowerCase().includes(ii) || ii.includes(ri.toLowerCase())))
  )
}

function getMockRecipesEn(
  ingredients: string[],
  _prefs?: Record<string, unknown>
): RecipeResult[] {
  const all: RecipeResult[] = [
    { title: "Scrambled Eggs with Tomatoes", description: "Classic Chinese comfort food, tangy and delicious, ready in 5 minutes", ingredients: ["tomatoes 300g", "eggs 2", "spring onion 1", "salt to taste", "sugar 5g", "oil 15ml"], steps: ["Beat eggs with a pinch of salt", "Chop tomatoes and slice spring onion", "Heat oil, scramble eggs, set aside", "Stir-fry tomatoes until saucy", "Return eggs, season with salt and sugar, toss together"], cookingTime: 10, calories: 280, cuisineType: "Chinese", difficulty: "easy" },
    { title: "Garlic Broccoli", description: "Light, healthy, and full of flavor", ingredients: ["broccoli 200g", "garlic 3 cloves", "salt to taste", "oil 10ml"], steps: ["Cut broccoli into florets, blanch for 1 minute", "Mince garlic", "Heat oil, sizzle garlic", "Add broccoli, stir-fry, season with salt"], cookingTime: 8, calories: 120, cuisineType: "Chinese", difficulty: "easy" },
    { title: "Soy Sauce Fried Rice", description: "Perfect way to use leftover rice", ingredients: ["cooked rice 200g", "eggs 1", "spring onion 1", "soy sauce 15ml", "oil 10ml"], steps: ["Beat eggs, chop spring onion", "Heat oil, scramble eggs, set aside", "Add oil, stir-fry rice until separated", "Pour in soy sauce, toss well", "Add eggs and spring onion, mix and serve"], cookingTime: 10, calories: 350, cuisineType: "Chinese", difficulty: "easy" },
    { title: "Scallion Oil Noodles", description: "Simple Shanghai classic, amazingly flavorful", ingredients: ["noodles 150g", "spring onions 2", "soy sauce 20ml", "oil 15ml", "sugar 5g"], steps: ["Cook noodles, drain and rinse under cold water", "Slice spring onions, fry slowly in oil until browned", "Mix soy sauce and sugar in a bowl, pour hot scallion oil over", "Toss with noodles and serve"], cookingTime: 15, calories: 400, cuisineType: "Chinese", difficulty: "easy" },
    { title: "Steamed Egg Custard", description: "Silky smooth like pudding, loved by all ages", ingredients: ["eggs 2", "warm water 150ml", "salt to taste", "soy sauce 10ml", "sesame oil 5ml"], steps: ["Beat eggs, add warm water and whisk", "Strain into a bowl, skim off foam", "Cover with cling film, steam for 10 minutes", "Drizzle with soy sauce and sesame oil"], cookingTime: 15, calories: 180, cuisineType: "Chinese", difficulty: "easy" },
    { title: "Stir-fried Bok Choy with Garlic", description: "Crisp green veg with aromatic garlic", ingredients: ["bok choy 200g", "garlic 3 cloves", "salt to taste", "oil 10ml"], steps: ["Wash and drain bok choy", "Mince garlic", "Heat oil, sizzle garlic", "Add bok choy, stir-fry on high heat", "Season with salt and serve"], cookingTime: 5, calories: 80, cuisineType: "Chinese", difficulty: "easy" },
    { title: "Tomato Beef Noodle Soup", description: "Hearty and warming, tangy tomato with savory beef", ingredients: ["noodles 150g", "beef 100g", "tomato 1", "spring onion 1", "ginger 2 slices", "salt to taste", "oil 10ml"], steps: ["Cut beef into chunks, blanch to remove scum", "Chop tomato, mince ginger and onion", "Stir-fry tomato until saucy, add water and beef", "Simmer for 15 minutes, add noodles and cook until tender", "Season with salt and serve"], cookingTime: 25, calories: 550, cuisineType: "Chinese", difficulty: "medium" },
    { title: "Beef and Potato Stew", description: "Classic hearty stew, tender beef and creamy potatoes", ingredients: ["beef 150g", "potato 1", "carrot half", "star anise 2", "soy sauce 20ml", "salt to taste", "oil 10ml"], steps: ["Cut beef and blanch, cut potato and carrot into chunks", "Stir-fry star anise and beef in oil", "Add soy sauce and water, simmer 40 minutes", "Add potato and carrot, simmer 15 more minutes", "Reduce sauce, season and serve"], cookingTime: 60, calories: 580, cuisineType: "Chinese", difficulty: "medium" },
    { title: "Beef and Pepper Stir-fry", description: "Tender and juicy quick stir-fry", ingredients: ["beef 100g", "green bell pepper 1", "onion half", "soy sauce 10ml", "oyster sauce 10ml", "oil 10ml", "salt to taste"], steps: ["Slice beef, marinate with soy sauce and oil for 10 min", "Slice pepper and onion", "Stir-fry beef on high heat until browned, set aside", "Stir-fry pepper and onion until tender", "Return beef, add oyster sauce, toss and serve"], cookingTime: 15, calories: 380, cuisineType: "Chinese", difficulty: "easy" },
  ]

  if (ingredients.length === 0) return all
  const inputLower = ingredients.map((i) => i.trim().toLowerCase())
  return all.filter((recipe) =>
    recipe.ingredients.some((ri) => inputLower.some((ii) => ri.toLowerCase().includes(ii) || ii.includes(ri.toLowerCase())))
  )
}

function getMockWeeklyPlan(
  _prefs?: Record<string, unknown>
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

function getMockWeeklyPlanEn(
  _prefs?: Record<string, unknown>
): Record<string, { breakfast: RecipeResult; lunch: RecipeResult; dinner: RecipeResult }> {
  return {
    "Monday": {
      breakfast: { title: "Egg Sandwich", description: "Energizing start to the day", ingredients: ["bread slices 2", "egg 1", "lettuce 2 leaves", "mayonnaise 10ml"], steps: ["Toast the bread", "Fry the egg", "Layer with lettuce and mayo"], cookingTime: 10, calories: 320, cuisineType: "Western", difficulty: "easy" },
      lunch: { title: "Tomato Beef Noodle Soup", description: "Hearty and warming lunch", ingredients: ["noodles 150g", "beef 100g", "tomato 1", "spring onion 1", "ginger 2 slices"], steps: ["Blanch beef chunks", "Stir-fry tomatoes until saucy", "Add water, cook noodles with beef"], cookingTime: 25, calories: 550, cuisineType: "Chinese", difficulty: "medium" },
      dinner: { title: "Steamed Fish", description: "Light and fresh, perfect for dinner", ingredients: ["sea bass 300g", "ginger 3 slices", "spring onion 1", "fish soy sauce 15ml"], steps: ["Score the fish", "Steam with ginger for 8 minutes", "Drizzle with soy sauce and top with spring onion"], cookingTime: 15, calories: 280, cuisineType: "Chinese", difficulty: "medium" },
    },
    "Tuesday": {
      breakfast: { title: "Oatmeal with Berries", description: "Healthy fiber-rich breakfast", ingredients: ["oats 40g", "milk 200ml", "banana half", "blueberries 30g"], steps: ["Cook oats with milk until soft", "Slice banana", "Top with blueberries and serve"], cookingTime: 10, calories: 310, cuisineType: "Western", difficulty: "easy" },
      lunch: { title: "Kung Pao Chicken", description: "Classic Sichuan, sweet and spicy", ingredients: ["chicken breast 150g", "peanuts 30g", "dried chili 5g", "cucumber half", "spring onion 1"], steps: ["Dice and marinate chicken", "Roast peanuts", "Stir-fry chili and chicken", "Add cucumber and peanuts, toss"], cookingTime: 20, calories: 420, cuisineType: "Sichuan", difficulty: "medium" },
      dinner: { title: "Chicken and Vegetable Salad", description: "Light and healthy dinner", ingredients: ["chicken breast 100g", "mixed greens 150g", "cherry tomatoes 5", "olive oil 15ml", "lemon half"], steps: ["Poach chicken and slice", "Toss greens with tomatoes", "Drizzle with olive oil and lemon juice, top with chicken"], cookingTime: 15, calories: 300, cuisineType: "Western", difficulty: "easy" },
    },
    "Wednesday": {
      breakfast: { title: "Scrambled Eggs on Toast", description: "Quick protein-packed breakfast", ingredients: ["eggs 2", "bread 2 slices", "butter 10g", "salt to taste"], steps: ["Toast the bread", "Scramble eggs with butter", "Serve eggs on toast"], cookingTime: 8, calories: 350, cuisineType: "Western", difficulty: "easy" },
      lunch: { title: "Mapo Tofu", description: "Spicy and fragrant Sichuan classic", ingredients: ["tofu 200g", "ground pork 80g", "chili bean paste 15g", "Sichuan pepper 2g", "spring onion 1"], steps: ["Cut tofu into cubes, blanch", "Stir-fry pork with chili bean paste", "Add water and tofu, simmer", "Sprinkle Sichuan pepper and green onion"], cookingTime: 15, calories: 380, cuisineType: "Sichuan", difficulty: "medium" },
      dinner: { title: "Garlic Butter Salmon", description: "Simple yet elegant dinner", ingredients: ["salmon fillet 150g", "garlic 2 cloves", "butter 10g", "lemon half", "salt to taste"], steps: ["Season salmon with salt", "Pan-sear with butter and garlic", "Squeeze lemon juice over and serve"], cookingTime: 12, calories: 350, cuisineType: "Western", difficulty: "easy" },
    },
    "Thursday": {
      breakfast: { title: "Yogurt Parfait", description: "Light and refreshing breakfast", ingredients: ["yogurt 200ml", "granola 30g", "mixed berries 50g", "honey 10ml"], steps: ["Layer yogurt in a bowl", "Top with granola and berries", "Drizzle with honey"], cookingTime: 5, calories: 280, cuisineType: "Western", difficulty: "easy" },
      lunch: { title: "Chicken Stir-fry with Vegetables", description: "Quick and healthy lunch", ingredients: ["chicken thigh 150g", "bell pepper 1", "broccoli 100g", "soy sauce 15ml", "garlic 2 cloves"], steps: ["Slice chicken and vegetables", "Stir-fry garlic and chicken until done", "Add vegetables, toss with soy sauce"], cookingTime: 15, calories: 400, cuisineType: "Chinese", difficulty: "easy" },
      dinner: { title: "Minestrone Soup", description: "Hearty Italian vegetable soup", ingredients: ["canned tomatoes 200g", "carrot 1", "celery 2 stalks", "beans 100g", "pasta 50g"], steps: ["Dice vegetables", "Sauté vegetables, add tomatoes and water", "Simmer until tender, add pasta and beans"], cookingTime: 30, calories: 280, cuisineType: "Italian", difficulty: "easy" },
    },
    "Friday": {
      breakfast: { title: "Pancakes with Maple Syrup", description: "Weekend-worthy breakfast", ingredients: ["flour 100g", "egg 1", "milk 150ml", "maple syrup 20ml", "butter 10g"], steps: ["Mix flour, egg, and milk into batter", "Cook pancakes in butter until golden", "Serve with maple syrup"], cookingTime: 15, calories: 420, cuisineType: "Western", difficulty: "easy" },
      lunch: { title: "Chicken Caesar Wrap", description: "Classic lunch wrap", ingredients: ["chicken breast 100g", "tortilla wrap 1", "lettuce 2 leaves", "parmesan 10g", "Caesar dressing 20ml"], steps: ["Grill chicken and slice", "Warm the tortilla", "Layer lettuce, chicken, dressing, and cheese, wrap tightly"], cookingTime: 15, calories: 420, cuisineType: "Western", difficulty: "easy" },
      dinner: { title: "Tomato Basil Pasta", description: "Simple Italian classic", ingredients: ["pasta 150g", "canned tomatoes 200g", "garlic 2 cloves", "basil 5 leaves", "olive oil 15ml"], steps: ["Cook pasta al dente", "Sauté garlic in olive oil, add tomatoes", "Simmer sauce, toss with pasta and basil"], cookingTime: 20, calories: 450, cuisineType: "Italian", difficulty: "easy" },
    },
    "Saturday": {
      breakfast: { title: "French Toast", description: "Golden and fluffy weekend breakfast", ingredients: ["bread 2 slices", "egg 1", "milk 50ml", "cinnamon powder 2g", "maple syrup 15ml"], steps: ["Whisk egg with milk and cinnamon", "Dip bread slices in egg mixture", "Pan-fry until golden on both sides, serve with syrup"], cookingTime: 12, calories: 380, cuisineType: "Western", difficulty: "easy" },
      lunch: { title: "Beef Tacos", description: "Fun and flavorful lunch", ingredients: ["ground beef 150g", "taco shells 3", "lettuce 2 leaves", "tomato 1", "sour cream 20ml"], steps: ["Brown ground beef with seasoning", "Chop lettuce and tomato", "Fill taco shells with beef, lettuce, tomato, and sour cream"], cookingTime: 15, calories: 480, cuisineType: "Mexican", difficulty: "easy" },
      dinner: { title: "Grilled Chicken with Roasted Vegetables", description: "Healthy and satisfying dinner", ingredients: ["chicken breast 150g", "zucchini 1", "bell pepper 1", "olive oil 15ml", "herbs to taste"], steps: ["Season chicken and vegetables with oil and herbs", "Grill chicken until cooked through", "Roast vegetables until tender, serve together"], cookingTime: 25, calories: 380, cuisineType: "Western", difficulty: "easy" },
    },
    "Sunday": {
      breakfast: { title: "Avocado Toast with Eggs", description: "Trendy and nutritious breakfast", ingredients: ["bread 2 slices", "avocado half", "eggs 2", "salt to taste", "lemon juice 5ml"], steps: ["Toast the bread", "Mash avocado with lemon juice and salt", "Fry eggs, serve on avocado toast"], cookingTime: 10, calories: 360, cuisineType: "Western", difficulty: "easy" },
      lunch: { title: "BBQ Pulled Chicken Sandwich", description: "Hearty weekend lunch", ingredients: ["chicken thigh 150g", "burger bun 1", "BBQ sauce 30ml", "coleslaw 50g"], steps: ["Shred cooked chicken, mix with BBQ sauce", "Toast the bun", "Pile chicken on bun, top with coleslaw"], cookingTime: 20, calories: 520, cuisineType: "American", difficulty: "easy" },
      dinner: { title: "Vegetable Stir-fry with Rice", description: "Light end to the weekend", ingredients: ["mixed vegetables 200g", "rice 150g", "garlic 2 cloves", "soy sauce 15ml", "oil 10ml"], steps: ["Cook rice", "Stir-fry garlic and vegetables", "Add soy sauce, serve over rice"], cookingTime: 20, calories: 320, cuisineType: "Chinese", difficulty: "easy" },
    },
  }
}