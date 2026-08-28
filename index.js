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
    message: "Telegram AI Avto-javob boti 24/7 faol ishlamoqda!",
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
const FUN_EMOJIS = ["🔥", "⚡️", "😎", "🚀", "✨", "🤝", "🙌", "⚽️", "🎮", "💡", "🎯", "👏", "🏆", "🎧", "🎨"];

function getRandomEmoji() {
  return FUN_EMOJIS[Math.floor(Math.random() * FUN_EMOJIS.length)];
}

// ==========================================
// 4. AI RASM GENERATSIYASI & MUSIQA QIDIRUV FUNKSIYALARI
// ==========================================

// Rasm yaratish so'rovini aniqlash
function isImageRequest(text) {
  if (!text) return false;
  const t = text.toLowerCase().trim();
  return (
    t.startsWith("/image") ||
    t.startsWith("/rasm") ||
    t.startsWith("/draw") ||
    t.includes("rasm yarat") ||
    t.includes("rasm chiz") ||
    t.includes("rasmini chiz") ||
    t.includes("rasmini yarat") ||
    t.includes("rasm qilib ber") ||
    t.includes("rasm chiqar")
  );
}

// Rasm matnini tozalash (Prompt)
function extractImagePrompt(text) {
  let p = text.trim();
  p = p.replace(/^\/(image|rasm|draw)\s*/i, "");
  p = p.replace(/(menga|iltimos|qani)?\s*(rasm\s*yaratib\s*ber|rasm\s*chizib\s*ber|rasmini\s*chiz|rasmini\s*yarat|rasm\s*qilib\s*ber|rasm\s*chiqarib\s*ber)/gi, "");
  p = p.replace(/[:\-]/g, " ").trim();
  return p || "beautiful aesthetic high quality 4k wallpaper";
}

// Musiqa qidirish so'rovini aniqlash
function isMusicRequest(text) {
  if (!text) return false;
  const t = text.toLowerCase().trim();
  return (
    t.startsWith("/music") ||
    t.startsWith("/musiqa") ||
    t.startsWith("/mp3") ||
    t.startsWith("/song") ||
    t.includes("musiqa top") ||
    t.includes("qo'shiq top") ||
    t.includes("qoshiq top") ||
    t.includes("musiqasini top") ||
    t.includes("qo'shig'ini top") ||
    t.includes("mp3 top") ||
    t.includes("musiqa tashla") ||
    t.includes("qo'shiq tashla") ||
    t.includes("qoshiq tashla")
  );
}

// Musiqa nomini tozalash (Query)
function extractMusicQuery(text) {
  let q = text.trim();
  q = q.replace(/^\/(music|musiqa|mp3|song)\s*/i, "");
  q = q.replace(/(menga|iltimos)?\s*(musiqa\s*topib\s*ber|qo'shiq\s*topib\s*ber|qoshiq\s*topib\s*ber|musiqasini\s*top|qo'shig'ini\s*top|mp3\s*top|musiqa\s*tashla|qo'shiq\s*tashla)/gi, "");
  q = q.replace(/[:\-]/g, " ").trim();
  return q;
}

// Musiqa qidiruvchi (Deezer & iTunes API)
async function searchMusic(query) {
  try {
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`);
    const data = await res.json();
    if (data && data.data && data.data.length > 0) {
      const track = data.data[0];
      return {
        title: track.title,
        artist: track.artist?.name || "Noma'lum ijrochi",
        audioUrl: track.preview,
        duration: track.duration,
      };
    }
  } catch (e) {
    console.error("Deezer search error:", e.message);
  }

  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=3`);
    const data = await res.json();
    if (data && data.results && data.results.length > 0) {
      const track = data.results[0];
      return {
        title: track.trackName,
        artist: track.artistName,
        audioUrl: track.previewUrl,
        duration: 30,
      };
    }
  } catch (e) {
    console.error("iTunes search error:", e.message);
  }

  return null;
}

// ==========================================
// 5. TIZIMLI PROMPT & AI JAVOB GENERATSIYASI
// ==========================================

