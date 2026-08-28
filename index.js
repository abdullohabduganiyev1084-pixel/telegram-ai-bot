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
// 2. CLAN KODI BOSHQARUVI (Faqat guruhlar uchun)
// ==========================================
const CLAN_DATA_FILE = path.join(process.cwd(), "clan_data.json");

function getClanCode() {
  try {
    if (fs.existsSync(CLAN_DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(CLAN_DATA_FILE, "utf-8"));
      return data.clan_code || "7777";
    }
  } catch (e) {
    console.error("Clan kodini o'qishda xatolik:", e);
  }
  return "7777";
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

// ENG TEZKOR VA MULTIMODAL SINOVDAN O'TGAN MODELLAR
const AI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
];

// Qiziqarli emojilar to'plami (Stiker va emojilarga javob qaytarish uchun)
const FUN_EMOJIS = ["🔥", "⚡️", "😎", "🚀", "✨", "🤝", "🙌", "⚽️", "🎮", "💡", "🎯", "👏", "🏆"];

function getRandomEmoji() {
  return FUN_EMOJIS[Math.floor(Math.random() * FUN_EMOJIS.length)];
}

// Tizimli Prompt generatsiyasi (Guruh yoki Shaxsiy chat holatiga qarab)
function getSystemPrompt(isGroup = false) {
  const clanCode = getClanCode();

  if (isGroup) {
    return `
Siz Abdullohning (Telegram: @ABDULLOH_ABDUGANIYEV_11, Tel: +998939881477, Bot: @mrx_uzbot) shaxsiy eng tezkor, aqlli va samimiy AI assistentisiz.

GURUHDA ISHLASH QOIDALARI:
1. CLAN KODI: Faqat guruhda so'ralganda faol Clan kodini ayting: "${clanCode}".
2. FOYDALANUVCHILAR SAVOLLARIGA: O'yinlar (DLS, futbol), texnologiya, dasturlash, hayotiy savollar, rasm va fayllar tahlili bo'yicha juda to'liq, chuqur, aniq va chiroyli emojilar bilan javob qaytaring.
3. ABDULLOH HAQIDA: Abdulloh Abdug'aniyev — 14 yoshda, Shahrixon 2-maktab 9-sinf, KING SCHOOL'da Bobur Vahobov (UZMIND) shogirdi, Full-stack dasturchi (Node.js, Telegram botlar, veb-saytlar, AI). Aloqa: @ABDULLOH_ABDUGANIYEV_11 | Tel: +998939881477.
4. Javoblaringiz do'stona, ravon va professional bo'lsin.
`;
  } else {
    return `
Siz Abdullohning (Telegram: @ABDULLOH_ABDUGANIYEV_11, Tel: +998939881477, Bot: @mrx_uzbot) shaxsiy eng tezkor, aqlli va samimiy AI assistentisiz.

SHAXSIY CHAT (DIRECT/BUSINESS) QOIDALARI:
1. MUHIM: Shaxsiy chatlarda Clan kodi haqida UMUMAN gapirmang va Clan kodini tashlamang! Agar clan kodi so'ralsa, "Clan kodi faqat rasmiy guruhimizda beriladi! Guruhda /kod deb yozishingiz mumkin." deb ayting.
2. RASM VA FAYLLAR TAHLILI: Foydalanuvchi qanday rasm (butsi, mashina, texnika, buyum, tabiat) yoki fayl tashlasa, uni sinchiklab ko'rib, u haqida juda to'liq, qiziqarli va professional ma'lumot bering.
3. HAR QANDAY SAVOLGA: To'liq, aniq va chiroyli emojilar bilan sifatli javob qaytaring.
4. ABDULLOH HAQIDA (QISQA): Abdulloh Abdug'aniyev — 14 yoshda, Shahrixon 2-maktab 9-sinf, KING SCHOOL'da Bobur Vahobov (UZMIND) shogirdi, Full-stack dasturchi. Aloqa: @ABDULLOH_ABDUGANIYEV_11 | Tel: +998939881477.
`;
  }
}

