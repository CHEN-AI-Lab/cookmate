import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_BASE_URL,
});

async function test() {
  // Simulate the recipes API call - check what format ingredients come in
  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL,
    messages: [
      { role: "system", content: `你是 CookMate 的 AI 厨师助手。你的任务是：
1. 根据用户提供的食材推荐菜谱，**必须只使用用户提供的食材**
2. 响应必须是 JSON 格式
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
}` },
      { role: "user", content: "我有这些食材: 牛肉、土豆、胡萝卜" }
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) { console.log("no content"); return; }
  
  console.log("===== RAW AI RESPONSE =====");
  console.log(content);
  console.log("============================");
  
  try {
    const parsed = JSON.parse(content);
    const r = parsed.recipes?.[0];
    console.log("ingredients type:", typeof r?.ingredients);
    console.log("ingredients isArray:", Array.isArray(r?.ingredients));
    console.log("first ingredient type:", typeof r?.ingredients?.[0]);
    console.log("first ingredient:", JSON.stringify(r?.ingredients?.[0]));
    if (Array.isArray(r?.ingredients)) {
      r.ingredients.forEach((ing, i) => {
        console.log(`  [${i}]`, typeof ing, JSON.stringify(ing));
      });
    }
  } catch(e) {
    console.log("PARSE ERROR:", e.message);
  }
}

test().catch(e => console.error(e));