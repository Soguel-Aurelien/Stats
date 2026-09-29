export const leagues = [
  { id: 'eng.1', name: 'Premier League', country: 'England', flag: 'eng', short: 'PL' },
  { id: 'ger.1', name: 'Bundesliga', country: 'Deutschland', flag: 'de', short: 'BL' },
  { id: 'ita.1', name: 'Serie A', country: 'Italien', flag: 'it', short: 'SA' },
  { id: 'esp.1', name: 'LaLiga', country: 'Spanien', flag: 'es', short: 'LL' },
  { id: 'fra.1', name: 'Ligue 1', country: 'Frankreich', flag: 'fr', short: 'L1' },
  { id: 'sui.1', name: 'Super League', country: 'Schweiz', flag: 'ch', short: 'SL' }
];

export function parseEspnLeaders(data) {
  const categories = ['goalsLeaders', 'assistsLeaders'].map(name => data.categories?.find(c => c.name === name));
  if (categories.some(c => !c?.leaders?.length)) throw new Error('ESPN: Tore oder Assists fehlen.');
  // The high limit must include the zero-value tail, not just a truncated top list.
  if (categories.some(c => c.leaders.at(-1).value !== 0)) throw new Error('ESPN: Rangliste möglicherweise abgeschnitten.');
  const players = new Map();
  for (const category of categories) for (const entry of category.leaders) {
    const id = entry.athlete?.$ref?.match(/\/athletes\/(\d+)/)?.[1];
    const match = entry.shortDisplayValue?.match(/^M: (\d+), G: (\d+): A: (\d+)$/);
    if (!id || !match || !entry.team?.$ref) throw new Error('ESPN: Unbekanntes Statistikformat.');
    const [matches, goals, assists] = match.slice(1).map(Number);
    if (entry.value !== (category.name === 'goalsLeaders' ? goals : assists)) throw new Error('ESPN: Widersprüchliche Werte.');
    const key = `${id}:${entry.team.$ref}`;
    const previous = players.get(key);
    if (previous && (previous.goals !== goals || previous.assists !== assists)) throw new Error('ESPN: Uneinheitliche Spielerwerte.');
    players.set(key, { id, matches, goals, assists, points: goals + assists, athleteRef: entry.athlete.$ref, teamRef: entry.team.$ref });
  }
  const totals = new Map();
  for (const stint of players.values()) {
    if (!stint.matches) continue;
    const total = totals.get(stint.id);
    if (total) {
      for (const key of ['matches', 'goals', 'assists', 'points']) total[key] += stint[key];
      total.teamRefs.push(stint.teamRef);
    } else totals.set(stint.id, { ...stint, teamRefs: [stint.teamRef] });
  }
  return [...totals.values()].filter(p => p.points > 0);
}

export function parseSflPlayers(pages) {
  const players = new Map();
  for (const page of pages) for (const p of page.players) {
    const stats = new Map(p.stats.map(s => [s.type, s.value]));
    // SFL omits zero counters; fetching BOTH goals and assists includes assist-only players.
    const number = key => {
      const value = Number(stats.get(key) ?? 0);
      if (!Number.isInteger(value) || value < 0) throw new Error('SFL: Ungültiger Zähler.');
      return value;
    };
    if (!p.name || !p.team?.name || !stats.has('total games')) throw new Error('SFL: Unvollständiger Spieler.');
    const goals = number('total goals'), assists = number('total assists');
    const row = { id: `${p.name}:${p.team.providerId || p.team.name}`, name: p.name, team: p.team.name, matches: number('total games'), goals, assists, points: goals + assists, url: p.slug ? `https://sfl.ch/de/players/${encodeURIComponent(p.slug)}` : 'https://sfl.ch/de/dashboard-stats/stats-superleague' };
    row.clubs = [{ name: p.team.name, logo: p.team.logoUrl || null }];
    const countries = (p.nationality || '').split(' / ').filter(Boolean);
    row.nationalities = countries.map((name, index) => {
      const id = index === 0 ? p.nationalityId : p.secondNationalityId;
      return { name, flag: id ? `https://origins-common-assets.origins-digital.com/sport-assets/opta_sd/country_flag/${encodeURIComponent(id)}@3x.png` : null };
    });
    const previous = players.get(row.id);
    if (previous && (previous.goals !== goals || previous.assists !== assists)) throw new Error('SFL: Uneinheitliche Spielerwerte.');
    if (row.points > 0) players.set(row.id, row);
  }
  return [...players.values()];
}
