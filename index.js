import { Bot, InlineKeyboard, GrammyError, HttpError } from "grammy";
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
// 4. INTERAKTIV MUSIQA QIDIRUV & RO'YXAT TIZIMI (4-5 ta tanlov)
// ==========================================
const musicCache = new Map();

// Keshni tozalab turish (1 soatdan eski qidiruvlarni tozalaydi)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of musicCache.entries()) {
    if (now - val.createdAt > 3600000) {
      musicCache.delete(key);
    }
  }
}, 600000);

// Musiqa qidiruvchi (Deezer & iTunes API orqali 4-5 ta trek)
async function searchMusicList(query) {
  const cleanQ = query.trim();
  const results = [];

  // 1. Deezer API
  try {
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(cleanQ)}&limit=5`);
    const data = await res.json();
    if (data && data.data && Array.isArray(data.data)) {
      for (const t of data.data) {
        if (t.preview) {
          results.push({
            id: t.id,
            title: t.title,
            artist: t.artist?.name || "Noma'lum ijrochi",
            audioUrl: t.preview,
            duration: t.duration,
          });
        }
      }
    }
  } catch (e) {
    console.error("Deezer search error:", e.message);
  }

  // 2. iTunes API (Agar Deezer kam topsa)
  if (results.length < 3) {
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanQ)}&media=music&limit=5`);
      const data = await res.json();
      if (data && data.results && Array.isArray(data.results)) {
        for (const t of data.results) {
          if (t.previewUrl && !results.some((r) => r.title.toLowerCase() === t.trackName.toLowerCase())) {
            results.push({
              id: t.trackId,
              title: t.trackName,
              artist: t.artistName || "Noma'lum ijrochi",
              audioUrl: t.previewUrl,
              duration: 30,
            });
          }
        }
      }
    } catch (e) {
      console.error("iTunes search error:", e.message);
    }
  }

  return results.slice(0, 5);
}

// Musiqa ro'yxatini chiqarish va tanlash tugmalarini yasash
async function sendInteractiveMusicMenu(ctx, queryText, isBusiness = false) {
  const tracks = await searchMusicList(queryText);

  if (!tracks || tracks.length === 0) {
    const notFoundText = `😔 Kechirasiz, *"${queryText}"* bo'yicha hech qanday musiqa topilmadi. Qo'shiqchi yoki musiqa nomini aniqroq yozib ko'ring! 🎧`;
    if (isBusiness) {
      await ctx.reply(notFoundText, {
        business_connection_id: ctx.businessMessage?.business_connection_id,
        parse_mode: "Markdown",
      });
    } else {
      await ctx.reply(notFoundText, {
        parse_mode: "Markdown",
        reply_parameters: {
          message_id: ctx.message?.message_id,
          allow_sending_without_reply: true,
        },
      });
    }
    return;
  }

  // Qidiruv natijasini keshga saqlash
  const searchId = Math.random().toString(36).substring(2, 8);
  musicCache.set(searchId, { tracks, createdAt: Date.now() });

  // Xabar matni
  let menuText = `🎧 *"${queryText}" bo'yicha topilgan qo'shiqlar:*\n\n`;
  tracks.forEach((t, i) => {
    menuText += `${i + 1}️⃣ *${t.title}* — _${t.artist}_\n`;
  });
  menuText += `\n👇 *Eshitmoqchi bo'lgan qo'shig'ingiz ustiga bosing:*`;

  // Inline tugmalar (Har bir qo'shiq uchun alohida tugma)
  const keyboard = new InlineKeyboard();
  tracks.forEach((t, i) => {
    const shortTitle = t.title.length > 20 ? t.title.substring(0, 20) + "..." : t.title;
    const shortArtist = t.artist.length > 15 ? t.artist.substring(0, 15) + "..." : t.artist;
    keyboard.text(`${i + 1}️⃣ ${shortTitle} (${shortArtist})`, `mus:${searchId}:${i}`).row();
  });

  if (isBusiness) {
    // Business chatlarda birinchi trekni to'g'ridan-to'g'ri tashlaymiz + ro'yxat
    const topTrack = tracks[0];
    try {
      await ctx.replyWithAudio(topTrack.audioUrl, {
        title: topTrack.title,
        performer: topTrack.artist,
        caption: `🎵 *${topTrack.title}* — ${topTrack.artist}\n\n🎧 Qidiruv: "${queryText}"`,
        parse_mode: "Markdown",
        business_connection_id: ctx.businessMessage?.business_connection_id,
      });
    } catch (e) {}
  } else {
    await ctx.reply(menuText, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
      reply_parameters: {
        message_id: ctx.message?.message_id,
        allow_sending_without_reply: true,
      },
    });
  }
}

