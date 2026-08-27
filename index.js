import { Bot, GrammyError, HttpError } from "grammy";
import { GoogleGenAI } from "@google/genai";
import express from "express";
import fs from "fs";
import path from "path";
import "dotenv/config";

// ==========================================
// 1. EXPRESS WEB SERVER (24/7 Cloud & Ping Server)
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;
const startTime = new Date();

app.get("/", (req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  res.json({
    status: "online",
    bot: "@mrx_uzbot",
    owner: "Abdulloh Abdug'aniyev (+998939881477)",
    message: "Abdullohning Telegram AI Avto-javob boti 24/7 faol ishlamoqda!",
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    startedAt: startTime.toISOString(),
    serverTime: new Date().toISOString(),
  });
});

app.get("/ping", (req, res) => {
  res.status(200).send("PONG - 24/7 Server Active");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`[HTTP Cloud Server] ${PORT}-portda muvaffaqiyatli ishga tushdi.`);
});

// ==========================================
// 2. CLAN KODI BOSHQARUVI (Dinamik saqlash)
// ==========================================
const CLAN_DATA_FILE = path.join(process.cwd(), "clan_data.json");

function getClanCode() {
  try {
    if (fs.existsSync(CLAN_DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(CLAN_DATA_FILE, "utf-8"));
      return data.clan_code || "Hozircha kod belgilanmagan";
    }
  } catch (e) {
    console.error("Clan kodini o'qishda xatolik:", e);
  }
  return "Hozircha kod belgilanmagan";
}

function setClanCode(newCode) {
  try {
    fs.writeFileSync(
      CLAN_DATA_FILE,
      JSON.stringify({ clan_code: newCode, updated_at: new Date().toISOString() }, null, 2),
      "utf-8"
    );
    return true;
  } catch (e) {
    console.error("Clan kodini saqlashda xatolik:", e);
    return false;
  }
}

// Boshlang'ich fayl mavjud bo'lmasa yaratib qo'yish
if (!fs.existsSync(CLAN_DATA_FILE)) {
  setClanCode("7777");
}

// ==========================================
// 3. BOT VA GEMINI AI SOZLAMALARI
// ==========================================
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!botToken || !geminiApiKey) {
  console.error("XATOLIK: .env faylida TELEGRAM_BOT_TOKEN yoki GEMINI_API_KEY topilmadi!");
}

const bot = new Bot(botToken);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// ENG TEZKOR VA SINOVDAN O'TGAN AI MODELLAR (700ms - 1.5s)
const AI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
];

// AI tizimli ko'rsatmasi (Dinamik Clan kodi bilan)
function getSystemPrompt() {
  const currentClanCode = getClanCode();
  return `
Siz Abdullohning (Telegram: @ABDULLOH_ABDUGANIYEV_11, Tel: +998939881477, Bot: @mrx_uzbot) shaxsiy eng tezkor, aqlli va samimiy AI assistentisiz.

HOZIRGI FAOL CLAN KODI: "${currentClanCode}"

MUHIM QOIDALAR:
1. CLAN KODI SO'RASHSA ("clanga kod ber", "kod nima", "kod kerak", "clan kodi", "klan kodi" va h.k.):
   - Foydalanuvchiga hozirgi faol Clan kodini darhol ayting: "${currentClanCode}"
   - Misol uchun: "🎮 Clan kodi: ${currentClanCode}\n\nMarhamat, kodingiz orqali qo'shilishingiz mumkin! 🔥"

2. FOYDALANUVCHI SAVOLLARIGA:
   - Foydalanuvchi biror mavzuda savol bersa (o'yinlar, DLS, futbol, dasturlash, texnologiya, kino, hayotiy masalalar):
     * Xabarni diqqat bilan o'qib, unga TO'LIQ, ANIQ, CHROYLI va emojilar (⚽️, 🎮, 🔥, 🚀, 💡, 😊) bilan darhol tezkor javob qaytaring.

3. ABDULLOH HAQIDA SO'RASHSA YOKI "SEN KIMSAN" DEYISHSA (QISQA VA LO'NDA):
   - Abdulloh haqida ortiqcha uzun doston yozmasdan, QISQA va londa ma'lumot bering:
     * Abdulloh Abdug'aniyev — 14 yoshda, Shahrixon 2-maktab 9-sinf o'quvchisi. KING SCHOOL'da Bobur Vahobov (UZMIND) shogirdi, Full-stack dasturchi (Node.js, Telegram botlar, veb-saytlar, AI).
     * Aloqa: @ABDULLOH_ABDUGANIYEV_11 | Tel: +998939881477
     * Qisqa tarzda qanday yordam bera olishingizni so'rang.

4. JAVOB BERISH TEZLIGI:
   - Juda tez, lo'nda va ravon insoniy suhbat shaklida javob bering.
`;
}