// AI javob generatsiya qilish funksiyasi (Matn, Rasm va Fayllar bilan)
async function generateAiResponse(contentPayload, isGroup = false) {
  let lastError = null;
  const prompt = getSystemPrompt(isGroup);

  // Payload matn yoki multipart (rasm/fayl) bo'lishi mumkin
  const contents = Array.isArray(contentPayload) ? contentPayload : [contentPayload];

  for (const modelName of AI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: prompt,
          maxOutputTokens: 600,
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
  return (
    `Assalomu alaykum! Xabaringiz qabul qilindi. 😊\n\n` +
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

// Telegramdan faylni yuklab olib Base64 ga o'girish helperi
async function downloadTelegramFileAsBase64(ctx, fileId) {
  try {
    const fileInfo = await ctx.api.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.file_path}`;
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");
    return {
      base64Data,
      filePath: fileInfo.file_path,
    };
  } catch (err) {
    console.error("[Telegram File Download Error]:", err.message);
    return null;
  }
}

// ==========================================
// 4. TELEGRAM EVENTLARI
// ==========================================

// Business ulanish holati
bot.on("business_connection", (ctx) => {
  console.log(`[Business Connection] Ulanish o'rnatildi! ID: ${ctx.businessConnection.id}`);
});

// Telegram Business xabarlarini qabul qilish (Matn, Rasm, Stiker)
bot.on("business_message", async (ctx) => {
  const fromId = ctx.businessMessage.from?.id;
  const chatId = ctx.businessMessage.chat?.id;
  const messageText = ctx.businessMessage.text;
  const photo = ctx.businessMessage.photo;
  const sticker = ctx.businessMessage.sticker;
  const caption = ctx.businessMessage.caption;
  const senderName = ctx.businessMessage.from?.first_name || "Foydalanuvchi";

  // Agar xabarni Abdulloh o'zi yozgan bo'lsa (fromId !== chatId), bot javob bermaydi
  if (fromId !== chatId) {
    return;
  }

  const stopTyping = startTypingIndicator(ctx, true);

  try {
    // 1. STIKER KELGANDA: Boshqacha stiker/emoji va xabar bilan javob qaytarish
    if (sticker) {
      const emoji = getRandomEmoji();
      await ctx.reply(
        `${emoji} Salom ${senderName}! Sizga qanday yordam bera olaman? Agar biror savolingiz, tahlil qilish uchun rasm yoki faylingiz bo'lsa bemalol yuboring! 😊`,
        {
          business_connection_id: ctx.businessMessage.business_connection_id,
          reply_parameters: {
            message_id: ctx.businessMessage.message_id,
            allow_sending_without_reply: true,
          },
        }
      );
      return;
    }

    // 2. RASM KELGANDA: Rasmni ko'rib, tahlil qilish (Vision)
    if (photo && photo.length > 0) {
      console.log(`[Business Rasm keldi -> ${senderName}]`);
      const highestPhoto = photo[photo.length - 1];
      const downloaded = await downloadTelegramFileAsBase64(ctx, highestPhoto.file_id);

      if (downloaded) {
        const userPrompt = caption || "Ushbu rasmni sinchiklab tahlil qiling. Undagi buyum (masalan: butsi, mashina, kiyim, texnika yoki har qanday narsa) haqida juda to'liq, qiziqarli va professional ma'lumot bering.";
        const payload = [
          {
            inlineData: {
              data: downloaded.base64Data,
              mimeType: "image/jpeg",
            },
          },
          userPrompt,
        ];

        const aiAnswer = await generateAiResponse(payload, false);
        await ctx.reply(aiAnswer, {
          business_connection_id: ctx.businessMessage.business_connection_id,
          reply_parameters: {
            message_id: ctx.businessMessage.message_id,
            allow_sending_without_reply: true,
          },
        });
        return;
      }
    }

    // 3. MATN KELGANDA:
    if (messageText) {
      console.log(`[Business Matn][${senderName}]: ${messageText}`);
      const aiAnswer = await generateAiResponse(messageText, false);

      await ctx.reply(aiAnswer, {
        business_connection_id: ctx.businessMessage.business_connection_id,
        reply_parameters: {
          message_id: ctx.businessMessage.message_id,
          allow_sending_without_reply: true,
        },
      });
    }
  } catch (error) {
    console.error("[Business Error]:", error?.message || error);
  } finally {
    stopTyping();
  }
});

// Maxsus buyruqlar: /start, /about, /kod
bot.command("start", async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const helpText = isGroup
    ? "👋 Assalomu alaykum! Men Abdullohning shaxsiy AI assistentiman.\n\nGuruhda menga Reply qilib savol berishingiz, rasm yoki fayl tashlab tahlil qilishingiz yoki /kod buyrug'i orqali Clan kodini olishingiz mumkin! 🚀"
    : "👋 Assalomu alaykum! Men Abdulloh Abdug'aniyevning shaxsiy aqlli AI assistentiman.\n\nSavollaringiz bo'lsa bemalol yozishingiz, rasm yoki fayl yuborib tahlil qildirishingiz mumkin! 🚀";

  await ctx.reply(helpText, {
    reply_parameters: {
      message_id: ctx.message.message_id,
      allow_sending_without_reply: true,
    },
  });
});

// /kod buyrug'i - Faqat guruhlarda ishlaydi yoki o'rnatiladi
bot.command(["kod", "clankod", "setkod"], async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const text = ctx.message.text.trim();
  const parts = text.split(/\s+/);

  // Agar yangi kod o'rnatilayotgan bo'lsa (/kod 7777)
  if (parts.length > 1) {
    const newCode = parts.slice(1).join(" ");
    setClanCode(newCode);
    await ctx.reply(
      `✅ *Clan kodi muvaffaqiyatli saqlandi!*\n\n` +
      `🔑 *Yangi Clan kodi:* \`${newCode}\`\n\n` +
      `Endi guruhda kimdir kod so'rasa, bot ushbu yangi kodni taqdim etadi! 🔥`,
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

  // Agar shaxsiy chatda /kod deb yozilsa
  if (!isGroup) {
    await ctx.reply(
      `🔒 Clan kodi faqat rasmiy guruhimizda beriladi!\n\nGuruhga kirib \`/kod\` deb yozishingiz yoki guruhda so'rashingiz mumkin. 😊`,
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

  // Guruhda /kod deb yozilsa
  const currentCode = getClanCode();
  await ctx.reply(
    `🎮 *Hozirgi Clan kodi:* \`${currentCode}\`\n\n` +
    `Marhamat, kodingizdan foydalanib clanga qo'shilishingiz mumkin! 🔥\n` +
    `_(Kodni yangilash uchun: \`/kod <yangi_kod>\` deb yozing)_`,
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

// Stiker kelganda (Direct chat yoki Guruhda botga Reply qilinganda)
bot.on("message:sticker", async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const replyTo = ctx.message.reply_to_message;
  const senderId = ctx.from?.id;
  const senderName = ctx.from?.first_name || "Foydalanuvchi";

  if (senderId === ctx.me?.id) return;

  // GURUHDA: Faqat botning xabariga reply qilingan bo'lsa javob beradi!
  if (isGroup && replyTo?.from?.id !== ctx.me?.id) {
    return;
  }

  const stopTyping = startTypingIndicator(ctx, false);

  try {
    const emoji = getRandomEmoji();
    await ctx.reply(
      `${emoji} Salom ${senderName}! Sizga qanday yordam bera olaman? Marhamat, bemalol yozing! 😊`,
      {
        reply_parameters: {
          message_id: ctx.message.message_id,
          allow_sending_without_reply: true,
        },
      }
    );
  } catch (error) {
    console.error("[Sticker Handler Error]:", error?.message || error);
  } finally {
    stopTyping();
  }
});

// Rasm (Photo) kelganda - Vision AI tahlili
bot.on("message:photo", async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const replyTo = ctx.message.reply_to_message;
  const photo = ctx.message.photo;
  const caption = ctx.message.caption || "";
  const botUsername = ctx.me?.username?.toLowerCase() || "mrx_uzbot";
  const senderName = ctx.from?.first_name || "Foydalanuvchi";

  // GURUHDA: Faqat botga reply qilinganda yoki bot mention qilinganda javob beradi
  if (isGroup) {
    const isReplyToBot = replyTo?.from?.id === ctx.me?.id;
    const isMentioned = caption.toLowerCase().includes(`@${botUsername}`);
    if (!isReplyToBot && !isMentioned) {
      return; // Guruhda boshqalarga xalaqit bermaydi
    }
  }

  const stopTyping = startTypingIndicator(ctx, false);

  try {
    console.log(`[Rasm tahlil qilinmoqda -> From: ${senderName}]`);
    const highestPhoto = photo[photo.length - 1];
    const downloaded = await downloadTelegramFileAsBase64(ctx, highestPhoto.file_id);

    if (downloaded) {
      const userPrompt = caption || "Ushbu rasmni sinchiklab tahlil qiling. Undagi buyum (masalan: butsi, mashina, kiyim, texnika yoki har qanday narsa) haqida juda to'liq, qiziqarli, aniq va professional ma'lumot bering.";
      const payload = [
        {
          inlineData: {
            data: downloaded.base64Data,
            mimeType: "image/jpeg",
          },
        },
        userPrompt,
      ];

      const aiAnswer = await generateAiResponse(payload, isGroup);

      await ctx.reply(aiAnswer, {
        reply_parameters: {
          message_id: ctx.message.message_id,
          allow_sending_without_reply: true,
        },
      });

      console.log(`[AI Rasm Tahlil Javob -> ${senderName}]`);
    }
  } catch (error) {
    console.error("[Photo Vision Error]:", error?.message || error);
  } finally {
    stopTyping();
  }
});

// Hujjatlar / Fayllar (Document / Text / Code / PDF) kelganda tahlil qilish
bot.on("message:document", async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const replyTo = ctx.message.reply_to_message;
  const doc = ctx.message.document;
  const caption = ctx.message.caption || "";
  const botUsername = ctx.me?.username?.toLowerCase() || "mrx_uzbot";
  const senderName = ctx.from?.first_name || "Foydalanuvchi";

  if (isGroup) {
    const isReplyToBot = replyTo?.from?.id === ctx.me?.id;
    const isMentioned = caption.toLowerCase().includes(`@${botUsername}`);
    if (!isReplyToBot && !isMentioned) {
      return;
    }
  }

  const stopTyping = startTypingIndicator(ctx, false);

  try {
    console.log(`[Fayl tahlil qilinmoqda: ${doc.file_name} -> From: ${senderName}]`);
    const downloaded = await downloadTelegramFileAsBase64(ctx, doc.file_id);

    if (downloaded) {
      const mime = doc.mime_type || "application/octet-stream";
      const userPrompt = caption || `Ushbu "${doc.file_name || 'fayl'}" faylini ko'rib chiqib, uning mazmuni haqida to'liq, tushunarli va professional tahlil bering.`;

      const payload = [
        {
          inlineData: {
            data: downloaded.base64Data,
            mimeType: mime.startsWith("image/") ? mime : "application/pdf",
          },
        },
        userPrompt,
      ];

      const aiAnswer = await generateAiResponse(payload, isGroup);

      await ctx.reply(aiAnswer, {
        reply_parameters: {
          message_id: ctx.message.message_id,
          allow_sending_without_reply: true,
        },
      });

      console.log(`[AI Fayl Tahlil Javob -> ${senderName}]`);
    }
  } catch (error) {
    console.error("[Document Analysis Error]:", error?.message || error);
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
  const replyTo = ctx.message?.reply_to_message;
  const botUsername = ctx.me?.username?.toLowerCase() || "mrx_uzbot";

  if (senderId === ctx.me?.id) {
    return;
  }

  // GURUHDA:
  // "guruhda odamlar bir biri bilan yozganda bot hech qachon yozmasin, qachonki botning habariga reply qilganimizda javob yozsin"
  if (isGroup) {
    const isReplyToBot = replyTo && replyTo.from?.id === ctx.me?.id;
    const isMentioned = messageText.toLowerCase().includes(`@${botUsername}`);

    // Agar botning xabariga reply qilinmagan bo'lsa va bot mention qilinmagan bo'lsa: BOT JIM TURADI!
    if (!isReplyToBot && !isMentioned) {
      return;
    }
  }

  const chatContextTitle = isGroup ? `[Guruh: ${ctx.chat.title}]` : "[Direct]";
  console.log(`>>> ${chatContextTitle}[${senderName}]: "${messageText}" ga javob tayyorlanmoqda...`);

  const stopTyping = startTypingIndicator(ctx, false);

  try {
    let promptInput = "";

    if (isGroup) {
      const repliedText = replyTo?.text || replyTo?.caption || "[Bot Xabari]";
      promptInput = `Guruh nomi: "${ctx.chat.title}".\nBotning avvalgi xabari: "${repliedText}"\nFoydalanuvchi (${senderName}) botga reply qilib yozdi: "${messageText}".\nFoydalanuvchining savoliga mos, to'liq, qiziqarli, aniq va xushmuomala javob qaytaring.`;
    } else {
      promptInput = messageText;
    }

    const aiAnswer = await generateAiResponse(promptInput, isGroup);

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
    const aiAnswer = await generateAiResponse(postText, true);
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