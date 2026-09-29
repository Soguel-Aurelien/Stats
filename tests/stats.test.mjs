import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ranking } from '../src/main/resources/public/rankings.js';
import { parseEspnLeaders, parseSflPlayers } from '../scripts/providers.mjs';
import { createServer } from '../scripts/serve.mjs';

test('rankings use numeric totals, preserve ties and exclude zero values', () => {
  const players = [
    { name: 'B', goals: 6, assists: 4, points: 10 },
    { name: 'A', goals: 4, assists: 6, points: 10 },
    { name: 'C', goals: 8, assists: 1, points: 9 },
    { name: 'D', goals: 0, assists: 0, points: 0 }
  ];
  assert.deepEqual(ranking(players, 'points').map(p => [p.name, p.rank]), [['A', 1], ['B', 1], ['C', 3]]);
  assert.equal(ranking(players, 'goals')[0].name, 'C');
  assert.equal(ranking(players, 'assists')[0].name, 'A');
  assert.equal(ranking(players, 'points', 1).length, 1);
  assert.equal(players[0].name, 'B');
});

function espnEntry(id, team, goals, assists, matches = 3) {
  return { athlete: { $ref: `https://example.com/athletes/${id}` }, team: { $ref: `https://example.com/teams/${team}` }, shortDisplayValue: `M: ${matches}, G: ${goals}: A: ${assists}` };
}
function espnData(entries) {
  return { categories: ['goals', 'assists'].map((key, index) => ({ name: `${key}Leaders`, leaders: entries.map(e => ({ ...e, value: Number(e.shortDisplayValue.match(index ? /A: (\d+)/ : /G: (\d+)/)[1]) })).sort((a, b) => b.value - a.value) })) };
}
test('ESPN combines transfer stints once and includes assist-only players', () => {
  const data = espnData([espnEntry(1, 1, 2, 1), espnEntry(1, 2, 1, 2), espnEntry(2, 1, 0, 5), espnEntry(3, 1, 0, 0)]);
  const players = parseEspnLeaders(data);
  assert.equal(players.length, 2);
  assert.deepEqual([players[0].goals, players[0].assists, players[0].points, players[0].matches], [3, 3, 6, 6]);
  assert.equal(players[0].teamRefs.length, 2);
  assert.equal(players[1].points, 5);
});
test('ESPN refuses incomplete lists and inconsistent counters', () => {
  assert.throws(() => parseEspnLeaders(espnData([espnEntry(1, 1, 1, 2)])), /abgeschnitten/);
  const data = espnData([espnEntry(1, 1, 2, 1), espnEntry(2, 1, 0, 0)]);
  data.categories[1].leaders[0].shortDisplayValue = 'M: 3, G: 3: A: 1';
  assert.throws(() => parseEspnLeaders(data), /Uneinheitliche/);
});
test('SFL includes players without CMS profiles and sparse zero counters', () => {
  const player = { name: 'A. Spieler', team: { name: 'Klub', providerId: '1' }, stats: [{ type: 'total games', value: '5' }, { type: 'total assists', value: '4' }] };
  const players = parseSflPlayers([{ players: [player] }, { players: [player] }]);
  assert.equal(players.length, 1);
  assert.equal(players[0].goals, 0);
  assert.equal(players[0].points, 4);
  assert(!players[0].url.includes('undefined'));
});
test('saved data includes all six sourced leagues with consistent counters', async () => {
  const data = JSON.parse(await readFile(new URL('../src/main/resources/public/data/stats.json', import.meta.url)));
  assert.equal(new Set(data.leagues.map(l => l.id)).size, 6);
  for (const league of data.leagues) {
    assert(!league.refreshError, league.name);
    assert(league.players.length > 20, league.name);
    assert(league.source.url.startsWith('https://'));
    assert(Number.isFinite(Date.parse(league.fetchedAt)));
    assert.equal(new Set(league.players.map(p => p.id)).size, league.players.length);
    for (const player of league.players) {
      assert.equal(player.points, player.goals + player.assists);
      assert(player.matches > 0);
      for (const key of ['goals', 'assists', 'points', 'matches']) assert(Number.isInteger(player[key]) && player[key] >= 0);
    }
  }
});
test('HTTP serves modules and data, rejects writes and private paths', async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ['/', '/styles.css', '/app.js', '/rankings.js', '/data/stats.json', '/favicon.svg']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    if (path.endsWith('.js')) assert.match(response.headers.get('content-type'), /javascript/);
    await response.text();
  }
  for (const path of ['/build.sbt', '/scripts/refresh-data.mjs', '/.env', '/%2e%2e/build.sbt']) assert.equal((await fetch(base + path)).status, 404);
  const head = await fetch(base, { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  assert.equal((await fetch(base, { method: 'POST' })).status, 405);
});