// AI javob generatsiya qilish funksiyasi (Eng tezkor konfiguratsiya)
async function generateAiResponse(userMessage) {
  let lastError = null;
  const prompt = getSystemPrompt();

  for (const modelName of AI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userMessage,
        config: {
          systemInstruction: prompt,
          maxOutputTokens: 450,
          temperature: 0.7,
        },
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Model ${modelName}]: ${err?.message?.substring(0, 80)}`);
    }
  }

  console.error("[AI Modellar xatolik berdi]:", lastError);
  const clanCode = getClanCode();
  return (
    `Assalomu alaykum! Xabaringiz qabul qilindi. 😊\n\n` +
    `🎮 Clan kodi: ${clanCode}\n\n` +
    `Abdulloh hozir ish jarayonida, tez orada o'zi ham aloqaga chiqadi!\n` +
    `📞 Tel: +998939881477 | 📩 Telegram: @ABDULLOH_ABDUGANIYEV_11`
  );
}

// Typing ("yozmoqda...") statusini ko'rsatish
function startTypingIndicator(ctx, isBusiness = false) {
  const sendTyping = async () => {
    try {
      if (isBusiness && ctx.businessMessage?.business_connection_id) {
        await ctx.api.sendChatAction(ctx.businessMessage.chat.id, "typing", {
          business_connection_id: ctx.businessMessage.business_connection_id,
        });
      } else if (ctx.chat?.id) {
        const extra = {};
        if (ctx.message?.message_thread_id) {
          extra.message_thread_id = ctx.message.message_thread_id;
        }
        await ctx.api.sendChatAction(ctx.chat.id, "typing", extra);
      }
    } catch (e) {}
  };

  sendTyping();
  const intervalId = setInterval(sendTyping, 3500);

  return () => {
    clearInterval(intervalId);
  };
}

// Guruhda xabar Abdullohga yoki botga tegishli ekanligini aniqlash
function isRelevantGroupMessage(ctx) {
  const text = (ctx.message?.text || "").toLowerCase();
  const botUsername = ctx.me?.username?.toLowerCase() || "mrx_uzbot";
  const replyTo = ctx.message?.reply_to_message;

  // 1. Agar guruhda botga yoki Abdullohga mention qilingan bo'lsa
  if (text.includes(`@${botUsername}`) || text.includes("@abdulloh_abduganiyev_11")) {
    return true;
  }

  // 2. Agar guruhda biror kishi biror xabarga REPLY qilgan bo'lsa
  if (replyTo) {
    return true;
  }

  // 3. Clan va boshqa kalit so'zlar
  const keywords = [
    "ai", "bot", "abdulloh", "abduganiyev", "abdug'aniyev", "dls", "uzmind", "bobur", "vahobov",
    "sen kimsan", "kimsan", "salom", "assalomu", "dasturchi", "bot yasash", "sayt", "portfolio",
    "yordam", "narx", "loyiha", "king school", "kim bu", "admin", "shahrixon", "?", "qale", "qandaysan", "gr",
    "kod", "clanga kod", "clan kodi", "klan kodi", "klanga kod", "kod ber", "kod nima", "kod kerak", "kod bering"
  ];
  if (keywords.some((kw) => text.includes(kw))) {
    return true;
  }

  return false;
}