// ==========================================
// 5. AI RASM GENERATSIYASI SO'ROVINI ANIQLASH
// ==========================================

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

function extractImagePrompt(text) {
  let p = text.trim();
  p = p.replace(/^\/(image|rasm|draw)\s*/i, "");
  p = p.replace(/(menga|iltimos|qani)?\s*(rasm\s*yaratib\s*ber|rasm\s*chizib\s*ber|rasmini\s*chiz|rasmini\s*yarat|rasm\s*qilib\s*ber|rasm\s*chiqarib\s*ber)/gi, "");
  p = p.replace(/[:\-]/g, " ").trim();
  return p || "beautiful aesthetic high quality 4k wallpaper";
}

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
    t.includes("qoshiq tashla") ||
    t.includes("bu qoshiqni top") ||
    t.includes("bu qo'shiqni top")
  );
}

function extractMusicQuery(text) {
  let q = text.trim();
  q = q.replace(/^\/(music|musiqa|mp3|song)\s*/i, "");
  q = q.replace(/(menga|iltimos)?\s*(bu\s*)?(musiqa\s*topib\s*ber|qo'shiq\s*topib\s*ber|qoshiq\s*topib\s*ber|musiqasini\s*top|qo'shig'ini\s*top|mp3\s*top|musiqa\s*tashla|qo'shiq\s*tashla)/gi, "");
  q = q.replace(/[:\-]/g, " ").trim();
  return q;
}

// ==========================================
// 6. TIZIMLI PROMPT & AI JAVOB GENERATSIYASI
// ==========================================

