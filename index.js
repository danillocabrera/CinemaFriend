// Watch-CinemaShows: detects new showtimes on Kinoheld and notifies via Telegram.
// Designed to run on GitHub Actions (no dependency on your PC).

const fs = require("fs");
const path = require("path");

// ======================= CONFIG =======================

// You can watch one or several cinemas at once by adding more ids here.
const CINEMA_IDS = ["635"]; // 635 = IMAX Sinsheim (Technik Museum)

const URL = `https://www.kinoheld.de/ajax/getShowsForCinemas?${CINEMA_IDS.map(
  (id) => `cinemaIds[]=${id}`
).join("&")}&lang=de`;

const STATE_FILE = path.join(__dirname, "cinema-shows-state.json");

// ========================================================

async function fetchShows() {
  const res = await fetch(URL, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer:
        "https://www.kinoheld.de/kino-sinsheim/imax-3d-laser-4k-sinsheim?mode=widget&rb=1",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} while requesting ${URL}`);
  }

  const data = await res.json();
  if (!data.shows) {
    throw new Error("Response does not contain 'shows'. Check the URL/JSON structure.");
  }
  return data.shows;
}

function loadPreviousIds() {
  if (!fs.existsSync(STATE_FILE)) return null; // null = first run
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveCurrentIds(ids) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(ids, null, 2), "utf8");
}

async function sendTelegramMessage(newShows) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const lines = newShows
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((s) => {
      const flags = (s.flags || []).map((f) => f.name).join(", ");
      const flagsText = flags ? ` (${flags})` : "";
      return `• ${s.name} — ${s.weekDay} ${s.date} ${s.time}${flagsText}`;
    })
    .join("\n");

  const text = `🎬 *New showtimes available:*\n\n${lines}`;

  const res = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    }
  );

  const result = await res.json();
  if (!result.ok) {
    throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
  }

  console.log(`Telegram message sent with ${newShows.length} new show(s).`);
}

(async () => {
  try {
    const currentShows = await fetchShows();
    const currentIds = currentShows.map((s) => s.id);
    const previousIds = loadPreviousIds();

    if (previousIds === null) {
      console.log(
        `First run: saving ${currentIds.length} shows as baseline. No message sent.`
      );
      saveCurrentIds(currentIds);
      return;
    }

    const newShows = currentShows.filter((s) => !previousIds.includes(s.id));

    saveCurrentIds(currentIds);

    if (newShows.length > 0) {
      console.log(`Found ${newShows.length} new show(s).`);
      await sendTelegramMessage(newShows);
    } else {
      console.log(`No changes. Total current shows: ${currentIds.length}.`);
    }
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
})();