// ==========================================
// 4. TELEGRAM EVENTLARI
// ==========================================

// Business ulanish holati
bot.on("business_connection", (ctx) => {
  console.log(`[Business Connection] Ulanish o'rnatildi! ID: ${ctx.businessConnection.id}`);
});

// Telegram Business xabarlarini qabul qilish va AI orqali javob berish
bot.on("business_message", async (ctx) => {
  const fromId = ctx.businessMessage.from?.id;
  const chatId = ctx.businessMessage.chat?.id;
  const messageText = ctx.businessMessage.text;
  const sticker = ctx.businessMessage.sticker;
  const senderName = ctx.businessMessage.from?.first_name || "Foydalanuvchi";

  if (!messageText && !sticker) return;

  // Agar xabarni Abdulloh o'zi yozgan bo'lsa (fromId !== chatId), bot javob bermaydi
  if (fromId !== chatId) {
    console.log(`[Abdulloh o'zi yozdi -> Chat ID: ${chatId}]: "${messageText || '[Stiker]'}" -> Bot javob bermaydi.`);
    return;
  }

  const chatTitle = `[Business][${senderName}]`;
  const stopTyping = startTypingIndicator(ctx, true);

  try {
    let promptInput = "";

    if (sticker) {
      console.log(`${chatTitle} stiker yubordi: ${sticker.emoji || "sticker"}`);

      try {
        await ctx.replyWithSticker(sticker.file_id, {
          business_connection_id: ctx.businessMessage.business_connection_id,
          reply_parameters: {
            message_id: ctx.businessMessage.message_id,
            allow_sending_without_reply: true,
          },
        });
      } catch (err) {}

      promptInput = `Foydalanuvchi (${senderName}) sizga Telegram stikeri yubordi (${sticker.emoji || "😊"}). Unga quvnoq va samimiy qisqa javob qaytarib, qanday yordam bera olishingizni so'rang.`;
    } else {
      console.log(`${chatTitle}: ${messageText}`);
      promptInput = messageText;
    }

    const aiAnswer = await generateAiResponse(promptInput);

    await ctx.reply(aiAnswer, {
      business_connection_id: ctx.businessMessage.business_connection_id,
      reply_parameters: {
        message_id: ctx.businessMessage.message_id,
        allow_sending_without_reply: true,
      },
    });

    console.log(`[AI Javob -> ${senderName}]: ${aiAnswer}`);
  } catch (error) {
    console.error("[Business Reply Error]:", error?.message || error);
  } finally {
    stopTyping();
  }
});

// Maxsus buyruqlar: /start, /about, /kod
bot.command("start", async (ctx) => {
  await ctx.reply(
    "👋 Assalomu alaykum! Men Abdulloh Abdug'aniyevning shaxsiy aqlli AI assistentiman.\n\n" +
    "Savollaringiz bo'lsa bemalol yozishingiz, Clan kodini bilish/o'zgartirish uchun /kod yoki ma'lumot olish uchun /about buyrug'ini yuborishingiz mumkin! 🚀",
    {
      reply_parameters: {
        message_id: ctx.message.message_id,
        allow_sending_without_reply: true,
      },
    }
  );
});

