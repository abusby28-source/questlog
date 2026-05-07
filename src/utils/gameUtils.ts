import type { LauncherGame } from '../types';
import type { Game } from '../types';

export function parseAchievements(game: LauncherGame): { unlocked: number; total: number } | null {
  if (!game.achievements) return null;
  try {
    const achs = JSON.parse(game.achievements) as { unlocked: boolean }[];
    if (achs.length === 0) return null;
    return { unlocked: achs.filter(a => a.unlocked).length, total: achs.length };
  } catch { return null; }
}

export function isProgressGame(game: LauncherGame): boolean {
  const nonProgress = /\b(party|sports|sport|racing|massively multiplayer|mmo|pinball|board game|card game)\b/i;
  const titleNonProgress = /\bjackbox\b|\bpummel party\b|\bfall guys\b|\bamong us\b|\bfifa\b|\bea fc\b|\bnba 2k\b|\bforza\b|\bneed for speed\b|\bwipeout\b/i;
  if (game.genre && nonProgress.test(game.genre)) return false;
  if (game.tags && nonProgress.test(game.tags)) return false;
  if (titleNonProgress.test(game.title)) return false;
  return true;
}

// Returns playtime progress 0–1 using HLTB main story hours, or null if unavailable
export function hltbProgress(game: LauncherGame): number | null {
  if (!game.hltb_main || game.hltb_main <= 0) return null;
  return Math.min(1, game.playtime / (game.hltb_main * 60));
}

export function scoreJumpBackIn(game: LauncherGame): number {
  let score = 0;
  if (game.last_played) {
    const days = (Date.now() - new Date(game.last_played).getTime()) / 86400000;
    score += Math.max(0, 60 - days * 2); // recency: up to 60pts, decays over 30 days
  }
  // Achievement progress
  if (game.achievements) {
    try {
      const achs = JSON.parse(game.achievements) as { unlocked: boolean }[];
      if (achs.length > 0) {
        const pct = achs.filter(a => a.unlocked).length / achs.length;
        if (pct >= 0.9) score += 45;
        else if (pct >= 0.6) score += 30 + (pct - 0.6) * 50;
        else if (pct >= 0.3) score += pct * 20;
      }
    } catch { /* ignore */ }
  }
  // HLTB playtime progress (bonus for games close to completion)
  const hpct = hltbProgress(game);
  if (hpct !== null) {
    if (hpct >= 0.8) score += 40;
    else if (hpct >= 0.5) score += 20 + hpct * 20;
    else if (hpct >= 0.2) score += hpct * 15;
  }
  return score;
}