function getSystemPrompt(isGroup = false) {
  const clanCode = getClanCode();

  if (isGroup) {
    return `
Siz Telegram guruhida xushmuomala, aqlli va bilimdon yordamchisiz.

GURUH QOIDALARI:
1. CLAN KODI: Faqat guruh a'zolari so'raganida faol Clan kodini ayting: "${clanCode}".
2. BATAFSIL MA'LUMOT: Foydalanuvchi qanday savol bermasin (sport, o'yinlar masalan DLS, dasturlash, kino, texnologiya, rasm/fayl tahlili), savolga juda TO'LIQ, CHUQUR, TUSHUNARLI, QIZIQARLI va chiroyli emojilar bilan sifatli javob bering. Qisqa qilib tashlamang!
3. EGALIK MA'LUMOTI (Agar so'ralsa): Egasi — 14 yoshli dasturchi (Andijon, Shahrixon 2-maktab 9-sinf, KING SCHOOL'da Bobur Vahobov (UZMIND) o'quvchisi). Telefon raqamlarini bermang!
4. MULOQOT: Xuddi haqiqiy do'stona insondek samimiy va jonli gaplashing.
`;
  } else {
    return `
Siz shaxsiy chatda xuddi haqiqiy do'stdek samimiy, juda aqlli, bilimdon va chaqqon inson sifatida gaplashuvchi yordamchisiz.

SHAXSIY CHAT QOIDALARI (MUHIM):
1. CLAN KODI HAQIDA UMUMAN GAPIRMANG: Shaxsiy chatlarda Clan kodi haqida hech narsa yozmang va "guruhdan olasiz" degan gaplarni ham umuman ishlatmang.
2. ISMNI DOIMIY TAKRORLAMANG: Har gapda "Men falonchining assistentiman" deb robotdek takrorlamang. Xuddi haqiqiy inson suhbatlashayotgandek tabiiy gaplashing.
3. BATAFSIL VA TO'LIQ MA'LUMOT BERISH: Foydalanuvchi har qanday mavzuda savol bersa yoki rasm/fayl yuborsa (butsi, mashina, buyum, texnika, dasturlash va h.k.), unga yuzaki emas, balki JUDA TO'LIQ, KENG, CHUQUR, TUSHUNARLI va mos emojilar bilan boyitilgan holda javob bering.
4. EGASI HAQIDA (Faqat so'ralgandagina): Egasi — 14 yoshda, Andijon viloyati Shahrixon tumani 2-maktab 9-sinf o'quvchisi hamda KING SCHOOL'da Bobur Vahobov (UZMIND) shogirdi, Full-stack dasturchi. Telefon raqami yoki shaxsiy kontaktlarini bermang!
5. DO'STONA RUH: Foydalanuvchi bilan o'ta samimiy, hurmatli va qiziqarli muomala qiling.
`;
  }
}

