import { ranking } from './rankings.js';

const $ = selector => document.querySelector(selector);
const metrics = { goals: { title: 'Torschützen', card: 'Top-Torschütze' }, assists: { title: 'Assist-Rangliste', card: 'Top-Vorlagengeber' }, points: { title: 'Scorer-Rangliste', card: 'Top-Scorer' } };
let dataset, standingsData, league, metric = 'standings';
const limit = 15;
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function safeLink(url) {
  try { const parsed = new URL(url); if (parsed.protocol === 'https:') return parsed.href; } catch { /* No external link. */ }
  return '#';
}
function playerIdentity(player) {
  const identity = el('span', 'player-identity');
  identity.append(playerName(player, 'player-name'), clubNames(player, 'player-team'));
  return identity;
}
function badge(url, className, label) {
  const img = el('img', className);
  const allowed = ['a.espncdn.com', 'origins-sportlab-payload-s3.origins-digital.com'];
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !allowed.includes(parsed.hostname)) return null;
    img.src = parsed.href;
  } catch { return null; }
  img.alt = label; img.title = label; img.width = 20; img.height = 16;
  img.referrerPolicy = 'no-referrer';
  img.addEventListener('error', () => { img.replaceWith(el('span', 'badge-fallback', label)); });
  return img;
}
function playerName(player, className) {
  const name = el('span', className);
  name.append(el('span', '', player.name));
  return name;
}
function clubNames(player, className) {
  const clubs = el('span', className);
  for (const club of player.clubs || [{ name: player.team }]) {
    const item = el('span', 'club-identity');
    const logo = badge(club.logo, 'club-logo', '');
    if (logo) item.append(logo);
    item.append(document.createTextNode(club.name)); clubs.append(item);
  }
  return clubs;
}
function currentId() { return location.hash.slice(1) || 'eng.1'; }
function renderNav() {
  $('#league-nav').replaceChildren(...dataset.leagues.map(l => {
    const link = el('a', 'league-link'); link.href = `#${l.id}`;
    link.addEventListener('click', () => { metric = 'standings'; if (l.id === league.id) render(); });
    if (l.id === league.id) link.setAttribute('aria-current', 'page');
    const flag = el('span', `flag ${l.flag}`); flag.setAttribute('aria-hidden', 'true');
    link.append(flag, el('span', '', l.name)); return link;
  }));
}
function renderLeaders() {
  $('#leaders').replaceChildren(...Object.entries(metrics).map(([key, config]) => {
    const leaders = ranking(league.players, key, Infinity), first = leaders[0];
    const card = el('article', `leader-card ${key}`);
    const label = el('h3', 'card-label', config.card);
    const main = el('div', 'leader-main'), identity = el('div');
    if (first) identity.append(playerName(first, 'leader-name'), clubNames(first, 'leader-team'));
    else identity.append(el('p', 'leader-name', 'Noch keine Werte'));
    main.append(identity, el('span', 'leader-value', first ? String(first[key]) : '—'));
    card.append(label, main);
    return card;
  }));
}
function renderTable() {
  const rows = ranking(league.players, metric, limit);
  $('#ranking-title').textContent = metrics[metric].title;
  $('#table-caption').textContent = `${league.name}, Saison ${league.season || 'unbekannt'}: ${metrics[metric].title}, absteigend sortiert.`;
  $('#ranking-count').textContent = `Top ${rows.length}`;
  document.querySelectorAll('[data-column]').forEach(cell => { cell.classList.toggle('selected', cell.dataset.column === metric); cell.removeAttribute('aria-sort'); if (cell.dataset.column === metric) cell.setAttribute('aria-sort', 'descending'); });
  $('#ranking-body').replaceChildren(...rows.map(p => {
    const tr = el('tr'), rankCell = el('td'); rankCell.append(el('span', `rank${p.rank === 1 ? ' first' : ''}`, String(p.rank)));
    const identity = el('th'); identity.scope = 'row'; identity.append(playerIdentity(p));
    tr.append(rankCell, identity, el('td', 'numeric games-column', String(p.matches)));
    for (const key of Object.keys(metrics)) {
      const td = el('td', `numeric${key === metric ? ' selected' : ''}`, String(p[key]));
      tr.append(td);
    }
    return tr;
  }));
  $('#empty').hidden = rows.length > 0;
  $('#empty').textContent = league.players.length ? 'Für diese Rangliste sind noch keine Werte verfügbar.' : 'Die Daten dieser Liga sind momentan nicht verfügbar. Bitte lade den Datenstand später erneut.';
}
function renderStandings() {
  const table = standingsData?.leagues.find(item => item.id === league.id);
  const teams = table?.teams || [];
  $('#season').textContent = `Saison ${table?.season || '—'} · Testtabelle`;
  $('#team-count').textContent = `${teams.length} Mannschaften`;
  $('#standings-caption').textContent = `${league.name}, Saison ${table?.season || '—'}: vollständige Testtabelle, fiktive Werte.`;
  $('#standings-body').replaceChildren(...teams.map((team, index) => {
    const row = el('tr'), position = el('td');
    position.append(el('span', `rank${index === 0 ? ' first' : ''}`, String(index + 1)));
    const name = el('th'); name.scope = 'row';
    name.append(el('span', 'player-name', team.name));
    row.append(position, name);
    for (const key of ['played', 'won', 'drawn', 'lost']) row.append(el('td', 'numeric', String(team[key])));
    const difference = team.goalsFor - team.goalsAgainst;
    row.append(el('td', 'numeric', `${team.goalsFor}:${team.goalsAgainst}`), el('td', 'numeric', `${difference > 0 ? '+' : ''}${difference}`), el('td', 'numeric selected', String(team.points)));
    return row;
  }));
  $('#standings-empty').hidden = teams.length > 0;
  $('#standings-empty').textContent = standingsData ? 'Für diese Liga ist noch keine Testtabelle hinterlegt.' : 'Die Testtabellen konnten nicht geladen werden. Bitte lade die Seite erneut.';
}
function render() {
  league = dataset.leagues.find(l => l.id === currentId()) || dataset.leagues[0];
  renderNav();
  $('#league-title').textContent = league.name;
  $('#league-country').textContent = league.country;
  $('#league-flag').className = `flag large-flag ${league.flag}`;
  $('#season').textContent = `Saison ${league.season || '—'}`;
  const isStandings = metric === 'standings';
  document.title = `${league.name} · ${isStandings ? 'Tabelle' : metrics[metric].title} — Fotstats`;
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === metric)));
  $('#standings-panel').hidden = !isStandings;
  $('#ranking-panel').hidden = isStandings;
  $('#leaders').hidden = isStandings;
  $('#status').hidden = isStandings || !league.refreshError;
  $('#status').classList.toggle('warning', Boolean(league.refreshError));
  $('#status').textContent = league.refreshError ? 'Die Daten konnten zuletzt nicht aktualisiert werden.' : '';
  const source = $('#source'); source.replaceChildren();
  if (isStandings) {
    source.textContent = 'Lokal gespeicherte Testtabelle · Sortierung: Punkte, Tordifferenz, erzielte Tore.';
    renderStandings();
  } else {
    if (league.source) { const link = el('a', '', league.source.name); link.href = safeLink(league.source.url); link.target = '_blank'; link.rel = 'noopener noreferrer'; source.append(document.createTextNode('Gespeicherte Spielerstatistiken · Quelle: '), link, document.createTextNode(` · Saison ${league.season}`)); }
    if (league.fetchedAt && Number.isFinite(Date.parse(league.fetchedAt))) source.append(document.createTextNode(` · Stand: ${new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(league.fetchedAt))}`));
    renderLeaders(); renderTable();
  }
}
async function load() {
  try {
    const response = await fetch('./data/stats.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Daten fehlen');
    const data = await response.json();
    if (data.schemaVersion !== 1 || !Array.isArray(data.leagues) || !data.leagues.length) throw new Error('Ungültiger Datenstand');
    for (const l of data.leagues) if (!Array.isArray(l.players) || l.players.some(p => !p.name || !p.team || !['goals', 'assists', 'points', 'matches'].every(k => Number.isInteger(p[k]) && p[k] >= 0) || p.points !== p.goals + p.assists)) throw new Error('Ungültige Spielerwerte');
    try {
      const response = await fetch('./data/standings.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Testtabellen fehlen');
      const saved = await response.json();
      if (saved.mode !== 'test' || !Array.isArray(saved.leagues) || saved.leagues.some(l => !Array.isArray(l.teams))) throw new Error('Ungültige Testtabellen');
      standingsData = saved;
    } catch { standingsData = null; }
    dataset = data; render();
  } catch {
    $('#status').hidden = false;
    $('#status').textContent = dataset ? 'Der Datenstand konnte nicht neu geladen werden. Die bisherige Ansicht bleibt erhalten.' : 'Die Statistiken konnten nicht geladen werden. Bitte prüfe die Verbindung zum lokalen Server und versuche es erneut.';
    $('#status').classList.add('warning');
    if (!dataset) { $('#league-title').textContent = 'Daten nicht verfügbar'; $('#empty').hidden = false; }
  }
}
window.addEventListener('hashchange', () => { metric = 'standings'; if (dataset) render(); });
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => { metric = button.dataset.view; if (dataset) render(); }));
load();