export function jumpBackInTag(game: LauncherGame): { label: string; color: string } {
  const pick = (options: string[]) => options[game.id % options.length];
  const days = game.last_played ? (Date.now() - new Date(game.last_played).getTime()) / 86400000 : null;
  const progress = isProgressGame(game);
  const hpct = hltbProgress(game);

  // Achievement-based completion (always relevant regardless of game type)
  if (game.achievements) {
    try {
      const achs = JSON.parse(game.achievements) as { unlocked: boolean }[];
      if (achs.length > 0) {
        const pct = achs.filter(a => a.unlocked).length / achs.length;
        if (pct >= 0.9) return { label: pick(['So close to finishing', 'One final push', 'Almost there', 'The finish line is right there']), color: 'text-orange-400' };
        if (pct >= 0.7) return { label: pick(['Close to finishing', 'The end is in sight', 'Finish what you started', 'Nearly done']), color: 'text-yellow-400' };
        if (pct >= 0.5) return { label: pick(['Good progress — keep going', "You're on a roll", 'Halfway there', 'More than halfway done']), color: 'text-emerald-400' };
        if (pct >= 0.3) return { label: pick(['Building momentum', 'Getting into it', 'Making your mark', 'Just warming up']), color: 'text-blue-400' };
      }
    } catch { /* ignore */ }
  }

  // HLTB-based playtime progress (only for story/progress games)
  if (progress && hpct !== null) {
    if (hpct >= 0.9) return { label: pick(['Almost at the credits', 'One final push', 'So close to finishing', 'The end is near']), color: 'text-orange-400' };
    if (hpct >= 0.7) return { label: pick(['The end is in sight', 'Close to finishing', 'Nearly there', `${Math.round(hpct * 100)}% through`]), color: 'text-yellow-400' };
    if (hpct >= 0.5) return { label: pick(['More than halfway done', "You're on a roll", 'Good progress', `${Math.round(hpct * 100)}% through`]), color: 'text-emerald-400' };
    if (hpct >= 0.25) return { label: pick(['Getting into it', 'Building momentum', 'Making your mark', 'Warming up nicely']), color: 'text-blue-400' };
  }

  if (days === null) return { label: 'Unfinished business', color: 'text-white/40' };

  // Non-progress games (party, sports, etc.) get neutral recency-based tags
  if (!progress) {
    if (days < 3)  return { label: pick(['Jump back in', 'Play again?', 'Still fresh']), color: 'text-blue-400' };
    if (days < 14) return { label: pick(["Been a few days", 'Round two?', 'Time for another session']), color: 'text-emerald-400' };
    if (days < 60) return { label: pick(["Ready for another round?", 'Fire it back up', "It's been a while"]), color: 'text-yellow-400' };
    return { label: pick(['Long time no see', 'Dust it off', 'Worth another session']), color: 'text-white/40' };
  }

  // Recently started but hasn't returned (< 2h played, > 3 days away)
  if ((game.playtime ?? 0) < 120 && days > 3) {
    return { label: pick(["You barely scratched the surface", "Give it a proper chance", "The real game hasn't begun", "Just getting started"]), color: 'text-blue-400' };
  }

  // Started a while ago with low playtime — likely abandoned early
  if ((game.playtime ?? 0) < 300 && days > 30) {
    return { label: pick(["Left before it got good", "Give it another shot", "It gets better — trust us", "Pick it back up"]), color: 'text-yellow-400' };
  }

  if (days < 1)   return { label: pick(['Just picked up', 'Fresh session', 'Still in the zone', 'Right where you left it']), color: 'text-blue-400' };
  if (days < 3)   return { label: pick(['Pick up where you left off', 'Still fresh', 'Jump right back in', 'Keep the momentum going']), color: 'text-emerald-400' };
  if (days < 7)   return { label: pick(["Don't lose your momentum", 'Keep the streak alive', "Been a few days", 'Your save is waiting']), color: 'text-emerald-400' };
  if (days < 14)  return { label: pick(["It's been a week", 'Left on a cliffhanger?', "Don't let it gather dust", "Time to get back at it"]), color: 'text-yellow-400' };
  if (days < 30)  return { label: pick(['It misses you', 'Almost forgotten', 'Ready to return?', "Where did you leave off?"]), color: 'text-yellow-400' };
  if (days < 90)  return { label: pick(['Time to revisit', 'Unfinished business', 'Your save file awaits', 'The story continues']), color: 'text-orange-400' };
  if (days < 365) return { label: pick(['Long time no see', "Left before it got good?", 'Dust it off', 'Give it another chance']), color: 'text-red-400' };
  return { label: pick(['A blast from the past', 'Rediscover this one', 'A forgotten adventure', 'Like playing it for the first time']), color: 'text-white/50' };
}

export function getSteamId(game: Game | LauncherGame): string | null {
  if ('platform' in game && game.platform === 'steam') {
    return game.external_id;
  } else if ('steam_url' in game && game.steam_url) {
    const match = game.steam_url.match(/\/app\/(\d+)/);
    if (match) return match[1];
  }
  return null;
}