function getSystemPrompt(isGroup = false) {
  const clanCode = getClanCode();

  if (isGroup) {
    return `
Siz Telegram guruhida xushmuomala, o'ta tezkor, aqlli va bilimdon yordamchisiz.

GURUH QOIDALARI:
1. CLAN KODI: Faqat guruh a'zolari so'raganida faol Clan kodini ayting: "${clanCode}".
2. O'ZBEKISTON BOZORLARIDAGI NARXLAR VA DO'KONLAR (RASM VA MAHSULOTLARGA):
   - Agar foydalanuvchi rasm yoki matn yuborib narxi yoki qayerdan olishni so'rasa ("narxi qancha", "qancha turadi", "qayerdan topsa bo'ladi", "qayerda sotiladi"):
     * 🏷 Mahsulotning aniq nomi va modeli
     * 💰 O'zbekiston bozorlaridagi real taxminiy narxi (so'mda va dollarda)
     * 📍 O'zbekistonda qayerda sotilishi (Uzum Market, OLX.uz, Abu Sahiy, Malika bozori, Asaxiy, Texnomart, Avtoelon va h.k.)
     * 🔗 Xarid qidiruv havolalari (masalan: Uzum Market: https://uzum.uz/uz/search?q=..., OLX: https://www.olx.uz/d/oz/q-.../)
3. MA'LUMOT BERISH: Agar ma'lumot so'ralsa, qisqa, aniq, tushunarli va lo'nda qilib, asosiy jihatlarini emojilar bilan yoritib bering.
4. EGASI HAQIDA (Faqat so'ralganda): Egasi — 14 yoshda, Andijon Shahrixon 2-maktab 9-sinf, KING SCHOOL'da Bobur Vahobov (UZMIND) o'quvchisi, dasturchi. Telefon raqamlarini bermang!
5. MULOQOT: Xuddi haqiqiy do'stona insondek samimiy va jonli gaplashing.
`;
  } else {
    return `
Siz shaxsiy chatda xuddi haqiqiy do'stdek samimiy, juda aqlli, o'ta tezkor va bilimdon inson sifatida gaplashuvchi yordamchisiz.

SHAXSIY CHAT QOIDALARI (MUHIM):
1. CLAN KODI HAQIDA UMUMAN GAPIRMANG: Shaxsiy chatlarda Clan kodi haqida hech narsa yozmang va "guruhdan olasiz" degan gaplarni ham mutlaqo ishlatmang.
2. ISMNI DOIMIY TAKRORLAMANG: Har gapda "Men falonchining assistentiman" deb robotdek gapirmang. Haqiqiy inson suhbatlashayotgandek tabiiy gaplashing.
3. O'ZBEKISTON BOZORLARIDAGI NARXLAR VA DO'KONLAR (RASM VA MAHSULOTLARGA):
   - Agar foydalanuvchi rasm (masalan: butsi, mashina, kiyim, texnika, telefon) yoki matn yuborib narxi/qayerdan olishni so'rasa ("narxi qancha", "qancha turadi", "qayerdan topsa bo'ladi", "qayerda sotiladi"):
     * 🏷 Mahsulotning aniq nomi va markasi
     * 💰 O'zbekistondagi real o'rtacha narxi (so'mda va dollarda)
     * 📍 O'zbekistonda qayerdan topish mumkinligi (Uzum Market, OLX.uz, Abu Sahiy, Malika bozori, Chorsu, Asaxiy, Texnomart, Avtoelon va h.k.)
     * 🔗 To'g'ridan-to'g'ri qidiruv havolalari:
       - Uzum Market: https://uzum.uz/uz/search?q={nomi}
       - OLX.uz: https://www.olx.uz/d/oz/q-{nomi}/
       - Asaxiy: https://asaxiy.uz/product?key={nomi}
4. MA'LUMOT SO'RASHSA: U haqida qisqacha, aniq, tushunarli va lo'nda qilib barcha muhim xususiyatlarini yozing.
5. EGASI HAQIDA (Faqat so'ralgandagina): Egasi — 14 yoshda, Andijon viloyati Shahrixon tumani 2-maktab 9-sinf o'quvchisi hamda KING SCHOOL'da Bobur Vahobov (UZMIND) shogirdi, dasturchi. Telefon raqamlarini bermang!
6. DO'STONA RUH: Foydalanuvchi bilan o'ta samimiy, do'stona va tezkor muloqot qiling.
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
// 7. TELEGRAM CALLBACK QUERY (Qo'shiq tanlanganda)
// ==========================================
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith("mus:")) {
    const [, searchId, indexStr] = data.split(":");
    const index = parseInt(indexStr, 10);
    const cached = musicCache.get(searchId);

    if (!cached || !cached.tracks || !cached.tracks[index]) {
      await ctx.answerCallbackQuery({ text: "⚠️ Ushbu qo'shiq muddati o'tgan. Iltimos, qayta qidiring." });
      return;
    }

    const track = cached.tracks[index];
    await ctx.answerCallbackQuery({ text: `🎵 "${track.title}" yuklanmoqda...` });

    try {
      await ctx.replyWithAudio(track.audioUrl, {
        title: track.title,
        performer: track.artist,
        caption: `🎵 *${track.title}* — ${track.artist}\n\nMarhamat, musiqani tinglashingiz mumkin! 🎧✨`,
        parse_mode: "Markdown",
        reply_parameters: {
          message_id: ctx.callbackQuery.message?.message_id,
          allow_sending_without_reply: true,
        },
      });
    } catch (err) {
      console.error("Callback Audio Reply Error:", err.message);
      await ctx.reply(`🎵 *${track.title}* — ${track.artist}\n\nEshitish uchun havola: ${track.audioUrl}`);
    }
  }
});

// ==========================================
// 8. TELEGRAM EVENTLARI
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
        const userPrompt = caption || "Ushbu rasmni sinchiklab ko'rib chiqing. Undagi buyum (masalan: butsi, mashina, kiyim, texnika, telefon yoki buyum) haqida juda to'liq, narxlari va sotiladigan joylari bilan ma'lumot bering.";
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
      const replyTo = ctx.businessMessage.reply_to_message;

      // A) Agar avvalgi rasmga REPLY qilib yozilgan bo'lsa (Vision follow-up)
      if (replyTo && replyTo.photo && replyTo.photo.length > 0) {
        console.log(`[Business Rasmga Reply -> ${senderName}]: "${messageText}"`);
        const highestPhoto = replyTo.photo[replyTo.photo.length - 1];
        const downloaded = await downloadTelegramFileAsBase64(ctx, highestPhoto.file_id);

        if (downloaded) {
          const userPrompt = `Foydalanuvchi ushbu rasmga reply qilib quyidagicha yozdi/so'radi: "${messageText}".\nIltimos, rasmni sinchiklab ko'rib, foydalanuvchining savoliga juda to'liq, narxlari va sotilish joylari bilan javob bering.`;
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

      // B) Rasm yaratish so'rovi bo'lsa
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

      // C) Musiqa qidirish so'rovi bo'lsa (4-5 ta ro'yxat)
      if (isMusicRequest(messageText)) {
        const musicQuery = extractMusicQuery(messageText);
        if (musicQuery) {
          await sendInteractiveMusicMenu(ctx, musicQuery, true);
          return;
        }
      }

      // D) Oddiy matnli savol bo'lsa (To'liq javob)
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
      const userPrompt = caption || "Ushbu rasmni sinchiklab ko'rib chiqing. Undagi buyum (masalan: butsi, mashina, kiyim, texnika yoki buyum) haqida JUDA TO'LIQ, narxlari va O'zbekistonda qayerda sotilishi bilan ma'lumot bering.";
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
  // Faqat botning xabariga reply qilinganda, rasmga reply qilinganda yoki bot mention qilinganda javob beradi!
  if (isGroup) {
    const isReplyToBot = replyTo && replyTo.from?.id === ctx.me?.id;
    const isReplyToPhoto = replyTo && replyTo.photo && replyTo.photo.length > 0;
    const isMentioned = messageText.toLowerCase().includes(`@${botUsername}`);

    if (!isReplyToBot && !isMentioned && !isReplyToPhoto) {
      return; // Guruhdagi boshqa suhbatlarga mutlaqo aralashmaydi
    }
  }

  const chatContextTitle = isGroup ? `[Guruh: ${ctx.chat.title}]` : "[Direct]";
  console.log(`>>> ${chatContextTitle}[${senderName}]: "${messageText}"`);

  const stopTyping = startTypingIndicator(ctx, false);

  try {
    // 1. Agar avvalgi rasmga REPLY qilib yozilgan bo'lsa (Vision follow-up)
    if (replyTo && replyTo.photo && replyTo.photo.length > 0) {
      console.log(`[Rasmga Reply qilindi -> ${senderName}]: "${messageText}"`);
      const highestPhoto = replyTo.photo[replyTo.photo.length - 1];
      const downloaded = await downloadTelegramFileAsBase64(ctx, highestPhoto.file_id);

      if (downloaded) {
        const userPrompt = `Foydalanuvchi ushbu rasmga reply qilib quyidagicha yozdi/so'radi: "${messageText}".\nIltimos, rasmni sinchiklab ko'rib, foydalanuvchining savoliga juda to'liq, narxlari va sotilish joylari bilan javob bering.`;
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
        return;
      }
    }

    // 2. Rasm yaratish so'rovi bo'lsa
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

    // 3. Musiqa qidirish so'rovi bo'lsa (4-5 ta ro'yxat va tanlash tugmalari)
    if (isMusicRequest(messageText)) {
      const musicQuery = extractMusicQuery(messageText);
      if (musicQuery) {
        await sendInteractiveMusicMenu(ctx, musicQuery, false);
        return;
      }
    }

    // 4. Oddiy matnli savollar va suhbatlar (To'liq, chuqur va aniq javob)
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
// 9. CRASH VA XATOLIKLARDAN HIMOYA (24/7 Barqarorlik)
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
// 10. BOTNI ISHGA TUSHIRISH (Auto-reconnect loop)
// ==========================================
console.log("==========================================");
console.log(" Telegram AI Bot 24/7 tizimi ishga tushmoqda...");
console.log("==========================================");

bot.start({
  onStart: (botInfo) => {
    console.log(`[Bot Online] @${botInfo.username} muvaffaqiyatli ishga tushdi!`);
  },
  drop_pending_updates: true,
  allowed_updates: ["message", "business_message", "business_connection", "channel_post", "callback_query"],
});