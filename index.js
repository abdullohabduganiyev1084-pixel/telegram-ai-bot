import { Bot, InlineKeyboard, GrammyError, HttpError } from "grammy";
import { GoogleGenAI } from "@google/genai";
import express from "express";
import fs from "fs";
import path from "path";
import "dotenv/config";

// ==========================================
// 1. EXPRESS WEB SERVER (24/7 Cloud & Admin WebApp)
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;
const startTime = new Date();

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

// Asosiy sahifa va WebApp yo'llari (Barchasida Admin Mini App ochiladi)
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "admin.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "admin.html"));
});

app.get("/webapp", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "admin.html"));
});

app.get("/ping", (req, res) => {
  res.status(200).send("PONG - 24/7 Server Active");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: Date.now() });
});

// Admin Dashboard API
app.get("/api/status", async (req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  let botName = "MRX_UZ";
  let botDescription = "";
  try {
    const nameObj = await bot.api.getMyName();
    botName = nameObj?.name || botName;
    const descObj = await bot.api.getMyDescription();
    botDescription = descObj?.description || "";
  } catch (e) {}

  res.json({
    status: "online",
    bot: "@mrx_uzbot",
    bot_name: botName,
    bot_description: botDescription,
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    clan_code: getClanCode(),
    admin: "Abdulloh Abdug'aniyev",
    admin_id: 8255294502,
    updated_at: new Date().toISOString(),
  });
});

// Clan kodini yangilash API
app.post("/api/clan-code", (req, res) => {
  const { clan_code } = req.body;
  if (!clan_code) {
    return res.status(400).json({ success: false, message: "Kod kiritilmadi" });
  }

  setClanCode(clan_code.trim());
  res.json({ success: true, clan_code: clan_code.trim() });
});

// Bot ma'lumotlarini (Nomi, Tavsifi) yangilash API
app.post("/api/bot-info", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (name && name.trim()) {
      await bot.api.setMyName(name.trim());
    }
    if (description && description.trim()) {
      await bot.api.setMyDescription(description.trim());
      await bot.api.setMyShortDescription(description.trim().substring(0, 120));
    }
    res.json({ success: true, message: "Bot ma'lumotlari muvaffaqiyatli saqlandi!" });
  } catch (err) {
    console.error("Bot info update error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[HTTP Cloud & Admin Server] ${PORT}-portda muvaffaqiyatli ishga tushdi.`);
});

// ==========================================
// 2. ADMIN VA BOT EGASI SOZLAMALARI
// ==========================================
const ADMIN_USERNAMES = ["abdulloh_abduganiyev_11", "abdulloh_abduganiyev"];
const ADMIN_IDS = [8255294502];

function isAdmin(ctx) {
  const userId = ctx.from?.id || ctx.businessMessage?.from?.id;
  const rawUsername = ctx.from?.username || ctx.businessMessage?.from?.username || "";
  const username = rawUsername.toLowerCase().replace(/^@/, "");

  if (userId && (ADMIN_IDS.includes(userId) || ADMIN_IDS.includes(Number(userId)))) {
    return true;
  }
  if (username && ADMIN_USERNAMES.includes(username)) {
    return true;
  }
  return false;
}

// ==========================================
// 3. CLAN KODI BOSHQARUVI
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
// 4. BOT VA GEMINI AI SOZLAMALARI
// ==========================================
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!botToken || !geminiApiKey) {
  console.error("XATOLIK: .env faylida TELEGRAM_BOT_TOKEN yoki GEMINI_API_KEY topilmadi!");
}

const bot = new Bot(botToken);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

const AI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
];

const FUN_EMOJIS = ["🔥", "⚡️", "😎", "🚀", "✨", "🤝", "🙌", "⚽️", "🎮", "💡", "🎯", "👏", "🏆", "🎧", "🎨"];

function getRandomEmoji() {
  return FUN_EMOJIS[Math.floor(Math.random() * FUN_EMOJIS.length)];
}

// ==========================================
// 5. FLUX AI (NANO BANANA) 8K ULTRA-REALISTIK RASM GENERATORI
// ==========================================

async function enhancePromptWithGemini(userQuery) {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `Foydalanuvchi so'rovi: "${userQuery}".\nBuni eng so'nggi Flux / Nano Banana AI rasm generatori uchun professional, ultra-realistik 8k, fotorealistik bitta toza inglizcha promptga aylantiring. Faqat va faqat toza inglizcha prompt matnini qaytaring, boshqa hech qanday so'z yoki qo'shimcha yozmang.`,
      config: {
        maxOutputTokens: 150,
        temperature: 0.4,
      },
    });

    if (res && res.text) {
      return res.text.trim().replace(/^["']|["']$/g, "");
    }
  } catch (e) {
    console.error("Prompt enhance error:", e.message);
  }

  return userQuery;
}