export function buildTagline(
  tags: { tag: string; count: number }[],
  topGame?: { title: string; playtime: number } | null,
  recentGameTitle?: string | null,
  libraryCount = 0
): string {
  // Deterministic daily rotation — changes each day, consistent all day
  const dayIndex = Math.floor(Date.now() / 86400000);
  const pick = <T,>(arr: T[]): T => arr[dayIndex % arr.length];

  const topTagNames = tags.slice(0, 5).map(t => t.tag.toLowerCase());
  const has = (t: string) => topTagNames.some(n => n.includes(t));
  const topHours = topGame ? Math.round(topGame.playtime / 60) : 0;
  const clip = (s: string, n = 24) => s.length > n ? s.slice(0, n - 1) + '…' : s;
  const topTitle = topGame ? clip(topGame.title) : null;
  const recentTitle = recentGameTitle ? clip(recentGameTitle) : null;

  if (topHours > 500 && topTitle) return pick([
    `${topHours} hours in ${topTitle}. The game has a family now.`,
    `${topTitle} isn't just a game at this point. It's a lifestyle.`,
    `${topHours}h in ${topTitle}. Someone should check on them.`,
  ]);
  if (topHours > 300 && topTitle) return pick([
    `${topHours}h in ${topTitle}. A cry for help disguised as a hobby.`,
    `${topTitle}: ${topHours} hours deep. No signs of stopping.`,
    `Doctors hate this one weird trick: ${topTitle} for ${topHours} hours.`,
  ]);
  if (topHours > 150 && topTitle) return pick([
    `Currently in a very committed, very unhealthy relationship with ${topTitle}.`,
    `${topTitle} said 'just one more hour' ${topHours} times. They agreed every time.`,
    `${topHours}h in ${topTitle}. The couch has a permanent imprint now.`,
  ]);
  if (topHours > 80 && topTitle && has('singleplayer')) return pick([
    `Told themselves ${topTitle} was a 'quick one'. That was ${topHours} hours ago.`,
    `${topTitle}: started as a weekend thing. ${topHours}h later, here we are.`,
    `'Nearly done' with ${topTitle}. Has been nearly done for ${topHours} hours.`,
  ]);

  if (has('souls') || has('souls-like')) return pick([
    recentTitle ? `${recentTitle} said 'you died' and they said 'yeah, I know, again please'.` : "Sees a 'You Died' screen and thinks 'nice, free tutorial'.",
    "Loses to the same boss 30 times and calls it a skill issue. Fixed it. New skill issue.",
    recentTitle ? `${recentTitle} is destroying them. They are having the time of their life.` : "Enjoys pain. Has the platinum trophies to prove it.",
    "Tells people games are too easy. Plays only Souls games. Coincidence.",
  ]);
  if (has('roguelike') || has('roguelite')) return pick([
    topTitle ? `${topHours}h of dying in ${topTitle} and going back for more. Undefeated. Technically.` : "Died 400 times and called it a strategic learning curve. Sure.",
    "'Just one more run' has been the plan for six hours.",
    topTitle ? `${topTitle}: same dungeon, different disaster, every single time.` : "Knows every way to die. Working on finding more.",
    "The run is never truly over. It just pauses.",
  ]);
  if (has('horror') && has('singleplayer')) return pick([
    recentTitle ? `Playing ${recentTitle} alone at 2am. Totally fine. Sleeping with the light on, but fine.` : "Plays horror games alone in the dark. Sends many distress signals. Denies all of them.",
    "Asked for a scary game. Got one. Regretting everything. Still playing.",
    recentTitle ? `${recentTitle} is genuinely terrifying. They're on hour four.` : "The jump scare got them. They will not be admitting that.",
  ]);
  if (has('horror')) return pick([
    "Picks the creepy game every time. Wonders why they can't sleep.",
    "There were clearly better options. Chose the horror game. Classic.",
    "Sleeps fine apparently. Somehow. Concerningly.",
  ]);
  if (has('stealth')) return pick([
    recentTitle ? `One guard spotted them in ${recentTitle}. Reloaded the save. Twice.` : "Reloads if a single NPC glances in their direction. Perfectionist. Unwell.",
    "Ghost run only. Lethal run only. No in between.",
    recentTitle ? `Spent 45 minutes waiting for a patrol in ${recentTitle}. Worth it.` : "The alarm went off once in 2019. Still haunted.",
    "Knocks out every guard then feels bad about it. Every time.",
  ]);
  if (has('open world') && has('rpg')) return pick([
    topTitle ? `${topHours}h in ${topTitle}. Still on the first island. No regrets.` : "The main quest? Never heard of her. Too busy doing literally everything else.",
    recentTitle ? `${recentTitle} has a main story apparently. Yet to investigate.` : "Completed every side quest. Forgot what the main quest was.",
    "Fast travelled once. Felt guilty about it for days.",
    topTitle ? `${topTitle}: map fully explored, main quest at 8%. Perfection.` : "The world is the point. The story is a suggestion.",
  ]);
  if (has('open world')) return pick([
    recentTitle ? `Somewhere in ${recentTitle} right now, picking flowers instead of saving the world.` : "Fast travel exists. They walk everywhere anyway. It's about the journey.",
    "Saw a mountain. Had to climb it. Forgot the mission.",
    recentTitle ? `The map in ${recentTitle} is basically fully explored. The story: untouched.` : "Objective marker? That's a suggestion.",
  ]);
  if (has('fps') && has('competitive')) return pick([
    "Blames the ping. Blames the teammates. Blames the mouse. Never themselves.",
    "Top fragged. Carries never acknowledged. Throws always someone else's fault.",
    "Has a 'real rank' that is definitely higher than their current rank.",
    "'One more game' to fix the rank. Rank remains. Games continue.",
  ]);
  if (has('fps') || has('shooter')) return pick([
    recentTitle ? `Skipped every cutscene in ${recentTitle}. Zero clue what's happening. Thriving.` : "Shoots first, reads the briefing never, asks questions eventually.",
    "The story is loading. They are already shooting.",
    recentTitle ? `Finished ${recentTitle}. Could not tell you a single plot point.` : "Tutorials skipped. Lore ignored. Vibes: immaculate.",
  ]);
  if (has('strategy') && has('turn-based')) return pick([
    topTitle ? `One turn in ${topTitle} takes 40 minutes. They call it 'being thorough'.` : "Pauses a turn-based game to think harder. The game was already paused.",
    "'It's turn-based, I can take my time.' Takes all of the time.",
    "Optimises everything. Wins. Immediately starts optimising the win.",
    recentTitle ? `${recentTitle}: the plan was perfect. The execution was also perfect. Somehow still nervous.` : "Has a spreadsheet open alongside the game. It helps. Allegedly.",
  ]);
  if (has('strategy') || has('rts')) return pick([
    "Opens the game with a plan. The plan lasts approximately four minutes.",
    "Built too many barracks. Ran out of money. Blames the AI.",
    "'I had it under control' — someone who did not have it under control.",
  ]);
  if (has('co-op')) return pick([
    "Will not play anything that can't be done with a mate. Non-negotiable.",
    "Solo mode exists. Has never opened it. Never will.",
    recentTitle ? `${recentTitle} but make it a two-person chaos simulator.` : "Better with friends. Refuses to verify this with data.",
  ]);
  if (has('multiplayer') && has('competitive')) return pick([
    "Has strong opinions about ranked. Mostly screamed into a headset.",
    "Competitive mode only. Casual mode is for cowards apparently.",
    "Current rank does not reflect true skill. The true skill is much higher. Trust.",
  ]);
  if (has('multiplayer')) return pick([
    "The single-player campaign is still in the wrapper. Genuinely fine with that.",
    "Solo queue king/queen. The teammates are the variable. Always.",
    "Has never read the patch notes. Somehow always knows what changed.",
  ]);
  if (has('survival')) return pick([
    topTitle ? `${topHours}h in ${topTitle} and hasn't touched the main quest. The base is immaculate though.` : "Built a six-floor base before the first night. Overachiever. Absolutely.",
    "Day one priority: base. Day two priority: bigger base. Story: optional.",
    recentTitle ? `${recentTitle}: survived. Thrived. Built a castle. Still nervous.` : "The crafting system has been fully mastered. The plot has not been started.",
  ]);
  if (has('simulation')) return pick([
    topTitle ? `Has ${topHours}h in ${topTitle}. Also has a life, allegedly.` : "Managing a fictional farm/city/airline better than any real responsibility.",
    "The crops will not water themselves. Real life can wait.",
    recentTitle ? `${recentTitle} is basically a second job at this point. Unpaid. Preferred.` : "Optimised the supply chain in a game. Cannot find matching socks in real life.",
  ]);
  if (has('puzzle')) return pick([
    "Googles the solution after 30 seconds, then claims they 'almost had it'.",
    "Stared at it for an hour. The answer was obvious. This information is private.",
    "Galaxy-brained the easy puzzle. Missed the obvious one. Balanced.",
    recentTitle ? `${recentTitle} broke their brain. They are thriving.` : "The puzzle was solved eventually. No further questions.",
  ]);
  if (has('platformer')) return pick([
    recentTitle ? `'One more attempt' in ${recentTitle} has been going for three hours.` : "One more life. Just one more. One. More.",
    "The hitbox was wrong. It is always the hitbox.",
    "Collected every single thing in a level that did not require it. Zero regrets.",
    recentTitle ? `${recentTitle}: fell off the same ledge 11 times. Notes have been taken.` : "Precision platforming: the art of falling with confidence.",
  ]);
  if (has('indie')) return pick([
    `${libraryCount} games in the library. At least half are from a sale they forgot about.`,
    "Bought 40 indie games on sale. Played six. Outstanding value.",
    "The hidden gem hunter. Has found several. Still searching.",
    recentTitle ? `${recentTitle} has 200 reviews on Steam. All of them are correct.` : "Supports indie devs. Spiritually. By buying and not playing.",
  ]);
  if (has('singleplayer') && has('rpg')) return pick([
    recentTitle ? `Currently in ${recentTitle}, 60 hours deep, on a side quest about a farmer's missing goat.` : "Named their character something embarrassing. Now 80 hours in. No way back.",
    topTitle ? `The lore of ${topTitle} is fully understood. The plot is irrelevant.` : "Every NPC has a name, a backstory, and has been spoken to twice.",
    recentTitle ? `${recentTitle}: sidequests done, map cleared, main story at 3%.` : "Completed every optional dungeon. The story can wait indefinitely.",
    "Reads every item description. Knows the whole lore. Unhinged. Respected.",
  ]);
  if (has('singleplayer') && has('action')) return pick([
    "Plays on the hardest difficulty. Tells no one. Suffers privately. Loves it.",
    recentTitle ? `${recentTitle} on max difficulty. For fun apparently.` : "Normal mode? An insult. Easy mode? Unthinkable.",
    "No story skips. No fast travel. Full immersion. Full suffering.",
  ]);
  if (has('rpg')) return pick([
    topTitle ? `${topHours}h in ${topTitle} and the main story is 12% complete. The vibes are immaculate.` : "Every side quest is the main quest, actually.",
    "Spent two hours in the character creator. Worth every minute.",
    recentTitle ? `${recentTitle}: the side content alone is a 60-hour game. Doing all of it.` : "The inventory is organised. The story is not. Priorities.",
    "Built the perfect character build. Restarted to try a different one.",
  ]);
  if (has('action')) return pick([
    recentTitle ? `Skipped every cutscene in ${recentTitle}. Blissfully confused. Having a great time.` : "No cutscene survives. No objective is read. No notes are taken.",
    "The tutorial said to dodge. They did not dodge. Learned eventually.",
    recentTitle ? `${recentTitle}: vibes-based playthrough. No map checked. Zero regrets.` : "Plays by feel. The feel is often wrong. Still confident.",
  ]);
  if (has('adventure')) return pick([
    "Clicks on every single thing in every single room. You know who you are.",
    recentTitle ? `Talked to every NPC in ${recentTitle}. Twice. Just in case.` : "Read every piece of in-game lore. Voluntarily.",
    "Explores left first. Always left. Don't ask why.",
  ]);
  if (has('sci-fi') || has('science fiction')) return pick([
    "Fully convinced they'd survive the apocalypse. The prep work helps.",
    recentTitle ? `${recentTitle} has explained exactly why the science checks out.` : "Has opinions on fictional faster-than-light travel. Strong ones.",
    "The spaceship controls make complete sense to them. To them.",
  ]);
  if (has('fantasy')) return pick([
    "Has strong lore opinions about a world that doesn't exist. Valid.",
    recentTitle ? `Could explain the entire history of ${recentTitle}'s world. Unprompted.` : "Knows the magic system better than their own tax bracket.",
    "Named their sword. Knows its backstory. It's complicated.",
  ]);
  if (has('sports') || has('racing')) return pick([
    "Manual transmission only. Will bring it up unprompted.",
    "Simulation settings on. Assists off. Suffers authentically.",
    recentTitle ? `Lost in ${recentTitle}. Immediately queued up again. This is fine.` : "Career mode fully committed. Real sports: a distant memory.",
  ]);
  if (topTitle && topHours > 20) return pick([
    `${topHours}h in ${topTitle} and counting. Send snacks.`,
    `${topTitle}: ${topHours} hours logged. The end is not yet in sight.`,
    `Currently ${topHours} hours into ${topTitle}. This is going great.`,
  ]);
  if (tags.length > 0) return pick([
    `Deep into ${tags[0].tag} games and absolutely no one is surprised.`,
    `A ${tags[0].tag} enthusiast. Unashamed. Undefeated.`,
    `${tags[0].tag} is not just a genre. It's a personality trait.`,
  ]);
  return pick([
    "A library this big needs its own postcode.",
    "The backlog grows. The hours shrink. The spirit remains.",
    "Collecting games is a hobby. Playing them is optional.",
  ]);
}

export function getCountdown(releaseDateStr: string | undefined | null): { days: number; hours: number; minutes: number; isImminent: boolean } | null {
  if (!releaseDateStr || releaseDateStr === 'Unknown') return null;
  const parsed = new Date(releaseDateStr);
  if (isNaN(parsed.getTime())) return null;
  const diff = parsed.getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { days, hours, minutes, isImminent: days <= 7 };
}