// /kod va /setkod buyrug'i - Kodni ko'rish yoki Yangilash
bot.command(["kod", "clankod", "setkod"], async (ctx) => {
  const text = ctx.message.text.trim();
  const parts = text.split(/\s+/);

  // Agar /kod <yangi_kod> yozilgan bo'lsa (Masalan: /kod 1234 yoki /kod CLAN_2026)
  if (parts.length > 1) {
    const newCode = parts.slice(1).join(" ");
    setClanCode(newCode);
    await ctx.reply(
      `✅ *Clan kodi muvaffaqiyatli saqlandi!*\n\n` +
      `🔑 *Yangi Clan kodi:* \`${newCode}\`\n\n` +
      `Endi guruhda yoki shaxsiyda kimdir clan kodi haqida so'rasa, bot ushbu yangi kodni avtomatik taqdim etadi! 🔥`,
      {
        parse_mode: "Markdown",
        reply_parameters: {
          message_id: ctx.message.message_id,
          allow_sending_without_reply: true,
        },
      }
    );
    return;
  }

  // Agar shunchaki /kod deb yozilgan bo'lsa
  const currentCode = getClanCode();
  await ctx.reply(
    `🎮 *Hozirgi Clan kodi:* \`${currentCode}\`\n\n` +
    `✏️ *Kodni o'zgartirish uchun:* \`/kod <yangi_kod>\` deb yozing.\n` +
    `_Masalan:_ \`/kod 7777\` yoki \`/kod MY_CLAN\``,
    {
      parse_mode: "Markdown",
      reply_parameters: {
        message_id: ctx.message.message_id,
        allow_sending_without_reply: true,
      },
    }
  );
});

bot.command(["about", "portfolio", "info", "abdulloh"], async (ctx) => {
  const infoText = 
`👨‍💻 *Abdulloh Abdug'aniyev:*

👤 *Yoshi:* 14 yoshda | Shahrixon tumani
🏫 *Maktab:* 2-maktab, 9-sinf
🎓 *IT Ta'limi:* KING SCHOOL (*Bobur Vahobov / UZMIND* shogirdi)
🚀 *Mutaxassisligi:* Full-Stack dasturchi (Node.js, Botlar, Veb-saytlar, AI)

📞 *Telefon:* +998939881477
📩 *Telegram:* @ABDULLOH_ABDUGANIYEV_11
🤖 *AI Bot:* @mrx_uzbot

_Xabaringizni qoldiring, Abdulloh tez orada aloqaga chiqadi!_ ✨`;

  await ctx.reply(infoText, { 
    parse_mode: "Markdown",
    reply_parameters: {
      message_id: ctx.message.message_id,
      allow_sending_without_reply: true,
    },
  });
});

// Stiker kelganda (Direct chat yoki Guruhda)
bot.on("message:sticker", async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const senderId = ctx.from?.id;
  const senderName = ctx.from?.first_name || "Foydalanuvchi";
  const sticker = ctx.message.sticker;

  if (senderId === ctx.me?.id) return;
  if (isGroup && !ctx.message.reply_to_message) {
    return;
  }

  const stopTyping = startTypingIndicator(ctx, false);

  try {
    try {
      await ctx.replyWithSticker(sticker.file_id, {
        reply_parameters: {
          message_id: ctx.message.message_id,
          allow_sending_without_reply: true,
        },
      });
    } catch (e) {}

    const promptInput = `Foydalanuvchi (${senderName}) sizga Telegram stikeri yubordi (${sticker.emoji || "😊"}). Unga samimiy, quvnoq javob qaytarib, qanday yordam bera olishingizni so'rang.`;
    const aiAnswer = await generateAiResponse(promptInput);

    await ctx.reply(aiAnswer, {
      reply_parameters: {
        message_id: ctx.message.message_id,
        allow_sending_without_reply: true,
      },
    });

    console.log(`[AI Sticker Javob -> ${senderName}]: ${aiAnswer}`);
  } catch (error) {
    console.error("[Sticker Handler Error]:", error?.message || error);
  } finally {
    stopTyping();
  }
});

