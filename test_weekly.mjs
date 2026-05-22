import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_BASE_URL,
});

const weeklyPrompt = `你是 CookMate 的 AI 厨师助手。你的任务是为一周七天生成早、午、晚餐菜谱。
1. 自由推荐多样化的菜谱，涵盖不同菜系（中餐、西餐、川菜、日料等混搭），确保一周饮食丰富不重复
2. 每个菜谱需包含：菜名、简介、**食材清单（每项食材必须标注数量，如"鸡胸肉 200g"、"鸡蛋 2个"、"大蒜 3瓣"）**、步骤、烹饪时间、热量、菜系、难度
3. 始终用中文回复
4. 响应必须是 JSON 格式，不要包含任何 markdown 标记

JSON 格式:
{
  "周一": {
    "breakfast": { "title":"...", "description":"...", "ingredients":[], "steps":[], "cookingTime":30, "calories":400, "cuisineType":"中餐", "difficulty":"easy" },
    "lunch": { ... },
    "dinner": { ... }
  },
  ...
}`;

async function test() {
  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL,
    messages: [
      { role: "system", content: weeklyPrompt },
      { role: "user", content: "请为以下一周每一天生成早、午、晚餐的菜谱。\n饮食类型: 家常\n份量: 2人份\n返回 JSON 格式" },
    ],
    temperature: 0.7,
    max_tokens: 8000,
  });

  console.log("finish_reason:", response.choices[0]?.finish_reason);
  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.log("ERROR: no content returned");
    console.log("full response:", JSON.stringify(response.choices[0]?.message, null, 2));
    return;
  }
  console.log("content length:", content.length);
  
  try {
    const parsed = JSON.parse(content);
    console.log("PARSE OK! Days:", Object.keys(parsed).join(", "));
  } catch (e) {
    console.log("PARSE FAILED:", e.message);
    console.log("Last 150 chars:", JSON.stringify(content.slice(-150)));
  }
}

test().catch(e => console.error("API ERROR:", e.message, e.status));