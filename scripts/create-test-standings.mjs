// Creates fictional results locally. Never requests results or tables from a provider.
import { readFile, writeFile } from 'node:fs/promises';

const directory = new URL('../src/main/resources/public/data/', import.meta.url);
const data = JSON.parse(await readFile(new URL('stats.json', directory), 'utf8'));
const expected = { 'eng.1': 20, 'ger.1': 18, 'ita.1': 20, 'esp.1': 20, 'fra.1': 18, 'sui.1': 12 };
const leagues = data.leagues.map(league => {
  // The saved snapshot contains each participating club; reject incomplete snapshots.
  const names = [...new Set(league.players.flatMap(player => (player.clubs || [{ name: player.team }]).map(club => club.name)))].sort((a, b) => a.localeCompare(b, 'de'));
  if (names.length !== expected[league.id]) throw new Error(`Unvollständige Vereinsliste: ${league.name}`);
  const teams = names.map(name => ({ name, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }));
  const schedule = [...teams];
  // Six rounds of a round-robin schedule give internally consistent test counters.
  for (let round = 0; round < 6; round++) {
    for (let pair = 0; pair < schedule.length / 2; pair++) {
      const home = schedule[pair], away = schedule[schedule.length - 1 - pair];
      const goalsHome = (round + pair * 3) % 5, goalsAway = (round * 2 + pair) % 4;
      home.played++; away.played++;
      home.goalsFor += goalsHome; home.goalsAgainst += goalsAway;
      away.goalsFor += goalsAway; away.goalsAgainst += goalsHome;
      if (goalsHome === goalsAway) { home.drawn++; away.drawn++; }
      else if (goalsHome > goalsAway) { home.won++; away.lost++; }
      else { away.won++; home.lost++; }
    }
    schedule.splice(1, 0, schedule.pop());
  }
  for (const team of teams) team.points = team.won * 3 + team.drawn;
  teams.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor || a.name.localeCompare(b.name, 'de'));
  return { id: league.id, season: league.season, teams };
});
await writeFile(new URL('standings.json', directory), JSON.stringify({ schemaVersion: 1, mode: 'test', leagues }, null, 2) + '\n');
console.log(`Testtabellen für ${leagues.length} Ligen gespeichert.`);