// Guruh va Shaxsiy chat matnli xabarlarini qayta ishlash
bot.on("message:text", async (ctx) => {
  const isPrivate = ctx.chat.type === "private";
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const senderId = ctx.from?.id;
  const senderName = ctx.from?.first_name || "Foydalanuvchi";
  const messageText = ctx.message.text;

  console.log(`[Kelgan Xabar][${ctx.chat.type}][Chat: ${ctx.chat.title || senderName}][From: ${senderName}]: "${messageText}"`);

  if (senderId === ctx.me?.id) {
    return;
  }

  if (isGroup && !isRelevantGroupMessage(ctx)) {
    return;
  }

  const chatContextTitle = isGroup ? `[Guruh: ${ctx.chat.title}]` : "[Direct]";
  const replyTo = ctx.message?.reply_to_message;

  console.log(`>>> ${chatContextTitle}[${senderName}] ga javob tayyorlanmoqda...`);

  const stopTyping = startTypingIndicator(ctx, false);

  try {
    let promptInput = "";

    if (isGroup) {
      if (replyTo) {
        const repliedUser = replyTo.from?.first_name || "Foydalanuvchi";
        const originalText = replyTo.text || replyTo.caption || "[Xabar]";
        promptInput = `Guruh nomi: "${ctx.chat.title}".\nAvvalgi xabar (${repliedUser}): "${originalText}"\nFoydalanuvchi (${senderName}) bunga reply qilib yozdi: "${messageText}".\nFoydalanuvchining xabariga mos, to'liq, qiziqarli, aniq va xushmuomala javob qaytaring. (Agar clan kodi so'ralsa, kodi: "${getClanCode()}").`;
      } else {
        promptInput = `Guruhdagi xabar (${ctx.chat.title}). Foydalanuvchi (${senderName}) yozdi: "${messageText}". Foydalanuvchiga mos, to'liq, qiziqarli va aniq javob bering. (Agar clan kodi so'ralsa, kodi: "${getClanCode()}").`;
      }
    } else {
      promptInput = messageText;
    }

    const aiAnswer = await generateAiResponse(promptInput);

    await ctx.reply(aiAnswer, {
      reply_parameters: {
        message_id: ctx.message.message_id,
        allow_sending_without_reply: true,
      },
    });

    console.log(`[AI Javob -> ${senderName}]: ${aiAnswer}`);
  } catch (error) {
    console.error("[Direct/Group Reply Error]:", error?.message || error);
  } finally {
    stopTyping();
  }
});

// Kanaldagi postlar va izohlar
bot.on("channel_post:text", async (ctx) => {
  const postText = ctx.channelPost.text;
  const botUsername = ctx.me?.username?.toLowerCase() || "mrx_uzbot";

  if (postText.toLowerCase().includes(`@${botUsername}`) || postText.toLowerCase().includes("abdulloh")) {
    console.log(`[Kanal Posti: ${ctx.chat.title}]: ${postText}`);
    const aiAnswer = await generateAiResponse(postText);
    await ctx.reply(aiAnswer);
  }
});

// ==========================================
// 5. CRASH VA XATOLIKLARDAN HIMOYA (24/7 Barqarorlik)
// ==========================================
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`[grammY Error] Update ${ctx?.update?.update_id || "unknown"} da xatolik:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Telegram API xatoligi:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Telegram bilan aloqa xatoligi (Network):", e);
  } else {
    console.error("Noma'lum xatolik:", e);
  }
});

process.on("uncaughtException", (error) => {
  console.error("[CRITICAL uncaughtException]:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[CRITICAL unhandledRejection]:", reason);
});

process.once("SIGINT", () => {
  console.log("Bot to'xtatilmoqda (SIGINT)...");
  bot.stop();
  process.exit(0);
});

process.once("SIGTERM", () => {
  console.log("Bot to'xtatilmoqda (SIGTERM)...");
  bot.stop();
  process.exit(0);
});

// ==========================================
// 6. BOTNI ISHGA TUSHIRISH (Auto-reconnect loop)
// ==========================================
console.log("==========================================");
console.log(" Telegram AI Bot 24/7 tizimi ishga tushmoqda...");
console.log("==========================================");

bot.start({
  onStart: (botInfo) => {
    console.log(`[Bot Online] @${botInfo.username} muvaffaqiyatli ishga tushdi!`);
  },
  drop_pending_updates: true,
  allowed_updates: ["message", "business_message", "business_connection", "channel_post"],
});