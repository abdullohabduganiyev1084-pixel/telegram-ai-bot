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

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="uz">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Abdulloh — AI Bot Boshqaruv Markazi</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * { -webkit-tap-highlight-color: transparent; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    body { background: radial-gradient(circle at top right, #1e1b4b, #0f172a 60%, #030712 100%); color: #f8fafc; min-height: 100vh; overflow-x: hidden; }
    .glass-card { background: rgba(17, 24, 39, 0.75); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5); }
    .glass-card-glow { background: rgba(30, 27, 75, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(129, 140, 248, 0.2); box-shadow: 0 0 25px rgba(99, 102, 241, 0.15); }
    .btn-gradient { background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
    .btn-gradient:active { transform: scale(0.97); }
    .btn-emerald { background: linear-gradient(135deg, #10b981 0%, #047857 100%); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35); }
    .tab-btn.active { background: rgba(99, 102, 241, 0.2); color: #818cf8; border-color: rgba(99, 102, 241, 0.4); }
    .pulse-dot { animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; }
    @keyframes pulse-ring { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
  </style>
</head>
<body class="p-3.5 pb-24 select-none">
  <div class="max-w-md mx-auto space-y-4">
    <!-- ADMIN PROFILE HEADER -->
    <div class="glass-card-glow rounded-3xl p-4 relative overflow-hidden">
      <div class="absolute -right-8 -top-8 w-28 h-28 bg-indigo-500/20 rounded-full blur-2xl"></div>
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="relative">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md overflow-hidden relative">
              <img id="adminProfileImg" src="" class="w-full h-full object-cover rounded-2xl hidden" />
              <div id="adminProfileFallback" class="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-xl">👑</div>
            </div>
            <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 pulse-dot"></div>
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h1 class="text-base font-extrabold text-white">Abdulloh Abdug'aniyev</h1>
              <span class="text-[10px] font-bold bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">Owner</span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <i class="fab fa-telegram text-sky-400"></i> @abdulloh_abduganiyev_11
            </p>
          </div>
        </div>
        <div class="text-right">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span> 24/7 Online
          </span>
        </div>
      </div>
    </div>

    <!-- TABS -->
    <div class="glass-card rounded-2xl p-1.5 flex gap-1 text-xs font-semibold overflow-x-auto">
      <button onclick="switchTab('dashboard')" id="tab-dashboard" class="tab-btn active py-2 px-1 rounded-xl text-center flex items-center justify-center gap-1 transition-all">
        <i class="fas fa-chart-pie"></i><span>Boshqaruv</span>
      </button>
      <button onclick="switchTab('clan')" id="tab-clan" class="tab-btn py-2 px-1 rounded-xl text-center flex items-center justify-center gap-1 text-slate-400 border border-transparent transition-all">
        <i class="fas fa-key"></i><span>Clan</span>
      </button>
      <button onclick="switchTab('botinfo')" id="tab-botinfo" class="tab-btn py-2 px-1 rounded-xl text-center flex items-center justify-center gap-1 text-slate-400 border border-transparent transition-all">
        <i class="fas fa-robot"></i><span>Bot</span>
      </button>
      <button onclick="switchTab('aistudio')" id="tab-aistudio" class="tab-btn py-2 px-1 rounded-xl text-center flex items-center justify-center gap-1 text-slate-400 border border-transparent transition-all">
        <i class="fas fa-wand-magic-sparkles"></i><span>AI Studio</span>
      </button>
      <button onclick="switchTab('users')" id="tab-users" class="tab-btn py-2 px-1 rounded-xl text-center flex items-center justify-center gap-1 text-slate-400 border border-transparent transition-all">
        <i class="fas fa-users-gear"></i><span>Foydalanuvchilar</span>
      </button>
    </div>

    <!-- TAB 1: DASHBOARD -->
    <div id="view-dashboard" class="space-y-4 tab-content" style="display: block;">
      <div class="grid grid-cols-2 gap-3">
        <div class="glass-card rounded-2xl p-3.5 space-y-1">
          <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Ish Vaqti (Uptime)</span><i class="fas fa-clock text-indigo-400"></i>
          </div>
          <p id="stat-uptime" class="text-base font-extrabold text-indigo-300 font-mono">Yuklanmoqda...</p>
          <p class="text-[10px] text-emerald-400">● 100% Barqaror</p>
        </div>
        <div class="glass-card rounded-2xl p-3.5 space-y-1">
          <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Foydalanuvchilar</span><i class="fas fa-users text-sky-400"></i>
          </div>
          <p class="text-base font-extrabold text-sky-300 font-mono">Barcha Chatlar</p>
          <p class="text-[10px] text-sky-400">● Guruhlar & Direct</p>
        </div>
        <div class="glass-card rounded-2xl p-3.5 space-y-1">
          <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>AI Modellar</span><i class="fas fa-brain text-purple-400"></i>
          </div>
          <p class="text-xs font-bold text-purple-300 mt-1">Gemini 3.1 Flash</p>
          <p class="text-[10px] text-slate-400">+ Flux.1 (8K Ultra-HD)</p>
        </div>
        <div class="glass-card rounded-2xl p-3.5 space-y-1">
          <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Musiqa Tizimi</span><i class="fas fa-music text-amber-400"></i>
          </div>
          <p class="text-xs font-bold text-amber-300 mt-1">Original MP3</p>
          <p class="text-[10px] text-emerald-400">● To'liq 320kbps Audio</p>
        </div>
      </div>

      <div class="glass-card rounded-2xl p-4 space-y-3">
        <h3 class="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <i class="fas fa-bolt text-indigo-400"></i> Tezkor Test & Amallar
        </h3>
        <div class="grid grid-cols-2 gap-2.5">
          <button onclick="triggerPing()" class="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all">
            <i class="fas fa-satellite-dish text-emerald-400"></i><span>Ping Tekshirish</span>
          </button>
          <button onclick="refreshLiveStats()" class="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold py-3 px-3 rounded-xl flex items-center justify-center gap-2 transition-all">
            <i class="fas fa-rotate text-indigo-400"></i><span>Yangilash</span>
          </button>
        </div>
      </div>

      <div class="glass-card rounded-2xl p-4 space-y-2.5">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-300 flex items-center gap-1.5">
            <i class="fas fa-terminal text-slate-400"></i> Server Holati
          </span>
          <span id="pingBadge" class="text-[10px] text-emerald-400 font-mono">0ms</span>
        </div>
        <div class="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-[11px] font-mono space-y-1 text-slate-300">
          <p class="text-emerald-400">✔ Cloud Host: Render.com (24/7 Active)</p>
          <p class="text-indigo-300">✔ Telegram Bot API: Polling & WebApp OK</p>
          <p class="text-slate-400">✔ Gemini GenAI & Vision: Ulandi</p>
          <p class="text-purple-300">✔ Flux AI Rasm Engine: Tayyor</p>
        </div>
      </div>
    </div>

    <!-- TAB 2: CLAN KODI -->
    <div id="view-clan" class="space-y-4 tab-content" style="display: none;">
      <div class="glass-card rounded-3xl p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div class="flex items-center space-x-2.5">
            <div class="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
              <i class="fas fa-key text-base"></i>
            </div>
            <div>
              <h2 class="font-extrabold text-white text-sm">Clan Sozlamalari</h2>
              <p class="text-[10px] text-slate-400">Guruh kodi va rasmini boshqarish</p>
            </div>
          </div>
          <span class="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">Faol</span>
        </div>
        <div class="space-y-2">
          <label class="text-xs text-slate-300 font-semibold flex items-center justify-between">
            <span>Clan Kodi (Matn):</span>
            <span id="clanLastUpdated" class="text-[10px] text-slate-500">Yuklanmoqda...</span>
          </label>
          <div class="relative">
            <input type="text" id="inputClanCode" placeholder="Yangi kodni yozing..." class="w-full bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3 text-indigo-300 font-extrabold text-center tracking-widest text-xl focus:outline-none focus:border-indigo-500 transition-all font-mono" />
            <button onclick="copyCode()" class="absolute right-3.5 top-3 text-slate-400 hover:text-white p-1.5 transition-colors" title="Nusxalash">
              <i class="far fa-copy text-base"></i>
            </button>
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-xs text-slate-300 font-semibold flex items-center justify-between">
            <span>Clan Rasmi (Telegram File ID yoki URL):</span>
          </label>
          <input type="text" id="inputClanPhoto" placeholder="Telegram file_id yoki rasm havolasini yozing..." class="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500" />
        </div>
        <button id="btnSaveClan" onclick="submitNewClanCode()" class="w-full btn-gradient text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-lg">
          <i class="fas fa-check-circle text-base"></i><span>Klan Rasm va Kodini Saqlash</span>
        </button>
      </div>
    </div>

    <!-- TAB 3: BOT SOZLAMALARI -->
    <div id="view-botinfo" class="space-y-4 tab-content" style="display: none;">
      <div class="glass-card rounded-3xl p-5 space-y-4">
        <div class="flex items-center space-x-2.5 border-b border-slate-700/60 pb-3">
          <div class="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
            <i class="fas fa-id-card text-base"></i>
          </div>
          <div>
            <h2 class="font-extrabold text-white text-sm">Bot Ma'lumotlarini Tahrirlash</h2>
            <p class="text-[10px] text-slate-400">Telegramdagi rasmiy nomi va tavsifi</p>
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-semibold">Bot Nomi (Name):</label>
          <input type="text" id="inputBotName" placeholder="Masalan: MRX_UZ | AI Assistant" class="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-semibold focus:outline-none focus:border-indigo-500" />
        </div>
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-semibold">Bot Tavsifi (Description):</label>
          <textarea id="inputBotDesc" rows="3" placeholder="Bot nimalar qila olishi haqida..." class="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"></textarea>
        </div>
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-semibold">Admin Profil Rasmi (Rasm havolasi URL):</label>
          <input type="text" id="inputAdminAvatar" placeholder="Havola (https://...) kiriting..." class="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500" />
        </div>
        <button id="btnSaveBotInfo" onclick="submitBotInfo()" class="w-full btn-emerald text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md">
          <i class="fas fa-save"></i><span>Bot & Admin Sozlamalarini Saqlash</span>
        </button>
      </div>

      <div class="glass-card rounded-2xl p-4 space-y-3">
        <div class="flex items-center justify-between text-xs">
          <span class="font-extrabold text-slate-200 flex items-center gap-1.5">
            <i class="fas fa-list-check text-sky-400"></i> Faol Buyruqlar
          </span>
          <span class="text-[10px] text-slate-400">Telegram Menyu</span>
        </div>
        <div class="space-y-1.5 text-xs">
          <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <code class="text-indigo-300 font-bold">/musiqa</code><span class="text-slate-400 text-[11px]">🎵 Musiqa qidirish & MP3</span>
          </div>
          <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <code class="text-purple-300 font-bold">/rasm</code><span class="text-slate-400 text-[11px]">🎨 AI rasm (Flux 8K)</span>
          </div>
          <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <code class="text-amber-300 font-bold">/kod</code><span class="text-slate-400 text-[11px]">🔑 Clan kodini olish</span>
          </div>
          <div class="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <code class="text-emerald-300 font-bold">/admin</code><span class="text-slate-400 text-[11px]">👑 Admin Mini App</span>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 4: AI STUDIO -->
    <div id="view-aistudio" class="space-y-4 tab-content" style="display: none;">
      <!-- 🎨 Flux AI Section -->
      <div class="glass-card rounded-3xl p-5 space-y-4">
        <div class="flex items-center space-x-2.5 border-b border-slate-700/60 pb-3">
          <div class="w-9 h-9 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
            <i class="fas fa-wand-magic-sparkles text-base"></i>
          </div>
          <div>
            <h2 class="font-extrabold text-white text-sm">Flux AI Studio</h2>
            <p class="text-[10px] text-slate-400">Professional ultra-HD rasm generatori</p>
          </div>
        </div>
        <div class="space-y-1.5">
          <label class="text-xs text-slate-300 font-semibold">Rasm uchun tavsif (Prompt):</label>
          <textarea id="webImagePrompt" rows="2" placeholder="Masalan: neon kiberpank uslubidagi mushuk..." class="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"></textarea>
        </div>
        <button id="btnWebDraw" onclick="webDrawImage()" class="w-full btn-gradient text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md">
          <i class="fas fa-palette"></i><span>Rasm Yaratish (Flux)</span>
        </button>
        <div id="webDrawResult" class="hidden space-y-3 pt-2">
          <div class="rounded-2xl border border-slate-700 overflow-hidden relative bg-slate-950">
            <img id="webGeneratedImg" src="" alt="AI Generated Image" class="w-full h-auto block" />
          </div>
          <a id="webDownloadBtn" href="" download="flux-image.jpg" target="_blank" class="w-full bg-slate-800 border border-slate-700 text-slate-200 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors hover:bg-slate-700">
            <i class="fas fa-download"></i><span>Rasmni Yuklab Olish</span>
          </a>
        </div>
      </div>

      <!-- 🎵 Music search Section -->
      <div class="glass-card rounded-3xl p-5 space-y-4">
        <div class="flex items-center space-x-2.5 border-b border-slate-700/60 pb-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <i class="fas fa-music text-base"></i>
          </div>
          <div>
            <h2 class="font-extrabold text-white text-sm">MP3 Musiqa Studio</h2>
            <p class="text-[10px] text-slate-400">Original to'liq MP3 qo'shiqlar qidiruvi</p>
          </div>
        </div>
        <div class="flex gap-2">
          <input type="text" id="webMusicQuery" placeholder="Qo'shiq nomi..." class="flex-1 bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500" />
          <button id="btnWebMusic" onclick="webSearchMusic()" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center justify-center">
            <i class="fas fa-search"></i>
          </button>
        </div>
        <div id="webMusicPlayer" class="hidden bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
          <p id="webPlayingTitle" class="text-xs font-bold text-indigo-300 font-mono text-center truncate"></p>
          <audio id="webAudioElement" controls class="w-full"></audio>
        </div>
        <div id="webMusicResults" class="space-y-2 max-h-56 overflow-y-auto pr-1"></div>
      </div>
    </div>

    <!-- TAB 5: USERS -->
    <div id="view-users" class="space-y-4 tab-content" style="display: none;">
      <div class="glass-card rounded-3xl p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <div class="flex items-center space-x-2.5">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <i class="fas fa-users-gear text-base"></i>
            </div>
            <div>
              <h2 class="font-extrabold text-white text-sm">Foydalanuvchilar</h2>
              <p class="text-[10px] text-slate-400">Bot a'zolari ro'yxati</p>
            </div>
          </div>
          <button onclick="loadUsersList()" class="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-xl text-slate-300 font-semibold transition-all">
            <i class="fas fa-sync-alt mr-1"></i>
          </button>
        </div>
        <div id="usersListContainer" class="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          <p class="text-center text-xs text-slate-500 py-4">Foydalanuvchilar yuklanmoqda...</p>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div id="toast" class="fixed bottom-6 left-1/2 -translate-x-1/2 max-w-xs w-full bg-slate-900/95 border border-indigo-500/50 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl text-center hidden z-50"></div>
    <p class="text-center text-[10px] text-slate-500 pt-3">© 2026 Abdulloh Abdug'aniyev • Maxsus Mini Ilova</p>
  </div>

  <script>
    // ✅ Telegram WebApp boshlash
    var tg = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
    if (tg) {
      try { tg.expand(); } catch(e) {}
      try { if (tg.setHeaderColor) tg.setHeaderColor('#0f172a'); } catch(e) {}
      try { if (tg.setBackgroundColor) tg.setBackgroundColor('#0f172a'); } catch(e) {}
    }

    // ✅ Yordamchi funksiya
    function el(id) { return document.getElementById(id); }

    // ✅ Toast xabarnoma
    function showToast(msg, isErr) {
      try {
        var t = el('toast'); if (!t) return;
        t.innerText = msg;
        t.style.display = 'block';
        t.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 max-w-xs w-full border text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl text-center z-50 ' +
          (isErr ? 'bg-rose-950 border-rose-500 text-rose-200' : 'bg-slate-900/95 border-indigo-500 text-white');
        setTimeout(function() { if (t) { t.style.display='none'; t.classList.add('hidden'); } }, 3500);
      } catch(e) {}
    }

    // ✅ Tab almashtirish (GLOBAL - onclick uchun)
    function switchTab(tabId) {
      try {
        var contents = document.getElementsByClassName('tab-content');
        for (var i = 0; i < contents.length; i++) contents[i].style.display = 'none';
        var buttons = document.getElementsByClassName('tab-btn');
        for (var j = 0; j < buttons.length; j++) {
          buttons[j].style.color = '#94a3b8';
          buttons[j].style.background = '';
          buttons[j].classList.remove('active');
        }
        var view = el('view-' + tabId);
        var btn  = el('tab-'  + tabId);
        if (view) view.style.display = 'block';
        if (btn)  { btn.style.color = '#818cf8'; btn.style.background = 'rgba(99,102,241,0.2)'; btn.classList.add('active'); }
        if (tabId === 'users') loadUsersList();
        try { if (tg && tg.HapticFeedback) tg.HapticFeedback.selectionChanged(); } catch(e) {}
      } catch(e) { console.warn('switchTab:', e.message); }
    }

    // ✅ Ping tekshirish (GLOBAL)
    function triggerPing() {
      var badge = el('pingBadge');
      var start = Date.now();
      fetch('/ping').then(function() {
        var ms = Date.now() - start;
        if (badge) badge.innerText = ms + 'ms';
        showToast('⚡️ Server: ' + ms + 'ms');
      }).catch(function() {
        if (badge) badge.innerText = 'Offline';
        showToast("Serverga ulanib bo'lmadi", true);
      });
    }

    // ✅ Statistikalarni yuklash (GLOBAL)
    function loadAllData() {
      fetch('/api/status').then(function(r) { return r.json(); }).then(function(d) {
        if (d.clan_code && el('inputClanCode')) el('inputClanCode').value = d.clan_code;
        if (d.clan_photo && el('inputClanPhoto')) el('inputClanPhoto').value = d.clan_photo;
        if (d.uptime && el('stat-uptime')) el('stat-uptime').innerText = d.uptime;
        if (d.bot_name && el('inputBotName')) el('inputBotName').value = d.bot_name;
        if (d.bot_description && el('inputBotDesc')) el('inputBotDesc').value = d.bot_description;
        if (d.admin_avatar) {
          if (el('inputAdminAvatar')) el('inputAdminAvatar').value = d.admin_avatar;
          if (el('adminProfileImg')) { el('adminProfileImg').src = d.admin_avatar; el('adminProfileImg').classList.remove('hidden'); }
          if (el('adminProfileFallback')) el('adminProfileFallback').classList.add('hidden');
        }
        if (d.updated_at && el('clanLastUpdated'))
          el('clanLastUpdated').innerText = 'Yangilandi: ' + new Date(d.updated_at).toLocaleTimeString();
      }).catch(function(e) { console.warn('loadAllData:', e.message); });
    }

    // ✅ Foydalanuvchilar ro'yxati (GLOBAL)
    function loadUsersList() {
      var c = el('usersListContainer'); if (!c) return;
      c.innerHTML = '<p class="text-center text-xs text-slate-500 py-4"><i class="fas fa-spinner fa-spin mr-1"></i> Yuklanmoqda...</p>';
      fetch('/api/users').then(function(r) { return r.json(); }).then(function(d) {
        if (d.success && d.users && d.users.length > 0) {
          c.innerHTML = '';
          d.users.forEach(function(u) {
            var fname = u.first_name || '';
            var lname = u.last_name || '';
            var name = (fname + ' ' + lname).trim() || 'Noma&#39;lum';
            var date = u.last_seen ? new Date(u.last_seen).toLocaleString('uz-UZ',{hourCycle:'h23'}) : '-';
            var uname = u.username || 'Yo&#39;q';
            var badge = u.chat_type === 'private'
              ? '<span class="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded border border-sky-500/30 font-bold">Lichka</span>'
              : '<span class="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30 font-bold">Guruh</span>';
            var row = document.createElement('div');
            row.className = 'bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex flex-col gap-1 text-xs mt-2';
            row.innerHTML =
              '<div class="flex items-center justify-between"><span class="font-extrabold text-slate-200">' + name + '</span>' + badge + '</div>' +
              '<div class="flex justify-between text-[10px] text-slate-400 mt-1"><span>ID: ' + (u.id||'-') + '</span><span>@<span class="text-indigo-400 font-bold">' + uname + '</span></span></div>' +
              '<div class="text-[9px] text-slate-500 mt-0.5">Oxirgi faollik: ' + date + '</div>';
            c.appendChild(row);
          });
        } else { c.innerHTML = '<p class="text-center text-xs text-slate-500 py-4">Foydalanuvchilar topilmadi</p>'; }
      }).catch(function() { c.innerHTML = '<p class="text-center text-xs text-rose-400 py-4">Yuklashda xatolik</p>'; });
    }

    // ✅ Clan kodi saqlash (GLOBAL)
    function submitNewClanCode() {
      var code = el('inputClanCode') ? el('inputClanCode').value.trim() : '';
      var photo = el('inputClanPhoto') ? el('inputClanPhoto').value.trim() : '';
      var btn = el('btnSaveClan');
      if (!code) { showToast("Kodni bo'sh qoldirib bo'lmaydi!", true); return; }
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...'; }
      fetch('/api/clan-code', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({clan_code:code,clan_photo:photo}) })
        .then(function(r){return r.json();}).then(function(d) {
          if (d.success) { showToast('✅ Saqlandi!'); if (el('clanLastUpdated')) el('clanLastUpdated').innerText = 'Hozirgina yangilandi!'; }
          else showToast('Xatolik: '+(d.message||'Saqlanmadi'), true);
        }).catch(function() { showToast('Server bilan aloqa xatoligi', true); })
        .finally(function() { if (btn) { btn.disabled=false; btn.innerHTML='<i class="fas fa-check-circle"></i> <span>Klan Rasm va Kodini Saqlash</span>'; } });
    }

    // ✅ Bot sozlamalarini saqlash (GLOBAL)
    function submitBotInfo() {
      var name = el('inputBotName') ? el('inputBotName').value.trim() : '';
      var desc = el('inputBotDesc') ? el('inputBotDesc').value.trim() : '';
      var avatar = el('inputAdminAvatar') ? el('inputAdminAvatar').value.trim() : '';
      var btn = el('btnSaveBotInfo');
      if (btn) { btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Saqlanmoqda...'; }
      fetch('/api/bot-info', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:name,description:desc,admin_avatar:avatar}) })
        .then(function(r){return r.json();}).then(function(d) {
          if (d.success) {
            showToast('✅ Bot & Admin yangilandi!');
            if (avatar && el('adminProfileImg')) { el('adminProfileImg').src=avatar; el('adminProfileImg').classList.remove('hidden'); }
            if (avatar && el('adminProfileFallback')) el('adminProfileFallback').classList.add('hidden');
          } else showToast('Xatolik: '+(d.message||'Yangilanmadi'), true);
        }).catch(function() { showToast('Server xatoligi', true); })
        .finally(function() { if (btn) { btn.disabled=false; btn.innerHTML='<i class="fas fa-save"></i> <span>Bot & Admin Sozlamalarini Saqlash</span>'; } });
    }

    // ✅ Kodni nusxalash (GLOBAL)
    function copyCode() {
      var input = el('inputClanCode'); if (!input) return;
      input.select();
      try { document.execCommand('copy'); } catch(e) { try { navigator.clipboard.writeText(input.value); } catch(e2) {} }
      showToast('Clan kodi nusxalandi! 📋');
    }

    // ✅ AI Rasm yaratish (GLOBAL)
    function webDrawImage() {
      var prompt = el('webImagePrompt') ? el('webImagePrompt').value.trim() : '';
      var btn = el('btnWebDraw'); var resultDiv = el('webDrawResult');
      if (!prompt) { showToast('Prompt yozing!', true); return; }
      if (btn) { btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Chizilmoqda...'; }
      if (resultDiv) resultDiv.classList.add('hidden');
      fetch('/api/generate-image', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:prompt})})
        .then(function(r){return r.json();}).then(function(d) {
          if (d.success && d.imageUrl) {
            if (el('webGeneratedImg')) el('webGeneratedImg').src = d.imageUrl;
            if (el('webDownloadBtn')) el('webDownloadBtn').href = d.imageUrl;
            if (resultDiv) resultDiv.classList.remove('hidden');
            showToast('🎨 Rasm chizildi!');
          } else showToast("Xatolik bo'ldi", true);
        }).catch(function() { showToast('Aloqa xatoligi', true); })
        .finally(function() { if (btn) { btn.disabled=false; btn.innerHTML='<i class="fas fa-palette"></i> <span>Rasm Yaratish (Flux)</span>'; } });
    }

    // ✅ Musiqa qidirish (GLOBAL)
    function webSearchMusic() {
      var q = el('webMusicQuery') ? el('webMusicQuery').value.trim() : '';
      var btn = el('btnWebMusic'); var rd = el('webMusicResults');
      if (!q) { showToast("Qidiruv so'zini yozing!", true); return; }
      if (btn) { btn.disabled=true; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i>'; }
      if (rd) rd.innerHTML = '';
      fetch('/api/search-music?q=' + encodeURIComponent(q))
        .then(function(r){return r.json();}).then(function(d) {
          if (d.success && d.tracks && d.tracks.length > 0 && rd) {
            d.tracks.forEach(function(t) {
              var row = document.createElement('div');
              row.className = 'bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs mt-2';
              var st = String(t.title||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
              var sa = String(t.artist||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
              var su = String(t.audioUrl||'').replace(/"/g,'&quot;');
              row.innerHTML = '<div class="flex-1 truncate pr-2"><p class="font-bold text-slate-100 truncate">' + st + '</p><p class="text-[10px] text-slate-400 truncate">' + sa + '</p></div>' +
                '<button class="bg-indigo-600/80 text-white rounded-lg p-2 hover:bg-indigo-500" data-url="' + su + '" data-title="' + st.replace(/"/g,'&quot;') + '" onclick="playWebMusic(this.dataset.url,this.dataset.title)"><i class="fas fa-play text-[10px]"></i></button>';
              rd.appendChild(row);
            });
            showToast("🎵 Qo'shiqlar yuklandi!");
          } else showToast('Hech narsa topilmadi', true);
        }).catch(function() { showToast('Aloqa xatoligi', true); })
        .finally(function() { if (btn) { btn.disabled=false; btn.innerHTML='<i class="fas fa-search"></i>'; } });
    }

    // ✅ Musiqa ijro etish (GLOBAL)
    function playWebMusic(url, title) {
      try {
        var player = el('webMusicPlayer'); var te = el('webPlayingTitle'); var audio = el('webAudioElement');
        if (!audio) return;
        if (te) te.innerText = title||'';
        audio.src = url||'';
        if (player) player.classList.remove('hidden');
        audio.play().catch(function(e){console.warn('Audio:',e);});
        showToast('▶️ ' + (title||'') + ' ijro etilmoqda');
      } catch(e) {}
    }

    // ✅ Barchasini yangilash (GLOBAL)
    function refreshLiveStats() { loadAllData(); triggerPing(); loadUsersList(); showToast('Statistika yangilandi 🔄'); }

    // ✅ Ishga tushirish funksiyasi
    var _initialized = false;
    function initApp() {
      if (_initialized) return;
      _initialized = true;
      loadAllData();
      triggerPing();
      setInterval(loadAllData, 15000);
      setInterval(triggerPing, 30000);
    }

    // DOM tayyor bo'lganda ham, window.onload da ham ishlasin
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      // DOM allaqachon tayyor
      initApp();
    }
    window.onload = initApp;
  </script>
</body>
</html>`;

// Har qanday WebApp yoki brauzer kirganda to'g'ridan-to'g'ri Admin HTML ni beradi
app.get(["/", "/admin", "/webapp", "/app"], (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(ADMIN_HTML);
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
    clan_photo: getClanPhoto(),
    admin_avatar: getClanData().admin_avatar || "",
    admin: "Abdulloh Abdug'aniyev",
    admin_id: 8255294502,
    updated_at: new Date().toISOString(),
  });
});

// Clan kodini va rasmini yangilash API
app.post("/api/clan-code", (req, res) => {
  const { clan_code, clan_photo } = req.body;
  if (!clan_code) {
    return res.status(400).json({ success: false, message: "Kod kiritilmadi" });
  }

  setClanCode(clan_code.trim());
  if (clan_photo !== undefined) {
    setClanPhoto(clan_photo.trim());
  }
  res.json({ success: true, clan_code: clan_code.trim(), clan_photo: getClanPhoto() });
});

// Bot ma'lumotlarini (Nomi, Tavsifi, Avatar) yangilash API
app.post("/api/bot-info", async (req, res) => {
  try {
    const { name, description, admin_avatar } = req.body;
    if (name && name.trim()) {
      await bot.api.setMyName(name.trim());
    }
    if (description && description.trim()) {
      await bot.api.setMyDescription(description.trim());
      await bot.api.setMyShortDescription(description.trim().substring(0, 120));
    }
    if (admin_avatar !== undefined) {
      const data = getClanData();
      data.admin_avatar = admin_avatar.trim();
      fs.writeFileSync(CLAN_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    }
    res.json({ success: true, message: "Bot ma'lumotlari muvaffaqiyatli saqlandi!" });
  } catch (err) {
    console.error("Bot info update error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

const USERS_FILE = path.join(process.cwd(), "users.json");
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({}, null, 2), "utf-8");
}

// Foydalanuvchilar ro'yxati API
app.get("/api/users", (req, res) => {
  try {
    let users = {};
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    }
    const userList = Object.values(users).sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen));
    res.json({ success: true, users: userList });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Web Musiqa Qidiruv API
app.get("/api/search-music", async (req, res) => {
  try {
    const q = req.query.q || "Konsta";
    const tracks = await searchMusicList(q);
    res.json({ success: true, tracks });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Web AI Rasm yaratish API
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ success: false, message: "Prompt kiritilmadi" });
    const enhanced = await enhancePromptWithGemini(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?model=flux&width=1024&height=1024&enhance=true&nologo=true`;
    res.json({ success: true, imageUrl, prompt: enhanced });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`[HTTP Cloud & Admin Server] ${PORT}-portda muvaffaqiyatli ishga tushdi.`);
});

function trackUser(ctx) {
  try {
    const from = ctx.from || ctx.businessMessage?.from;
    if (!from) return;

    let users = {};
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    }

    const userId = from.id;
    const existingUser = users[userId] || {};

    users[userId] = {
      introduced: false,
      ...existingUser,
      id: userId,
      first_name: from.first_name || "",
      last_name: from.last_name || "",
      username: from.username ? `@${from.username}` : "Yo'q",
      chat_type: ctx.chat?.type || "unknown",
      last_seen: new Date().toISOString()
    };

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (e) {
    console.error("User tracking error:", e);
  }
}

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
// ==========================================
// 3. CLAN KODI VA RASMI BOSHQARUVI
// ==========================================
const CLAN_DATA_FILE = path.join(process.cwd(), "clan_data.json");

function getClanData() {
  try {
    if (fs.existsSync(CLAN_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(CLAN_DATA_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Clan ma'lumotlarini o'qishda xatolik:", e);
  }
  return { clan_code: "7777" };
}

function getClanCode() {
  return getClanData().clan_code || "7777";
}

function getClanPhoto() {
  return getClanData().clan_photo_file_id || null;
}

function setClanCode(newCode) {
  try {
    const data = getClanData();
    data.clan_code = newCode;
    data.updated_at = new Date().toISOString();
    fs.writeFileSync(CLAN_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Clan kodini saqlashda xatolik:", e);
    return false;
  }
}

function setClanPhoto(fileId) {
  try {
    const data = getClanData();
    data.clan_photo_file_id = fileId;
    data.updated_at = new Date().toISOString();
    fs.writeFileSync(CLAN_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("Clan rasmini saqlashda xatolik:", e);
    return false;
  }
}

if (!fs.existsSync(CLAN_DATA_FILE)) {
  setClanCode("7777");
}

// ==========================================
// 4. BOT VA GEMINI AI SOZLAMALARI
// ==========================================
const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "8958192118:AAH-ChmMsPTVKY9k2T4CJuKnVWhyj5a6txo";
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.API_KEY || "AQ.Ab8RN6J3JG66E-NzlhJiji50l7oVvytUvMIUg3U4vfYkMJwYOQ";

if (!process.env.TELEGRAM_BOT_TOKEN && !process.env.BOT_TOKEN) {
  console.warn("[Config Warning] TELEGRAM_BOT_TOKEN topilmadi, standart fallback ishlatilmoqda.");
}
if (!process.env.GEMINI_API_KEY && !process.env.GEMINI_KEY) {
  console.warn("[Config Warning] GEMINI_API_KEY topilmadi, standart fallback ishlatilmoqda.");
}

const bot = new Bot(botToken);
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

const AI_MODELS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash-exp",
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
      model: "gemini-1.5-flash",
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
// 8. REAL-TIME O'ZBEKISTON VAQTI VA OB-HAVO TIZIMI
// ==========================================

function getUzbekistanTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("uz-UZ", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const dateStr = now.toLocaleDateString("uz-UZ", {
    timeZone: "Asia/Tashkent",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return {
    time: timeStr,
    date: dateStr,
    full: `${dateStr}, soat ${timeStr} (O'zbekiston / Toshkent vaqti, UTC+5)`,
  };
}

const UZ_CITIES = {
  andijon: { name: "Andijon", lat: 40.7821, lon: 72.3442 },
  toshkent: { name: "Toshkent", lat: 41.2995, lon: 69.2401 },
  samarqand: { name: "Samarqand", lat: 39.6270, lon: 66.9749 },
  namangan: { name: "Namangan", lat: 40.9983, lon: 71.6726 },
  fargona: { name: "Farg'ona", lat: 40.3842, lon: 71.7843 },
  buxoro: { name: "Buxoro", lat: 39.7747, lon: 64.4286 },
  xiva: { name: "Xiva", lat: 41.3783, lon: 60.3639 },
  nukus: { name: "Nukus", lat: 42.4602, lon: 59.6073 },
  qarshi: { name: "Qarshi", lat: 38.8606, lon: 65.7891 },
  jizzax: { name: "Jizzax", lat: 40.1158, lon: 67.8422 },
  guliston: { name: "Guliston", lat: 40.4897, lon: 68.7842 },
  navoiy: { name: "Navoiy", lat: 40.0844, lon: 65.3792 },
  termez: { name: "Termiz", lat: 37.2242, lon: 67.2783 },
};

function getWeatherDescription(code) {
  if (code === 0) return "Musaffo, ochiq osmon (quyoshli) ☀️";
  if (code === 1 || code === 2 || code === 3) return "Asosan ochiq, qisman bulutli ⛅️";
  if (code === 45 || code === 48) return "Tumanli 🌫";
  if (code >= 51 && code <= 55) return "Mayda yomg'ir yog'moqda 🌦";
  if (code >= 61 && code <= 65) return "Yomg'irli havo 🌧";
  if (code >= 71 && code <= 75) return "Qor yog'moqda ❄️";
  if (code >= 80 && code <= 82) return "Kuchli yomg'ir / Jala 🌧";
  if (code >= 95) return "Momaqaldiroqli havo ⛈";
  return "Havo yaxshi";
}

async function getLiveWeather(text = "") {
  let targetCity = UZ_CITIES.andijon;
  const t = text.toLowerCase();

  for (const [key, c] of Object.entries(UZ_CITIES)) {
    if (t.includes(key) || t.includes(c.name.toLowerCase())) {
      targetCity = c;
      break;
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${targetCity.lat}&longitude=${targetCity.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=Asia%2FTashkent`;
    const res = await fetch(url);
    const data = await res.json();

    if (data && data.current) {
      const cur = data.current;
      const desc = getWeatherDescription(cur.weather_code);
      return `\n📍 JORIY REAL OB-HAVO MA'LUMOTI (${targetCity.name}):\n• Harorat: ${cur.temperature_2m}°C (sezilishi: ${cur.apparent_temperature}°C)\n• Holati: ${desc}\n• Namlik darajasi: ${cur.relative_humidity_2m}%\n• Shamol tezligi: ${cur.wind_speed_10m} km/soat\n`;
    }
  } catch (e) {
    console.error("Live weather fetch error:", e.message);
  }

  return "";
}

function isWeatherRequest(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  return (
    t.includes("ob-havo") ||
    t.includes("obhavo") ||
    t.includes("ob havo") ||
    t.includes("havo qanday") ||
    t.includes("havo qanaqa") ||
    t.includes("harorat") ||
    t.includes("gradus") ||
    t.includes("issiqmi") ||
    t.includes("sovuqmi") ||
    t.includes("yomg'ir") ||
    t.includes("qor")
  );
}

function isClanCodeRequest(text) {
  if (!text) return false;
  const t = text.toLowerCase().trim();
  return (
    t.includes("clan uchun kod") ||
    t.includes("clan kodi") ||
    t.includes("clanga kod") ||
    t.includes("clan kodini ber") ||
    t.includes("clan kodi nima") ||
    t.includes("klan kodi") ||
    t.includes("klan uchun kod") ||
    t.includes("clan kod") ||
    t.includes("klan kod")
  );
}

function getAbdullohCurrentStatus() {
  const now = new Date();
  const uzHour = parseInt(now.toLocaleTimeString("uz-UZ", { timeZone: "Asia/Tashkent", hour: "2-digit", hour12: false }), 10);
  if (uzHour >= 6 && uzHour < 12) {
    return "Abdulloh hozir sport bilan shug'ullanyapti (mashg'ulotda).";
  } else if (uzHour >= 12 && uzHour < 22) {
    return "Abdulloh hozir dars qilyapti va kitob o'qiyapti.";
  } else {
    return "Abdulloh hozir uxlayapti (dam olish vaqti).";
  }
}

// ==========================================
// 9. TIZIMLI PROMPT & AI JAVOB GENERATSIYASI
// ==========================================

function getSystemPrompt(isGroup = false, userIsAdmin = false, weatherContext = "") {
  const clanCode = getClanCode();
  const uzTime = getUzbekistanTime();
  const abdullohStatus = getAbdullohCurrentStatus();

  const adminNotice = userIsAdmin
    ? "MUHIM: Siz bilan hozir botning EGASI VA BOSHQARUVCHISI — Abdulloh Abdug'aniyev gaplashmoqda! Unga hurmat bilan, boshliqqa xizmat ko'rsatuvchi sodiq shaxsiy yordamchisi sifatida gaplashing."
    : "Siz bilan oddiy foydalanuvchi suhbatlashmoqda.";

  const weatherInfo = weatherContext ? `\n${weatherContext}\n` : "";

  if (isGroup) {
    return `
Siz Telegram guruhida xushmuomala, o'ta tezkor, aqlli va bilimdon yordamchisiz.
${adminNotice}

REAL VAQT VA SANA (O'ZBEKISTON / TOSHKENT):
- Hozirgi aniq O'zbekiston vaqti: ${uzTime.time} (UTC+5, Toshkent/Andijon)
- Bugungi sana va kun: ${uzTime.date}
- Agar foydalanuvchi soat necha bo'lganini yoki bugun qaysi kun ekanligini so'rasa, aynan shu O'zbekiston vaqtini ayting!
${weatherInfo}

MULOQOT VA JAVOB BERISH QOIDALARI:
- XAQIQIY ODAMLARDEK GAPLASHING: Mutlaqo insoniy tilda yozing. Sun'iy intellektga xos bo'lgan quruq, rasmiy andozalarni mutlaqo ishlatmang. Gaplar qisqa, sodda, jonli va o'ta samimiy bo'lsin.
- MUSIQA VA RASM HAQIDA O'ZINGIZDAN O'ZINGIZ YOZMANG: Hech qachon javoblaringizda "Sizga rasm yoki musiqa topib beraymi?", "Buyruqlardan foydalaning" deb taklif qilmang! Faqat foydalanuvchi so'ragandagina bajaring.
- Hech qachon takroriy salomlashuvlar bilan boshlamang. Faqat foydalanuvchi birinchi bo'lib salomlashsa, salomlashing.

ABDULLOH (BOT EGASI) VA UNING KUN TARTIBI:
- Hozirgi aniq vaqt bo'yicha Abdullohning holati: "${abdullohStatus}"
- O'zingizdan o'zingiz Abdulloh haqida ma'lumot bermang. Faqat so'rashgandagina ayting:
  * Agar "Abdulloh nima qilyapti?", "Abdulloh qani?" deb so'ralsa: aynan "${abdullohStatus}" deb javob bering.
  * Agar "Abdulloh haqida ma'lumot ber" deb so'ralsa: "${abdullohStatus} Abdulloh Abdug'aniyev, 15 yoshda, Andijon viloyati Shahrixon tumanidan, 2-maktab 9-sinf o'quvchisi va KING SCHOOL'da Bobur Vahobov (UZMIND) shogirdi, Full-Stack dasturchi."
  * Agar "Abdullohni oilasi haqida ma'lumot ber" deb so'ralsa: "Onasi — Roziyahon, Otasi — Yosinbek, Opasi — Robiya".
  * Agar faqat "kim yaratgan?", "kim bu?" deb so'ralsa: faqat "Abdulloh Abdug'aniyev".

GURUH QOIDALARI:
1. CLAN KODI: Faqat guruh a'zolari so'raganida faol Clan kodini ayting: "${clanCode}".
2. O'ZBEKISTON BOZORLARI NARXI VA DO'KONLARI:
   - Rasm yoki mahsulot narxi so'ralsa, aniq modeli, narxi va O'zbekistondagi do'konlarini ko'rsating.
3. OB-HAVO: Faqat so'ralsa ayting.
`;
  } else {
    return `
Siz shaxsiy chatda xuddi haqiqiy do'stdek samimiy, juda aqlli, o'ta tezkor va bilimdon inson sifatida gaplashuvchi yordamchisiz.
${adminNotice}

REAL VAQT VA SANA (O'ZBEKISTON / TOSHKENT):
- Hozirgi aniq O'zbekiston vaqti: ${uzTime.time} (UTC+5, Toshkent/Andijon)
- Bugungi sana va kun: ${uzTime.date}
${weatherInfo}

MULOQOT VA JAVOB BERISH QOIDALARI:
- XAQIQIY ODAMLARDEK GAPLASHING: Mutlaqo insoniy tilda yozing. Har qanday robotik rasmiy andozalardan voz keching. Kerak bo'lsa 'aka', 'uka', 'opa', 'charchamang', 'rahmat' kabi so'zlarni joyida, tabiiy ishlating.
- MUSIQA VA RASM HAQIDA O'ZINGIZDAN O'ZINGIZ YOZMANG: Hech qachon javoblaringizda "Sizga rasm yoki musiqa topib beraymi?", "/musiqa /rasm dan foydalaning" deb taklif qilmang! Faqat foydalanuvchi so'ragandagina bajaring.
- Shaxsiy chatlarda Clan kodi haqida hech narsa yozmang va guruhdan olasiz demang.

ABDULLOH (BOT EGASI) VA UNING KUN TARTIBI:
- Hozirgi aniq vaqt bo'yicha Abdullohning holati: "${abdullohStatus}"
- O'zingizdan o'zingiz Abdulloh haqida ma'lumot bermang. Faqat so'rashgandagina ayting:
  * Agar "Abdulloh nima qilyapti?", "Abdulloh qani?" deb so'ralsa: aynan "${abdullohStatus}" deb javob bering.
  * Agar "Abdulloh haqida ma'lumot ber" deb so'ralsa: "${abdullohStatus} Abdulloh Abdug'aniyev, 15 yoshda, Andijon viloyati Shahrixon tumanidan, 2-maktab 9-sinf o'quvchisi va KING SCHOOL'da Bobur Vahobov (UZMIND) shogirdi, Full-Stack dasturchi."
  * Agar "Abdullohni oilasi haqida ma'lumot ber" deb so'ralsa: "Onasi — Roziyahon, Otasi — Yosinbek, Opasi — Robiya".
  * Agar faqat "kim yaratgan?", "kim bu?" deb so'ralsa: faqat "Abdulloh Abdug'aniyev".
`;
  }
}

const chatMemory = new Map();

function getChatHistory(chatId) {
  if (!chatId) return [];
  if (!chatMemory.has(chatId)) {
    chatMemory.set(chatId, []);
  }
  return chatMemory.get(chatId);
}

function addMessageToMemory(chatId, role, text) {
  if (!chatId) return;
  const history = getChatHistory(chatId);
  history.push({ role, parts: [{ text }] });
  if (history.length > 12) {
    history.splice(0, 2);
  }
}

async function generateAiResponse(contentPayload, isGroup = false, userIsAdmin = false, queryTextForWeather = "", chatId = null, senderId = null) {
  let lastError = null;
  let weatherContext = "";

  const textToCheck = typeof contentPayload === "string" ? contentPayload : queryTextForWeather;
  if (isWeatherRequest(textToCheck)) {
    weatherContext = await getLiveWeather(textToCheck);
  }

  let introPrompt = "";
  if (senderId) {
    try {
      let users = {};
      if (fs.existsSync(USERS_FILE)) {
        users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
      }
      if (users[senderId] && !users[senderId].introduced) {
        introPrompt = "\nMUHIM QOIDA: Bu foydalanuvchi bilan birinchi marta muloqot qilishingiz. O'zingizni juda muloyimlik bilan tanishtiring (Masalan: 'Assalomu alaykum! Men Abdulloh Abdug'aniyev tomonidan yaratilgan sun'iy intellekt yordamchisiman...'). Keyingi xabarlarda o'zingizni boshqa tanishtirmang.\n";
        users[senderId].introduced = true;
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
      }
    } catch (e) {
      console.error("Intro tracking error:", e);
    }
  }

  const prompt = getSystemPrompt(isGroup, userIsAdmin, weatherContext) + introPrompt;
  let contents = [];

  if (chatId && typeof contentPayload === "string") {
    addMessageToMemory(chatId, "user", contentPayload);
    contents = [...getChatHistory(chatId)];
  } else {
    contents = Array.isArray(contentPayload) ? contentPayload : [contentPayload];
  }

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
        const textResponse = response.text;
        if (chatId && typeof contentPayload === "string") {
          addMessageToMemory(chatId, "model", textResponse);
        }
        return textResponse;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Model ${modelName}]: ${err?.message?.substring(0, 80)}`);
    }
  }

  console.error("[AI Modellar xatolik berdi]:", lastError?.message || lastError);

  // Tarmoq uzilganda yoki API vaqtincha javob bermaganda toza zaxira javobi
  return "Hozir bir oz tarmoqda uzilish bo'ldi. Birozdan so'ng qayta yozib ko'ring, iltimos! 😊";
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
      const aiAnswer = await generateAiResponse(messageText, false, userIsAdmin, messageText, ctx.chat.id);

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

const adminState = new Map();

// /clanrasmi buyrug'i - Admin uchun clan rasmini o'rnatish
bot.command("clanrasmi", async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply("⚠️ Kechirasiz, bu buyruq faqat bot administratori (Abdulloh) uchun ochiq!", {
      reply_parameters: {
        message_id: ctx.message.message_id,
        allow_sending_without_reply: true,
      },
    });
    return;
  }

  const userId = ctx.from?.id;
  if (userId) {
    adminState.set(userId, "WAITING_CLAN_PHOTO");
    await ctx.reply(
      "📷 *Abdulloh aka, iltimos, clan kodi uchun yangi rasmni yuboring!*\n\n_Rasm kelganidan so'ng u guruhlar uchun clan kodi rasmi etib sozlanadi. 😊_",
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

// /clan buyrug'i - Admin uchun clan rasmi va kodini birgalikda o'rnatish
bot.command("clan", async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply("⚠️ Kechirasiz, bu buyruq faqat bot administratori (Abdulloh) uchun ochiq!", {
      reply_parameters: {
        message_id: ctx.message.message_id,
        allow_sending_without_reply: true,
      },
    });
    return;
  }

  const userId = ctx.from?.id;
  if (userId) {
    adminState.set(userId, "WAITING_CLAN_PHOTO_AND_TEXT");
    await ctx.reply(
      "📷 *Abdulloh aka, iltimos, klan rasmini yuboring va uning izohiga (caption) yangi clan kodini (text) yozib yuboring!* 🚀",
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

// Maxsus buyruqlar: /start, /admin, /musiqa, /rasm, /kod, /about
bot.command("start", async (ctx) => {
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const userIsAdmin = isAdmin(ctx);
  const appUrl = process.env.APP_URL || "https://telegram-ai-bot-l1yc.onrender.com";

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

  const appUrl = process.env.APP_URL || "https://telegram-ai-bot-l1yc.onrender.com";
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

// /seturl buyrug'i - Render havolasini yangilash
bot.command(["seturl", "url"], async (ctx) => {
  if (!isAdmin(ctx)) return;
  const text = ctx.message.text.trim();
  const parts = text.split(/\s+/);
  if (parts.length > 1) {
    const newUrl = parts[1].replace(/\/+$/, "");
    process.env.APP_URL = newUrl;
    try {
      await bot.api.setChatMenuButton({
        chat_id: 8255294502,
        menu_button: {
          type: "web_app",
          text: "👑 Admin Panel",
          web_app: {
            url: newUrl,
          },
        },
      });
      await ctx.reply(
        `✅ *Mini App havolasi muvaffaqiyatli o'rnatildi!*\n\n🔗 *Yangi havola:* \`${newUrl}\`\n\nEndi Telegramdagi **[👑 Admin Panel]** tugmasini bosing, bir zumda ochiladi! 🔥`,
        {
          parse_mode: "Markdown",
          reply_parameters: {
            message_id: ctx.message.message_id,
            allow_sending_without_reply: true,
          },
        }
      );
    } catch (e) {
      await ctx.reply("Xatolik: " + e.message);
    }
  } else {
    await ctx.reply(
      `🌐 *Hozirgi Mini App havolasi:* \`${process.env.APP_URL || "https://telegram-ai-bot-l1yc.onrender.com"}\`\n\nYangilash uchun: \`/seturl https://sizning-saytingiz.onrender.com\` deb yozing.`,
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
  const text = ctx.message.text ? ctx.message.text.trim() : "";
  const parts = text.split(/\s+/);
  
  const photo = ctx.message.photo || ctx.message.reply_to_message?.photo;

  if (userIsAdmin && (photo && photo.length > 0)) {
    const highestPhoto = photo[photo.length - 1];
    setClanPhoto(highestPhoto.file_id);

    const codeText = parts.length > 1 ? parts.slice(1).join(" ") : "";
    if (codeText) {
      setClanCode(codeText);
    }

    await ctx.reply(
      `✅ *Assalomu alaykum Abdulloh aka!*\n\n📸 *Clan kodi uchun yangi rasm saqlandi!*\n\nEndi guruhda kimdir "clan uchun kod" deb yozsa, ushbu rasm va kod (${codeText || getClanCode()}) yuboriladi! 🚀`,
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
    const currentCode = getClanCode();
    const currentPhoto = getClanPhoto();
    if (currentPhoto) {
      await ctx.replyWithPhoto(currentPhoto, {
        caption: `🎮 *Hozirgi Clan kodi:* \`${currentCode}\`\n\nMarhamat, kodingizdan foydalanib clanga qo'shilishingiz mumkin! 🔥`,
        parse_mode: "Markdown",
        reply_parameters: {
          message_id: ctx.message.message_id,
          allow_sending_without_reply: true,
        },
      });
    } else {
      await ctx.reply(`🎮 *Hozirgi Clan kodi:* \`${currentCode}\`\n\nMarhamat, kodingizdan foydalanib clanga qo'shilishingiz mumkin! 🔥`, {
        parse_mode: "Markdown",
        reply_parameters: {
          message_id: ctx.message.message_id,
          allow_sending_without_reply: true,
        },
      });
    }
    return;
  }

  const currentCode = getClanCode();
  const currentPhoto = getClanPhoto();
  if (currentPhoto) {
    await ctx.replyWithPhoto(currentPhoto, {
      caption: `🎮 *Hozirgi Clan kodi:* \`${currentCode}\`\n\nMarhamat, kodingizdan foydalanib clanga qo'shilishingiz mumkin! 🔥`,
      parse_mode: "Markdown",
      reply_parameters: {
        message_id: ctx.message.message_id,
        allow_sending_without_reply: true,
      },
    });
  } else {
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
  }
});

// /about - Bot haqida ma'lumot
bot.command(["about", "portfolio", "info"], async (ctx) => {
  const botAboutText =
`🌐 *Bot haqida ma'lumot:*

🤖 *Bot nomi:* MRX_UZ AI Bot
👑 *Yaratuvchi:* Abdulloh Abdug'aniyev
⚡ *Texnologiya:* Node.js + Gemini AI + Flux AI
🎯 *Imkoniyatlar:*
  • 💬 Sun'iy intellekt bilan suhbat
  • 🎨 AI orqali rasm yaratish (/rasm)
  • 🎧 Musiqa qidirish va yuklash (/musiqa)
  • 🔑 Clan kodi (/clanrasmi)
  • 🌤 Ob-havo ma'lumotlari
  • 📷 Rasm tahlili (rasmga reply qiling)
  
☁️ *Server:* Render.com (24/7 ishlaydi)

_Bot haqida savollar bo'lsa, yaratuvchiga murojaat qiling!_ ✨`;

  await ctx.reply(botAboutText, {
    parse_mode: "Markdown",
    reply_parameters: {
      message_id: ctx.message.message_id,
      allow_sending_without_reply: true,
    },
  });
});

// /men - Abdulloh haqida ma'lumot
bot.command(["men", "abdulloh", "owner"], async (ctx) => {
  const infoText = 
`👨 *Men haqimda — Abdulloh Abdug'aniyev:*

👤 *Yoshi:* 15 yoshda
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
      userIsAdmin,
      promptInput
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
  trackUser(ctx);
  const isGroup = ctx.chat.type === "group" || ctx.chat.type === "supergroup";
  const replyTo = ctx.message.reply_to_message;
  const photo = ctx.message.photo;
  const caption = ctx.message.caption || "";
  const botUsername = ctx.me?.username?.toLowerCase() || "mrx_uzbot";
  const senderName = ctx.from?.first_name || "Foydalanuvchi";
  const userIsAdmin = isAdmin(ctx);

  const senderId = ctx.from?.id;
  const state = senderId ? adminState.get(senderId) : null;
  if (senderId && isAdmin(ctx) && (state === "WAITING_CLAN_PHOTO" || state === "WAITING_CLAN_PHOTO_AND_TEXT")) {
    const highestPhoto = photo[photo.length - 1];
    setClanPhoto(highestPhoto.file_id);
    
    let savedCode = getClanCode();
    if (caption && caption.trim()) {
      savedCode = caption.trim();
      setClanCode(savedCode);
    }
    
    adminState.delete(senderId);

    await ctx.reply(
      `✅ *Klan rasmi va kodi muvaffaqiyatli saqlandi!*\n\n` +
      `📸 *Rasm:* Saqlandi\n` +
      `🔑 *Clan kodi:* \`${savedCode}\`\n\n` +
      `Endi guruhda kimdir klan kodini so'rasa, ushbu rasm pastida o'rnatilgan kod bilan birga yuboriladi! 🚀`,
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

      const aiAnswer = await generateAiResponse(payload, isGroup, userIsAdmin, caption);

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

      const aiAnswer = await generateAiResponse(payload, isGroup, userIsAdmin, caption);

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
  trackUser(ctx);
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

  // Clan kodi so'rovi - Guruhda ham, lichkada ham ishlaydi (hech qanday botni tilga olish shart emas)
  if (isClanCodeRequest(messageText)) {
    const clanPhoto = getClanPhoto();
    const clanCode = getClanCode();
    if (clanPhoto) {
      await ctx.replyWithPhoto(clanPhoto, {
        caption: `🎮 *Clan kodi:* \`${clanCode}\``,
        parse_mode: "Markdown",
        reply_parameters: {
          message_id: ctx.message.message_id,
          allow_sending_without_reply: true,
        },
      });
    } else {
      await ctx.reply(`🎮 *Clan kodi:* \`${clanCode}\``, {
        parse_mode: "Markdown",
        reply_parameters: {
          message_id: ctx.message.message_id,
          allow_sending_without_reply: true,
        },
      });
    }
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

        const aiAnswer = await generateAiResponse(payload, isGroup, userIsAdmin, messageText, ctx.chat.id, ctx.from?.id);
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

    const aiAnswer = await generateAiResponse(promptInput, isGroup, userIsAdmin, messageText, ctx.chat.id, ctx.from?.id);

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
    const aiAnswer = await generateAiResponse(postText, true, false, postText);
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
        { command: "start",     description: "Botni ishga tushirish 🚀" },
        { command: "about",     description: "Bot haqida ma'lumot 🌐" },
        { command: "men",       description: "Men haqimda 👨" },
        { command: "musiqa",    description: "Musiqa izlash 🎧" },
        { command: "rasm",      description: "Rasm yaratish 🎨" },
        { command: "clanrasmi", description: "Clanning Rasmi 🏆" },
      ]);
      console.log("[Bot Commands] Menyu buyruqlari muvaffaqiyatli o'rnatildi!");
    } catch (cmdErr) {
      console.warn("[Bot Commands Error]:", cmdErr.message);
    }
  },
  drop_pending_updates: true,
  allowed_updates: ["message", "business_message", "business_connection", "channel_post", "callback_query"],
});