// utils/loldata.js — everything the loldata slash commands share.
//
// Kept in one place because the alternative is twelve copies of the champion
// map, the queue table and the "which lobby is this channel" lookup.

import { supabase, supabaseBox } from "../supabaseClient.js";

export const API = process.env.LOLDATA_API_URL || "https://api2.loldata.cc";
export const CDN = "https://cdn2.loldata.cc";
export const SITE = "https://loldata.cc";

export const JADE = 0x00d992;
export const CITRINE = 0xffb615;
export const LOSS = 0xc93232;
export const IDLE = 0x3a4a4e;

export const QUEUE = {
  420: "Ranked Solo/Duo",
  440: "Ranked Flex",
  400: "Normal Draft",
  430: "Normal Blind",
  450: "ARAM",
  480: "Swiftplay",
  490: "Quickplay",
  700: "Clash",
  1700: "Arena",
  0: "Custom",
};

// Riot adds and retires queue ids constantly (rotating modes, events), so an
// unknown id falls back to the gameMode the API itself reports rather than a
// guessed label or a bare number.
export const MODE = {
  CLASSIC: "Summoner's Rift",
  ARAM: "ARAM",
  CHERRY: "Arena",
  URF: "URF",
  ONEFORALL: "One for All",
  NEXUSBLITZ: "Nexus Blitz",
  STRAWBERRY: "Swarm",
  TUTORIAL: "Tutorial",
};

export function queueLabel(queueId, gameMode) {
  return (
    QUEUE[queueId] ?? MODE[gameMode] ?? (gameMode || `Queue ${queueId ?? "?"}`)
  );
}

/* ── champion data ────────────────────────────────────────────────────────
   `name` is what humans read, `file` is the DDragon id used in art URLs, and
   `key` is the numeric id Riot puts in match payloads. Cached six hours — this
   must never become a request per command. */
let champCache = { at: 0, byId: new Map(), byName: new Map(), version: "16.15.1" };
const CHAMP_TTL = 6 * 60 * 60 * 1000;

export async function championData() {
  if (Date.now() - champCache.at < CHAMP_TTL && champCache.byId.size) return champCache;
  try {
    const version = (await (await fetch(`${CDN}/_current_version.txt`)).text()).trim();
    const data = await (await fetch(`${CDN}/${version}/data/en_US/champion.json`)).json();
    const byId = new Map();
    const byName = new Map();
    // FIRST WINS, deliberately. Our CDN's champion.json carries variant
    // entries (e.g. id "Jade_Alistar" with name "Alistar") alongside the real
    // champions. Letting a later entry overwrite meant asking for Alistar and
    // getting the variant's art. DDragon lists canonical champions first, so
    // refusing to overwrite keeps the real one.
    for (const c of Object.values(data.data ?? {})) {
      const entry = { name: c.name, file: c.id, key: Number(c.key) };
      if (!byId.has(entry.key)) byId.set(entry.key, entry);
      // Index on both the display name and the id, lowercased and stripped of
      // punctuation, so "kaisa", "Kai'Sa" and "KaiSa" all resolve.
      const nName = normalize(c.name);
      const nId = normalize(c.id);
      if (!byName.has(nName)) byName.set(nName, entry);
      if (!byName.has(nId)) byName.set(nId, entry);
    }
    if (byId.size) champCache = { at: Date.now(), byId, byName, version };
  } catch (e) {
    console.warn("[loldata] champion map failed:", e?.message ?? e);
  }
  return champCache;
}

export const normalize = (s) =>
  String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Champion art. VERSIONED — an unversioned path 404s and Discord silently
 *  drops a thumbnail it cannot fetch. */
export const champIcon = (file, version) => `${CDN}/${version}/img/champion/${file}.png`;

/** Rank crests live at the CDN ROOT, unlike champion art. */
export const rankIcon = (tier) =>
  tier ? `${CDN}/ranks/${String(tier).toLowerCase()}.png` : null;

export const TIER_EMOJI = {
  IRON: "⚫", BRONZE: "🟤", SILVER: "⚪", GOLD: "🟡", PLATINUM: "🔷",
  EMERALD: "🟢", DIAMOND: "💎", MASTER: "🟣", GRANDMASTER: "🔴", CHALLENGER: "👑",
};

const APEX = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

/** "🟣 Master · 373 LP" — apex tiers have no divisions even though Riot
 *  still sends "I" for them. */
export function rankText(tier, division, lp) {
  if (!tier) return "Unranked";
  const pretty = tier.charAt(0) + tier.slice(1).toLowerCase();
  const rank = APEX.has(tier) ? pretty : `${pretty}${division ? ` ${division}` : ""}`;
  return `${TIER_EMOJI[tier] ?? "◈"} ${rank}${lp != null ? ` · ${lp} LP` : ""}`;
}

export const fmtNum = (n) =>
  n >= 1_000_000 ? `${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0);

export const fmtClock = (s) =>
  `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function timeAgo(ms) {
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export const kdaRatio = (k, d, a) => (d === 0 ? "Perfect" : ((k + a) / d).toFixed(2));

export function profileUrl(region, name, tag) {
  if (!name || !tag) return null;
  return `${SITE}/summoners/${String(region).toLowerCase()}/${encodeURIComponent(
    String(name).replace(/\s+/g, "+")
  )}-${encodeURIComponent(tag)}`;
}

/* ── lobby resolution ─────────────────────────────────────────────────────
   A slash command knows only the channel it was typed in. The bridge is
   `scout_lobby_webhooks.channel_id`, filled in when the feed was connected. */
export async function lobbyForChannel(channelId) {
  const { data, error } = await supabaseBox
    .from("scout_lobby_webhooks")
    .select("lobby_slug, label")
    .eq("channel_id", channelId)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[loldata] lobby lookup:", error.message);
    return null;
  }
  return data ?? null;
}

export const NO_LOBBY =
  "This channel isn't connected to a scout lobby. Connect the feed in the lobby's " +
  "**Edit → Discord** panel, or pass `lobby:<slug>`.";

/**
 * Resolve the lobby a command should act on: explicit option wins, else the
 * channel binding. Returns null and replies for you when there is neither.
 */
export async function resolveLobby(interaction) {
  const explicit = interaction.options.getString("lobby");
  if (explicit) return { slug: explicit, label: null };
  const hook = await lobbyForChannel(interaction.channelId);
  if (!hook) {
    await interaction.editReply(NO_LOBBY);
    return null;
  }
  return { slug: hook.lobby_slug, label: hook.label };
}

/** GET a loldata endpoint, returning null (and replying) on failure. */
export async function api(interaction, path, init) {
  try {
    const res = await fetch(`${API}${path}`, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error(`[loldata] ${path}:`, e?.message ?? e);
    await interaction.editReply("The loldata service didn't answer. Try again in a moment.");
    return null;
  }
}

/** Every lobby command takes the same optional slug override. */
export const lobbyOption = (o) =>
  o
    .setName("lobby")
    .setDescription("Lobby slug (only needed in a channel with no scout feed)")
    .setRequired(false);