// ==========================================
// 6. TO'LIQ ORIGINAL MUSIQA QIDIRUV TIZIMI
// ==========================================
const musicCache = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of musicCache.entries()) {
    if (now - val.createdAt > 3600000) {
      musicCache.delete(key);
    }
  }
}, 600000);

async function searchMusicList(query) {
  const cleanQ = query.trim();
  const results = [];

  // 1. Muzfm (To'liq original MP3)
  try {
    const searchUrl = `https://muzfm.tv/search?q=${encodeURIComponent(cleanQ)}`;
    const res = await fetch(searchUrl, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } });
    const html = await res.text();
    const songRegex = /<a[^>]+href="(https:\/\/muzfm\.uz\/music\/[^"]+)"[^>]*>([^<]+)<\/a>/gi;
    const candidates = [];
    let match;
    const seen = new Set();
    while ((match = songRegex.exec(html)) !== null && candidates.length < 5) {
      const pageUrl = match[1];
      const title = match[2].replace(/&#039;/g, "'").replace(/&amp;/g, "&").trim();
      if (!seen.has(pageUrl) && title.length > 2) {
        seen.add(pageUrl);
        candidates.push({ pageUrl, title });
      }
    }

    for (const c of candidates) {
      try {
        const pageRes = await fetch(c.pageUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
        const pageHtml = await pageRes.text();
        const mp3Match = pageHtml.match(/(https:\/\/muzfm\.uz\/storage\/uploads\/music\/[^\s"']+\.mp3)/i);
        if (mp3Match) {
          results.push({
            id: Math.random().toString(36).substring(2, 8),
            title: c.title,
            artist: "Original MP3",
            audioUrl: mp3Match[1],
            isFull: true,
            ytSearchUrl: `https://music.youtube.com/search?q=${encodeURIComponent(c.title)}`,
            spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(c.title)}`,
          });
        }
      } catch (e) {}
    }
  } catch (e) {
    console.error("Muzfm full search error:", e.message);
  }

  // 2. Deezer API (Fallback)
  if (results.length < 3) {
    try {
      const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(cleanQ)}&limit=5`);
      const data = await res.json();
      if (data && data.data && Array.isArray(data.data)) {
        for (const t of data.data) {
          if (t.preview && !results.some((r) => r.title.toLowerCase() === t.title.toLowerCase())) {
            results.push({
              id: t.id,
              title: t.title,
              artist: t.artist?.name || "Noma'lum ijrochi",
              audioUrl: t.preview,
              duration: t.duration,
              isFull: false,
              ytSearchUrl: `https://music.youtube.com/search?q=${encodeURIComponent(t.title + " " + (t.artist?.name || ""))}`,
              spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(t.title + " " + (t.artist?.name || ""))}`,
            });
          }
        }
      }
    } catch (e) {
      console.error("Deezer search error:", e.message);
    }
  }

  // 3. iTunes API (Fallback)
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
              isFull: false,
              ytSearchUrl: `https://music.youtube.com/search?q=${encodeURIComponent(t.trackName + " " + (t.artistName || ""))}`,
              spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(t.trackName + " " + (t.artistName || ""))}`,
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

// Musiqa menyusini chiqarish (Go'zal dizayn va kartalar bilan)
async function sendInteractiveMusicMenu(ctx, queryText, isBusiness = false) {
  const tracks = await searchMusicList(queryText);

  if (!tracks || tracks.length === 0) {
    const notFoundText = `😔 Kechirasiz, *"${queryText}"* bo'yicha hech qanday musiqa topilmadi.\n\nQo'shiqchi yoki qo'shiq nomini aniqroq yozib qayta urinib ko'ring! 🎧`;
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

  const searchId = Math.random().toString(36).substring(2, 8);
  musicCache.set(searchId, { tracks, createdAt: Date.now() });

  // 1-qo'shiqni to'g'ridan-to'g'ri MP3 qilib tashlaymiz
  const topTrack = tracks[0];
  try {
    const audioOptions = {
      title: topTrack.title,
      performer: topTrack.artist,
      caption: `🎵 *${topTrack.title}* — ${topTrack.artist}\n\n🎧 To'liq original: [YouTube Music](${topTrack.ytSearchUrl}) | [Spotify](${topTrack.spotifyUrl})`,
      parse_mode: "Markdown",
    };

    if (isBusiness) {
      audioOptions.business_connection_id = ctx.businessMessage?.business_connection_id;
      await ctx.replyWithAudio(topTrack.audioUrl, audioOptions);
    } else {
      audioOptions.reply_parameters = {
        message_id: ctx.message?.message_id,
        allow_sending_without_reply: true,
      };
      await ctx.replyWithAudio(topTrack.audioUrl, audioOptions);
    }
  } catch (err) {
    console.error("Direct audio send error:", err.message);
  }

  // Go'zal dizayndagi tanlash kartasi
  if (tracks.length > 1 && !isBusiness) {
    let menuText = `🎧 *QIDIRUV NATIJASI:* _"${queryText}"_\n`;
    menuText += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    tracks.forEach((t, i) => {
      menuText += `💿 *${i + 1}. ${t.title}*\n`;
      menuText += `├ 👤 *Ijrochi:* ${t.artist}\n`;
      menuText += `└ 📁 *Format:* ${t.isFull ? "To'liq Original MP3 🔥" : "Audio Track 🎵"}\n\n`;
    });

    menuText += `━━━━━━━━━━━━━━━━━━━━━\n`;
    menuText += `👇 *Boshqa trekni eshitish uchun quyidagi tugmalardan birini bosing:*`;

    const keyboard = new InlineKeyboard();
    tracks.forEach((t, i) => {
      const shortTitle = t.title.length > 20 ? t.title.substring(0, 20) + ".." : t.title;
      keyboard.text(`💿 ${i + 1}. ${shortTitle}`, `mus:${searchId}:${i}`).row();
    });

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
// 7. SO'ROVLARNI ANIQLASH (Rasm va Musiqa)
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
  return p || "photorealistic 8k wallpaper";
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
    t.includes("bu qo'shiqni top") ||
    t.includes("musiqani top")
  );
}

function extractMusicQuery(text) {
  let q = text.trim();
  q = q.replace(/^\/(music|musiqa|mp3|song)\s*/i, "");
  q = q.replace(/(menga|iltimos)?\s*(bu\s*)?(musiqani\s*topib\s*ber|musiqa\s*topib\s*ber|qo'shiq\s*topib\s*ber|qoshiq\s*topib\s*ber|musiqasini\s*top|qo'shig'ini\s*top|mp3\s*top|musiqa\s*tashla|qo'shiq\s*tashla)/gi, "");
  q = q.replace(/[:\-]/g, " ").trim();
  return q;
}

// ==========================================
// 8. TIZIMLI PROMPT & AI JAVOB GENERATSIYASI
// ==========================================

function getSystemPrompt(isGroup = false, userIsAdmin = false) {
  const clanCode = getClanCode();

  const adminNotice = userIsAdmin
    ? "MUHIM: Siz bilan hozir botning EGASI VA BOSHQARUVCHISI — Abdulloh Abdug'aniyev gaplashmoqda! Unga hurmat bilan, boshliqqa xizmat ko'rsatuvchi sodiq shaxsiy yordamchisi sifatida gaplashing."
    : "Siz bilan oddiy foydalanuvchi suhbatlashmoqda.";

  if (isGroup) {
    return `
Siz Telegram guruhida xushmuomala, o'ta tezkor, aqlli va bilimdon yordamchisiz.
${adminNotice}

GURUH QOIDALARI:
1. CLAN KODI: Faqat guruh a'zolari so'raganida faol Clan kodini ayting: "${clanCode}".
2. O'ZBEKISTON BOZORLARI NARXI VA DO'KONLARI:
   - Rasm yoki mahsulot narxi so'ralsa:
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
${adminNotice}

SHAXSIY CHAT QOIDALARI (MUHIM):
1. CLAN KODI HAQIDA UMUMAN GAPIRMANG: Shaxsiy chatlarda Clan kodi haqida hech narsa yozmang va "guruhdan olasiz" degan gaplarni ham mutlaqo ishlatmang.
2. ISMNI DOIMIY TAKRORLAMANG: Har gapda "Men falonchining assistentiman" deb robotdek gapirmang. Haqiqiy inson suhbatlashayotgandek tabiiy gaplashing.
3. O'ZBEKISTON BOZORLARIDAGI NARXLAR VA DO'KONLAR:
   - Rasm (butsi, mashina, kiyim, texnika, telefon) yoki mahsulot narxi so'ralsa:
     * 🏷 Mahsulotning aniq nomi va markasi
     * 💰 O'zbekistondagi real o'rtacha narxi (so'mda va dollarda)
     * 📍 O'zbekistonda qayerdan topish mumkinligi (Uzum Market, OLX.uz, Abu Sahiy, Malika bozori, Chorsu, Asaxiy, Texnomart, Avtoelon va h.k.)
     * 🔗 Qidiruv havolalari:
       - Uzum Market: https://uzum.uz/uz/search?q={nomi}
       - OLX.uz: https://www.olx.uz/d/oz/q-{nomi}/
       - Asaxiy: https://asaxiy.uz/product?key={nomi}
4. MA'LUMOT SO'RASHSA: U haqida qisqacha, aniq, tushunarli va lo'nda qilib barcha muhim xususiyatlarini yozing.
5. EGASI HAQIDA (Faqat so'ralgandagina): Egasi — 14 yoshda, Andijon viloyati Shahrixon tumani 2-maktab 9-sinf o'quvchisi hamda KING SCHOOL'da Bobur Vahobov (UZMIND) shogirdi, dasturchi. Telefon raqamlarini bermang!
6. DO'STONA RUH: Foydalanuvchi bilan o'ta samimiy, do'stona va tezkor muloqot qiling.
`;
  }
}

async function generateAiResponse(contentPayload, isGroup = false, userIsAdmin = false) {
  let lastError = null;
  const prompt = getSystemPrompt(isGroup, userIsAdmin);
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
// 9. TELEGRAM CALLBACK QUERY (Qo'shiq tanlanganda)
// ==========================================
bot.on("callback_query:data", async (ctx) => {
  const data = ctx.callbackQuery.data;

  if (data.startsWith("mus:")) {
    const [, searchId, indexStr] = data.split(":");
    const index = parseInt(indexStr, 10);
    const cached = musicCache.get(searchId);

    if (!cached || !cached.tracks || !cached.tracks[index]) {
      await ctx.answerCallbackQuery({ text: "⚠️ Ushbu qidiruv muddati o'tgan. Iltimos, qayta qidiring." });
      return;
    }

    const track = cached.tracks[index];
    await ctx.answerCallbackQuery({ text: `🎵 "${track.title}" yuklanmoqda...` });

    try {
      await ctx.replyWithAudio(track.audioUrl, {
        title: track.title,
        performer: track.artist,
        caption: `🎵 *${track.title}* — ${track.artist}\n\n🎧 To'liq original: [YouTube Music](${track.ytSearchUrl}) | [Spotify](${track.spotifyUrl})\n\n_Marhamat, musiqani tinglashingiz mumkin!_ ✨`,
        parse_mode: "Markdown",
        reply_parameters: {
          message_id: ctx.callbackQuery.message?.message_id,
          allow_sending_without_reply: true,
        },
      });
    } catch (err) {
      console.error("Callback Audio Reply Error:", err.message);
      await ctx.reply(`🎵 *${track.title}* — ${track.artist}\n\n🎧 Tinglash uchun havola: ${track.audioUrl}`);
    }
  }
});

// ==========================================
// 10. TELEGRAM EVENTLARI (Buyruqlar, Matn, Rasm, Video, Stiker)
// ==========================================

bot.on("business_connection", (ctx) => {
  console.log(`[Business Connection] Ulanish o'rnatildi! ID: ${ctx.businessConnection.id}`);
});

bot.on("business_message", async (ctx) => {
  const fromId = ctx.businessMessage.from?.id;
  const chatId = ctx.businessMessage.chat?.id;
  const messageText = ctx.businessMessage.text;
  const photo = ctx.businessMessage.photo;
  const video = ctx.businessMessage.video || ctx.businessMessage.video_note;
  const sticker = ctx.businessMessage.sticker;
  const caption = ctx.businessMessage.caption;
  const senderName = ctx.businessMessage.from?.first_name || "Do'stim";
  const userIsAdmin = isAdmin(ctx);

  if (fromId !== chatId) {
    return;
  }

  const stopTyping = startTypingIndicator(ctx, true);

  try {
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

    if (video) {
      const prompt = caption || "Ushbu videodagi musiqa yoki mavzuni aniqlang.";
      const aiAnswer = await generateAiResponse(`Foydalanuvchi video yubordi. Undagi so'rov: "${prompt}". Agar videodagi qo'shiq so'ralgan bo'lsa, eng ehtimoliy qo'shiq nomi va ijrochisini ayting.`, false, userIsAdmin);
      await ctx.reply(aiAnswer, {
        business_connection_id: ctx.businessMessage.business_connection_id,
        reply_parameters: {
          message_id: ctx.businessMessage.message_id,
          allow_sending_without_reply: true,
        },
      });
      return;
    }

    if (photo && photo.length > 0) {
      const highestPhoto = photo[photo.length - 1];
      const downloaded = await downloadTelegramFileAsBase64(ctx, highestPhoto.file_id);

      if (downloaded) {
        const userPrompt = caption || "Ushbu rasmni sinchiklab ko'rib chiqing. Undagi buyum (butsi, mashina, kiyim, texnika, telefon) haqida juda to'liq, narxlari va sotiladigan joylari bilan ma'lumot bering.";
        const payload = [
          {
            inlineData: {
              data: downloaded.base64Data,
              mimeType: "image/jpeg",
            },
          },
          userPrompt,
        ];

        const aiAnswer = await generateAiResponse(payload, false, userIsAdmin);
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

    if (messageText) {
      const replyTo = ctx.businessMessage.reply_to_message;

      if (replyTo && replyTo.photo && replyTo.photo.length > 0) {
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

          const aiAnswer = await generateAiResponse(payload, false, userIsAdmin);
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

      // FLUX Rasm yaratish
      if (isImageRequest(messageText)) {
        const rawPrompt = extractImagePrompt(messageText);
        const enhancedPrompt = await enhancePromptWithGemini(rawPrompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?model=flux&width=1024&height=1024&enhance=true&nologo=true`;

        try {
          await ctx.replyWithPhoto(imageUrl, {
            caption: `🎨 *Siz so'ragan rasm:* _${rawPrompt}_\n\n✨ _Flux AI (Ultra-HD fotorealistik)_ orqali yaratildi!`,
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

      // Musiqa qidirish
      if (isMusicRequest(messageText)) {
        const musicQuery = extractMusicQuery(messageText);
        if (musicQuery) {
          await sendInteractiveMusicMenu(ctx, musicQuery, true);
          return;
        }
      }

      console.log(`[Business Matn][${senderName}]: ${messageText}`);
      const aiAnswer = await generateAiResponse(messageText, false, userIsAdmin);

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

// Maxsus buyruqlar: /start, /admin, /musiqa, /rasm, /kod, /about
bot.command("start", async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const userIsAdmin = isAdmin(ctx);
  const appUrl = process.env.APP_URL || "https://telegram-ai-bot-9mk1.onrender.com";

  if (userIsAdmin) {
    const keyboard = new InlineKeyboard().webApp("👑 Admin Panelni Ochish (Mini App)", `${appUrl}/admin`);

    await ctx.reply(
      "👑 *Assalomu alaykum, Abdulloh aka (Bosh Admin)!*\n\nBarcha tizimlar to'liq nazoratingiz ostida. Quyidagi tugma orqali *Maxsus Mini Ilova Admin Paneli*ni ochishingiz yoki `/kod <yangi_kod>` orqali Clan kodini o'zgartirishingiz mumkin! 🚀",
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
        reply_parameters: {
          message_id: ctx.message.message_id,
          allow_sending_without_reply: true,
        },
      }
    );
    return;
  }

  const helpText = isGroup
    ? "👋 Assalomu alaykum!\n\nGuruhda menga Reply qilib istalgan savolingizni berishingiz, rasm/video/fayl tashlab tahlil qildirishingiz, rasm chizdirishingiz (/rasm), musiqa qidirishingiz (/musiqa) yoki Clan kodini olishingiz (/kod) mumkin! 🚀"
    : "👋 Assalomu alaykum!\n\nIstalgan mavzuda savollaringiz bo'lsa bemalol yozing, rasm yoki video yuborib to'liq tahlil qildiring, AI orqali rasm chizdiring (/rasm) yoki qo'shiq qidiring (/musiqa)! 🚀";

  await ctx.reply(helpText, {
    reply_parameters: {
      message_id: ctx.message.message_id,
      allow_sending_without_reply: true,
    },
  });
});

// /admin va /panel buyrug'i (Faqat Abdulloh uchun Mini App)
bot.command(["admin", "panel"], async (ctx) => {
  const userIsAdmin = isAdmin(ctx);

  if (!userIsAdmin) {
    await ctx.reply("⛔️ Kechirasiz, bu bo'lim faqat bot administratori (Abdulloh) uchun ochiq!", {
      reply_parameters: {
        message_id: ctx.message.message_id,
        allow_sending_without_reply: true,
      },
    });
    return;
  }

  const appUrl = process.env.APP_URL || "https://telegram-ai-bot-9mk1.onrender.com";
  const keyboard = new InlineKeyboard().webApp("👑 Admin Panelni Ochish (Mini App)", `${appUrl}/admin`);

  await ctx.reply(
    "👑 *Assalomu alaykum Abdulloh aka!*\n\nQuyidagi tugma orqali shaxsiy *Mini Ilova Admin Paneli*ni ochishingiz mumkin:\n\n• _Clan kodini jonli boshqarish_\n• _Tizim va AI holatini tekshirish_\n• _Server ping va resurslarini ko'rish_",
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
      reply_parameters: {
        message_id: ctx.message.message_id,
        allow_sending_without_reply: true,
      },
    }
  );
});

// /musiqa buyrug'i
bot.command(["musiqa", "music", "mp3", "song"], async (ctx) => {
  const text = ctx.message.text.trim();
  const parts = text.split(/\s+/);

  if (parts.length > 1) {
    const query = parts.slice(1).join(" ");
    await sendInteractiveMusicMenu(ctx, query, false);
  } else {
    await ctx.reply(
      "🎵 *Musiqa qidirish:* `/musiqa <qo'shiq nomi yoki ijrochi>` deb yozing.\n\n_Masalan:_ `/musiqa Shohruhxon` yoki `/musiqa Konsta insonlar`\n\nYoki shunchaki chatda *\"Konsta musiqasini topib ber\"* deb yozishingiz mumkin! 🎧",
      {
        parse_mode: "Markdown",
        reply_parameters: {
          message_id: ctx.message.message_id,
          allow_sending_without_reply: true,
        },
      }
    );
  }
});

// /rasm buyrug'i (Flux AI)
bot.command(["rasm", "image", "draw"], async (ctx) => {
  const text = ctx.message.text.trim();
  const parts = text.split(/\s+/);

  if (parts.length > 1) {
    const rawPrompt = parts.slice(1).join(" ");
    const stopTyping = startTypingIndicator(ctx, false);

    try {
      const enhancedPrompt = await enhancePromptWithGemini(rawPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?model=flux&width=1024&height=1024&enhance=true&nologo=true`;

      await ctx.replyWithPhoto(imageUrl, {
        caption: `🎨 *Siz so'ragan rasm:* _${rawPrompt}_\n\n✨ _Flux AI (Ultra-HD fotorealistik)_ orqali yaratildi!`,
        parse_mode: "Markdown",
        reply_parameters: {
          message_id: ctx.message.message_id,
          allow_sending_without_reply: true,
        },
      });
    } catch (e) {
      await ctx.reply("Rasm yaratishda xatolik bo'ldi, qayta urinib ko'ring.");
    } finally {
      stopTyping();
    }
  } else {
    await ctx.reply(
      "🎨 *AI Rasm chizish:* `/rasm <chizdirmoqchi bo'lgan narsangiz>` deb yozing.\n\n_Masalan:_ `/rasm qora BMW M5` yoki `/rasm kelajak shahri 4k`",
      {
        parse_mode: "Markdown",
        reply_parameters: {
          message_id: ctx.message.message_id,
          allow_sending_without_reply: true,
        },
      }
    );
  }
});

// /kod buyrug'i
bot.command(["kod", "clankod", "setkod"], async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const userIsAdmin = isAdmin(ctx);
  const text = ctx.message.text.trim();
  const parts = text.split(/\s+/);

  if (parts.length > 1) {
    if (userIsAdmin) {
      const newCode = parts.slice(1).join(" ");
      setClanCode(newCode);
      await ctx.reply(
        `✅ *Assalomu alaykum Abdulloh aka!*\n\n🔑 *Clan kodi muvaffaqiyatli yangilandi:* \`${newCode}\`\n\nEndi guruhda kimdir kod so'rasa, ushbu yangi kod taqdim etiladi! 🔥`,
        {
          parse_mode: "Markdown",
          reply_parameters: {
            message_id: ctx.message.message_id,
            allow_sending_without_reply: true,
          },
        }
      );
      return;
    } else {
      await ctx.reply(
        "⚠️ Kechirasiz, Clan kodini faqat bot egasi (Abdulloh) o'zgartira oladi. 😊",
        {
          reply_parameters: {
            message_id: ctx.message.message_id,
            allow_sending_without_reply: true,
          },
        }
      );
      return;
    }
  }

  if (!isGroup) {
    await ctx.reply("Bu buyruq faqat rasmiy guruhda ishlaydi. 😊", {
      reply_parameters: {
        message_id: ctx.message.message_id,
        allow_sending_without_reply: true,
      },
    });
    return;
  }

  const currentCode = getClanCode();
  await ctx.reply(
    `🎮 *Hozirgi Clan kodi:* \`${currentCode}\`\n\n` +
    `Marhamat, kodingizdan foydalanib clanga qo'shilishingiz mumkin! 🔥\n` +
    `_(Kodni faqat admin o'zgartira oladi)_`,
    {
      parse_mode: "Markdown",
      reply_parameters: {
        message_id: ctx.message.message_id,
        allow_sending_without_reply: true,
      },
    }
  );
});

// /about buyrug'i
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

// Stiker kelganda
bot.on("message:sticker", async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const replyTo = ctx.message.reply_to_message;
  const senderId = ctx.from?.id;
  const senderName = ctx.from?.first_name || "Do'stim";

  if (senderId === ctx.me?.id) return;
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

// Video kelganda
bot.on(["message:video", "message:video_note"], async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const replyTo = ctx.message.reply_to_message;
  const caption = ctx.message.caption || "";
  const botUsername = ctx.me?.username?.toLowerCase() || "mrx_uzbot";
  const senderName = ctx.from?.first_name || "Foydalanuvchi";
  const userIsAdmin = isAdmin(ctx);

  if (isGroup) {
    const isReplyToBot = replyTo?.from?.id === ctx.me?.id;
    const isMentioned = caption.toLowerCase().includes(`@${botUsername}`);
    if (!isReplyToBot && !isMentioned) {
      return;
    }
  }

  const stopTyping = startTypingIndicator(ctx, false);

  try {
    console.log(`[Video tahlil qilinmoqda -> From: ${senderName}]`);
    const promptInput = caption || "Ushbu videodagi musiqa yoki qo'shiqni aniqlab bering.";

    const aiAnswer = await generateAiResponse(
      `Foydalanuvchi video yubordi va quyidagicha so'radi/yozdi: "${promptInput}".\nVideodagi musiqani (qo'shiq nomi va ijrochisini) aniqlab, qisqa va aniq ma'lumot bering.`,
      isGroup,
      userIsAdmin
    );

    await ctx.reply(aiAnswer, {
      reply_parameters: {
        message_id: ctx.message.message_id,
        allow_sending_without_reply: true,
      },
    });

    const words = caption.split(/\s+/).filter(w => w.length > 2);
    if (words.length > 0) {
      const q = words.slice(0, 3).join(" ");
      await sendInteractiveMusicMenu(ctx, q, false);
    }
  } catch (error) {
    console.error("[Video Handler Error]:", error?.message || error);
  } finally {
    stopTyping();
  }
});

// Rasm (Photo) kelganda
bot.on("message:photo", async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const replyTo = ctx.message.reply_to_message;
  const photo = ctx.message.photo;
  const caption = ctx.message.caption || "";
  const botUsername = ctx.me?.username?.toLowerCase() || "mrx_uzbot";
  const senderName = ctx.from?.first_name || "Foydalanuvchi";
  const userIsAdmin = isAdmin(ctx);

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

      const aiAnswer = await generateAiResponse(payload, isGroup, userIsAdmin);

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

// Hujjatlar / Fayllar
bot.on("message:document", async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const replyTo = ctx.message.reply_to_message;
  const doc = ctx.message.document;
  const caption = ctx.message.caption || "";
  const botUsername = ctx.me?.username?.toLowerCase() || "mrx_uzbot";
  const senderName = ctx.from?.first_name || "Foydalanuvchi";
  const userIsAdmin = isAdmin(ctx);

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

      const aiAnswer = await generateAiResponse(payload, isGroup, userIsAdmin);

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

// Guruh va Shaxsiy chat matnli xabarlari
bot.on("message:text", async (ctx) => {
  const isPrivate = ctx.chat.type === "private";
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const senderId = ctx.from?.id;
  const senderName = ctx.from?.first_name || "Do'stim";
  const messageText = ctx.message.text;
  const replyTo = ctx.message?.reply_to_message;
  const botUsername = ctx.me?.username?.toLowerCase() || "mrx_uzbot";
  const userIsAdmin = isAdmin(ctx);

  if (senderId === ctx.me?.id) {
    return;
  }

  if (isGroup) {
    const isReplyToBot = replyTo && replyTo.from?.id === ctx.me?.id;
    const isReplyToPhoto = replyTo && replyTo.photo && replyTo.photo.length > 0;
    const isReplyToVideo = replyTo && (replyTo.video || replyTo.video_note);
    const isMentioned = messageText.toLowerCase().includes(`@${botUsername}`);

    if (!isReplyToBot && !isMentioned && !isReplyToPhoto && !isReplyToVideo) {
      return;
    }
  }

  const chatContextTitle = isGroup ? `[Guruh: ${ctx.chat.title}]` : "[Direct]";
  console.log(`>>> ${chatContextTitle}[${senderName}]: "${messageText}"`);

  const stopTyping = startTypingIndicator(ctx, false);

  try {
    // 1. Agar avvalgi rasmga REPLY qilib yozilgan bo'lsa
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

        const aiAnswer = await generateAiResponse(payload, isGroup, userIsAdmin);
        await ctx.reply(aiAnswer, {
          reply_parameters: {
            message_id: ctx.message.message_id,
            allow_sending_without_reply: true,
          },
        });
        return;
      }
    }

    // 2. FLUX Rasm yaratish so'rovi
    if (isImageRequest(messageText)) {
      const rawPrompt = extractImagePrompt(messageText);
      const enhancedPrompt = await enhancePromptWithGemini(rawPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?model=flux&width=1024&height=1024&enhance=true&nologo=true`;

      try {
        await ctx.replyWithPhoto(imageUrl, {
          caption: `🎨 *Siz so'ragan rasm:* _${rawPrompt}_\n\n✨ _Flux AI (Ultra-HD fotorealistik)_ orqali yaratildi!`,
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

    // 3. Musiqa qidirish so'rovi (To'liq MP3)
    if (isMusicRequest(messageText)) {
      const musicQuery = extractMusicQuery(messageText);
      if (musicQuery) {
        await sendInteractiveMusicMenu(ctx, musicQuery, false);
        return;
      }
    }

    // 4. Oddiy matnli savollar va suhbatlar
    let promptInput = "";
    if (isGroup) {
      const repliedText = replyTo?.text || replyTo?.caption || "[Bot Xabari]";
      promptInput = `Guruh nomi: "${ctx.chat.title}".\nBotning avvalgi xabari: "${repliedText}"\nFoydalanuvchi (${senderName}) botga reply qilib yozdi: "${messageText}".\nFoydalanuvchining savoliga mos, juda to'liq, qiziqarli, aniq va xushmuomala javob qaytaring.`;
    } else {
      promptInput = messageText;
    }

    const aiAnswer = await generateAiResponse(promptInput, isGroup, userIsAdmin);

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
    const aiAnswer = await generateAiResponse(postText, true, false);
    await ctx.reply(aiAnswer);
  }
});

// ==========================================
// 11. CRASH VA XATOLIKLARDAN HIMOYA (24/7 Barqarorlik)
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
// 12. BOTNI ISHGA TUSHIRISH (Auto-reconnect loop & Set commands)
// ==========================================
console.log("==========================================");
console.log(" Telegram AI Bot 24/7 tizimi ishga tushmoqda...");
console.log("==========================================");

bot.start({
  onStart: async (botInfo) => {
    console.log(`[Bot Online] @${botInfo.username} muvaffaqiyatli ishga tushdi!`);
    try {
      await bot.api.setMyCommands([
        { command: "musiqa", description: "🎵 Musiqa qidirish va to'liq MP3 yuklash" },
        { command: "rasm", description: "🎨 AI orqali rasm chizish / yaratish" },
        { command: "admin", description: "👑 Admin Panel (Mini App) - faqat admin" },
        { command: "kod", description: "🔑 Clan kodini ko'rish va yangilash" },
        { command: "about", description: "👨‍💻 Bot egasi haqida ma'lumot" },
        { command: "start", description: "🚀 Botni ishga tushirish" },
      ]);
      console.log("[Bot Commands] Menyu buyruqlari muvaffaqiyatli o'rnatildi!");
    } catch (cmdErr) {
      console.warn("[Bot Commands Error]:", cmdErr.message);
    }
  },
  drop_pending_updates: true,
  allowed_updates: ["message", "business_message", "business_connection", "channel_post", "callback_query"],
});