// AI javob generatsiya qilish funksiyasi (Ultra-detailed & Fast)
async function generateAiResponse(contentPayload, isGroup = false) {
  let lastError = null;
  const prompt = getSystemPrompt(isGroup);
  const contents = Array.isArray(contentPayload) ? contentPayload : [contentPayload];

  for (const modelName of AI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: prompt,
          maxOutputTokens: 1500,
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
  return "Salom! Xabaringizni oldim. Hozir bir oz bandroq edim, tez orada to'liqroq javob yozaman! 😊";
}

// Typing holatini ko'rsatish
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

// Faylni Telegramdan yuklab olib Base64 ga aylantirish
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
// 6. TELEGRAM EVENTLARI
// ==========================================

// Business ulanish holati
bot.on("business_connection", (ctx) => {
  console.log(`[Business Connection] Ulanish o'rnatildi! ID: ${ctx.businessConnection.id}`);
});

// Telegram Business xabarlarini qabul qilish
bot.on("business_message", async (ctx) => {
  const fromId = ctx.businessMessage.from?.id;
  const chatId = ctx.businessMessage.chat?.id;
  const messageText = ctx.businessMessage.text;
  const photo = ctx.businessMessage.photo;
  const sticker = ctx.businessMessage.sticker;
  const caption = ctx.businessMessage.caption;
  const senderName = ctx.businessMessage.from?.first_name || "Do'stim";

  // Agar xabarni o'zi yozgan bo'lsa (chiquvchi xabar), bot javob bermaydi
  if (fromId !== chatId) {
    return;
  }

  const stopTyping = startTypingIndicator(ctx, true);

  try {
    // 1. STIKER KELGANDA: Boshqacha emoji va samimiy xabar bilan javob
    if (sticker) {
      const emoji = getRandomEmoji();
      await ctx.reply(
        `${emoji} Salom ${senderName}! Qandaysiz? Sizga qanday yordam bera olaman? Biror savol, rasm, musiqa yoki tahlil kerak bo'lsa bemalol yozing! 😊`,
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

    // 2. RASM KELGANDA: Rasmni ko'rib to'liq tahlil qilish (Vision AI)
    if (photo && photo.length > 0) {
      console.log(`[Business Rasm keldi -> ${senderName}]`);
      const highestPhoto = photo[photo.length - 1];
      const downloaded = await downloadTelegramFileAsBase64(ctx, highestPhoto.file_id);

      if (downloaded) {
        const userPrompt = caption || "Ushbu rasmni sinchiklab ko'rib chiqing. Undagi buyum (masalan: butsi, mashina, kiyim, texnika, odam yoki buyum) haqida JUDA TO'LIQ, qiziqarli, aniq va professional ma'lumot bering.";
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
      // A) Rasm yaratish so'rovi bo'lsa
      if (isImageRequest(messageText)) {
        const promptText = extractImagePrompt(messageText);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=1024&height=1024&nologo=true`;

        try {
          await ctx.replyWithPhoto(imageUrl, {
            caption: `🎨 *Siz so'ragan rasm:* _${promptText}_\n\nMarhamat! Yana boshqa rasm kerak bo'lsa bemalol ayting. ✨`,
            parse_mode: "Markdown",
            business_connection_id: ctx.businessMessage.business_connection_id,
            reply_parameters: {
              message_id: ctx.businessMessage.message_id,
              allow_sending_without_reply: true,
            },
          });
          return;
        } catch (imgErr) {
          console.error("Image reply error:", imgErr.message);
        }
      }

      // B) Musiqa qidirish so'rovi bo'lsa
      if (isMusicRequest(messageText)) {
        const musicQuery = extractMusicQuery(messageText);
        if (musicQuery) {
          const track = await searchMusic(musicQuery);
          if (track && track.audioUrl) {
            try {
              await ctx.replyWithAudio(track.audioUrl, {
                title: track.title,
                performer: track.artist,
                caption: `🎵 *${track.title}* — ${track.artist}\n\nMarhamat, musiqani tinglashingiz mumkin! 🎧✨`,
                parse_mode: "Markdown",
                business_connection_id: ctx.businessMessage.business_connection_id,
                reply_parameters: {
                  message_id: ctx.businessMessage.message_id,
                  allow_sending_without_reply: true,
                },
              });
              return;
            } catch (audioErr) {
              console.error("Audio reply error:", audioErr.message);
            }
          }
        }
      }

      // C) Oddiy matnli savol bo'lsa (To'liq javob)
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
    ? "👋 Assalomu alaykum!\n\nGuruhda menga Reply qilib istalgan savolingizni berishingiz, rasm/fayl tashlab tahlil qildirishingiz, rasm chizdirishingiz, musiqa so'rashingiz yoki /kod buyrug'i orqali Clan kodini olishingiz mumkin! 🚀"
    : "👋 Assalomu alaykum!\n\nIstalgan mavzuda savollaringiz bo'lsa bemalol yozing, rasm yoki fayl yuborib to'liq tahlil qildiring, AI orqali rasm chizdiring yoki musiqa so'rang! 🚀";

  await ctx.reply(helpText, {
    reply_parameters: {
      message_id: ctx.message.message_id,
      allow_sending_without_reply: true,
    },
  });
});

// /kod buyrug'i - Faqat guruhda ishlaydi yoki o'rnatiladi
bot.command(["kod", "clankod", "setkod"], async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const text = ctx.message.text.trim();
  const parts = text.split(/\s+/);

  // Agar yangi kod kiritilayotgan bo'lsa (/kod 7777)
  if (parts.length > 1) {
    const newCode = parts.slice(1).join(" ");
    setClanCode(newCode);
    await ctx.reply(
      `✅ *Clan kodi muvaffaqiyatli saqlandi!*\n\n` +
      `🔑 *Yangi Clan kodi:* \`${newCode}\`\n\n` +
      `Endi guruhda kimdir kod so'rasa, ushbu kod taqdim etiladi! 🔥`,
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

  // Shaxsiy chatda /kod yozilsa (Chatda clan kodi aytilmaydi)
  if (!isGroup) {
    await ctx.reply("Bu buyruq faqat rasmiy guruhda ishlaydi. 😊", {
      reply_parameters: {
        message_id: ctx.message.message_id,
        allow_sending_without_reply: true,
      },
    });
    return;
  }

  // Guruhda /kod yozilsa
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
`👨‍💻 *Abdulloh Abdug'aniyev haqida:*

👤 *Yoshi:* 14 yoshda
📍 *Manzil:* Andijon viloyati, Shahrixon tumani
🏫 *Maktab:* 2-maktab, 9-sinf
🎓 *IT Ta'limi:* KING SCHOOL (*Bobur Vahobov / UZMIND* o'quvchisi)
🚀 *Mutaxassisligi:* Full-Stack dasturchi (Node.js, Botlar, Veb-saytlar, AI)

_Savollaringiz bo'lsa bemalol yozishingiz mumkin!_ ✨`;

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
  const senderName = ctx.from?.first_name || "Do'stim";

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
      return;
    }
  }

  const stopTyping = startTypingIndicator(ctx, false);

  try {
    console.log(`[Rasm tahlil qilinmoqda -> From: ${senderName}]`);
    const highestPhoto = photo[photo.length - 1];
    const downloaded = await downloadTelegramFileAsBase64(ctx, highestPhoto.file_id);

    if (downloaded) {
      const userPrompt = caption || "Ushbu rasmni sinchiklab ko'rib chiqing. Undagi buyum (masalan: butsi, mashina, kiyim, texnika yoki buyum) haqida JUDA TO'LIQ, qiziqarli, aniq va professional ma'lumot bering.";
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
  const senderName = ctx.from?.first_name || "Do'stim";
  const messageText = ctx.message.text;
  const replyTo = ctx.message?.reply_to_message;
  const botUsername = ctx.me?.username?.toLowerCase() || "mrx_uzbot";

  if (senderId === ctx.me?.id) {
    return;
  }

  // GURUHDA:
  // Faqat botning xabariga reply qilinganda yoki bot mention qilinganda javob beradi!
  if (isGroup) {
    const isReplyToBot = replyTo && replyTo.from?.id === ctx.me?.id;
    const isMentioned = messageText.toLowerCase().includes(`@${botUsername}`);

    if (!isReplyToBot && !isMentioned) {
      return; // Guruhdagi boshqa suhbatlarga mutlaqo aralashmaydi
    }
  }

  const chatContextTitle = isGroup ? `[Guruh: ${ctx.chat.title}]` : "[Direct]";
  console.log(`>>> ${chatContextTitle}[${senderName}]: "${messageText}"`);

  const stopTyping = startTypingIndicator(ctx, false);

  try {
    // 1. Rasm yaratish so'rovi bo'lsa
    if (isImageRequest(messageText)) {
      const promptText = extractImagePrompt(messageText);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=1024&height=1024&nologo=true`;

      try {
        await ctx.replyWithPhoto(imageUrl, {
          caption: `🎨 *Siz so'ragan rasm:* _${promptText}_\n\nMarhamat! Yana boshqa rasm kerak bo'lsa bemalol ayting. ✨`,
          parse_mode: "Markdown",
          reply_parameters: {
            message_id: ctx.message.message_id,
            allow_sending_without_reply: true,
          },
        });
        return;
      } catch (imgErr) {
        console.error("Direct Image reply error:", imgErr.message);
      }
    }

    // 2. Musiqa qidirish so'rovi bo'lsa
    if (isMusicRequest(messageText)) {
      const musicQuery = extractMusicQuery(messageText);
      if (musicQuery) {
        const track = await searchMusic(musicQuery);
        if (track && track.audioUrl) {
          try {
            await ctx.replyWithAudio(track.audioUrl, {
              title: track.title,
              performer: track.artist,
              caption: `🎵 *${track.title}* — ${track.artist}\n\nMarhamat, musiqani tinglashingiz mumkin! 🎧✨`,
              parse_mode: "Markdown",
              reply_parameters: {
                message_id: ctx.message.message_id,
                allow_sending_without_reply: true,
              },
            });
            return;
          } catch (audioErr) {
            console.error("Direct Audio reply error:", audioErr.message);
          }
        }
      }
    }

    // 3. Oddiy matnli savollar va suhbatlar (To'liq, chuqur va aniq javob)
    let promptInput = "";
    if (isGroup) {
      const repliedText = replyTo?.text || replyTo?.caption || "[Bot Xabari]";
      promptInput = `Guruh nomi: "${ctx.chat.title}".\nBotning avvalgi xabari: "${repliedText}"\nFoydalanuvchi (${senderName}) botga reply qilib yozdi: "${messageText}".\nFoydalanuvchining savoliga mos, juda to'liq, qiziqarli, aniq va xushmuomala javob qaytaring.`;
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

    console.log(`[AI Javob -> ${senderName}]: ${aiAnswer.substring(0, 80)}...`);
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
// 7. CRASH VA XATOLIKLARDAN HIMOYA (24/7 Barqarorlik)
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
// 8. BOTNI ISHGA TUSHIRISH (Auto-reconnect loop)
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