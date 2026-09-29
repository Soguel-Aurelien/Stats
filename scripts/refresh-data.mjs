import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { leagues, parseEspnLeaders, parseSflPlayers } from './providers.mjs';

const output = new URL('../src/main/resources/public/data/stats.json', import.meta.url);
const memo = new Map();
async function json(url, headers = {}) {
  const target = new URL(url);
  target.protocol = 'https:';
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(target, { headers, signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${target.pathname}`);
      return await response.json();
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}
function lookup(url) {
  if (!memo.has(url)) memo.set(url, json(url));
  return memo.get(url);
}
async function mapLimit(items, callback) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(8, items.length) }, async () => {
    while (cursor < items.length) { const i = cursor++; results[i] = await callback(items[i]); }
  }));
  return results;
}
async function espn(league) {
  const base = `https://sports.core.api.espn.com/v2/sports/soccer/leagues/${league.id}`;
  const info = await json(base);
  const season = info.season;
  if (!season?.year || !season.leaders?.$ref) throw new Error('Keine aktuelle ESPN-Saison.');
  const leadersUrl = new URL(season.leaders.$ref);
  leadersUrl.searchParams.set('limit', '1000');
  const candidates = parseEspnLeaders(await json(leadersUrl));
  const players = await mapLimit(candidates, async p => {
    const [athlete, ...teams] = await Promise.all([lookup(p.athleteRef), ...p.teamRefs.map(lookup)]);
    if (!athlete.displayName || teams.some(t => !t.displayName)) throw new Error('Spieler- oder Vereinsname fehlt.');
    const { athleteRef, teamRef, teamRefs, ...stats } = p;
    const clubs = teams.map(t => ({ name: t.displayName, logo: t.logos?.find(l => l.rel?.includes('default'))?.href || t.logos?.[0]?.href || null }));
    return { ...stats, name: athlete.displayName, team: teams.map(t => t.displayName).join(' / '), clubs, url: `https://www.espn.com/soccer/player/_/id/${p.id}` };
  });
  return { ...league, season: `${season.year}/${String(season.year + 1).slice(2)}`, seasonStart: season.startDate, seasonEnd: season.endDate, fetchedAt: new Date().toISOString(), source: { name: 'ESPN', url: `https://www.espn.com/soccer/stats/_/league/${league.id}/season/${season.year}` }, players };
}
const competition = 'e0lck99w8meo9qoalfrxgo33o';
async function sflQuery(procedure, input) {
  // Public site identifier shipped by sfl.ch, not a personal API credential.
  const result = await json(`https://origins-webex-orchestrator.origins-digital.com/trpc/${procedure}?input=${encodeURIComponent(JSON.stringify(input))}`, { 'x-account-key': 'Os-hXumIK' });
  if (!result.result?.data) throw new Error('SFL: Keine Daten in der Antwort.');
  return result.result.data;
}
async function sfl(league) {
  const seasons = await sflQuery('seasonsRouter.getSeasonsByCompetition', { competitionProviderIds: competition });
  const season = seasons.find(s => s.active === 'yes');
  if (!season || !/^\d{4}\/\d{4}$/.test(season.name)) throw new Error('SFL: Keine aktive Saison.');
  const pages = [];
  for (const sortKey of ['total goals', 'total assists']) {
    let cursor = 0;
    do {
      const page = await sflQuery('stats.getStats', { competitionProviderId: competition, seasonProviderId: season.providerId, order: 'desc', sortKey, statType: 'player', limit: 500, cursor, language: 'de' });
      if (!Array.isArray(page.players) || !Number.isInteger(page.totalItemsCount)) throw new Error('SFL: Ungültige Rangliste.');
      pages.push(page);
      cursor += page.players.length;
      if (cursor >= page.totalItemsCount) break;
      if (!page.players.length || cursor > 5000) throw new Error('SFL: Unvollständige Rangliste.');
    } while (true);
  }
  const players = parseSflPlayers(pages);
  if (!players.length) throw new Error('SFL: Keine Scorer verfügbar.');
  const year = Number(season.name.slice(0, 4));
  return { ...league, season: `${year}/${String(year + 1).slice(2)}`, seasonStart: `${year}-07-01T00:00:00Z`, seasonEnd: `${year + 1}-07-01T00:00:00Z`, fetchedAt: new Date().toISOString(), source: { name: 'Swiss Football League', url: 'https://sfl.ch/de/dashboard-stats/stats-superleague' }, players };
}

let previous;
try { previous = JSON.parse(await readFile(output, 'utf8')); } catch { /* First import. */ }
const results = [];
let failed = false;
for (const league of leagues) {
  try {
    const data = await (league.id === 'sui.1' ? sfl(league) : espn(league));
    results.push(data);
    console.log(`${league.name}: ${data.players.length} Spieler mit Torbeteiligung, Saison ${data.season}`);
  } catch (error) {
    failed = true;
    const saved = previous?.leagues.find(l => l.id === league.id);
    if (saved) results.push({ ...saved, refreshError: true });
    else results.push({ ...league, players: [], refreshError: true });
    console.error(`${league.name}: Abruf fehlgeschlagen (${error.message}). Vorhandener Datenstand bleibt erhalten.`);
  }
}
await mkdir(new URL('.', output), { recursive: true });
const temporary = fileURLToPath(output) + '.tmp';
await writeFile(temporary, JSON.stringify({ schemaVersion: 1, leagues: results }, null, 2) + '\n');
await rename(temporary, output);
if (failed) process.exitCode = 1;
