import { ranking } from './rankings.js';

const $ = selector => document.querySelector(selector);
const metrics = { goals: { title: 'Torschützen', card: 'Top-Torschütze' }, assists: { title: 'Assist-Rangliste', card: 'Top-Vorlagengeber' }, points: { title: 'Scorer-Rangliste', card: 'Top-Scorer' } };
let dataset, league, metric = 'points';
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
  document.querySelectorAll('[data-metric]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.metric === metric)));
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
function render() {
  league = dataset.leagues.find(l => l.id === currentId()) || dataset.leagues[0];
  renderNav();
  $('#league-title').textContent = league.name;
  $('#league-country').textContent = league.country;
  $('#league-flag').className = `flag large-flag ${league.flag}`;
  $('#season').textContent = `Saison ${league.season || '—'}`;
  document.title = `${league.name} · Tore, Assists & Scorer — Fotstats`;
  $('#status').hidden = !league.refreshError;
  $('#status').classList.toggle('warning', Boolean(league.refreshError));
  $('#status').textContent = league.refreshError ? 'Die Daten konnten zuletzt nicht aktualisiert werden.' : '';
  const source = $('#source'); source.replaceChildren();
  if (league.source) { const link = el('a', '', league.source.name); link.href = safeLink(league.source.url); link.target = '_blank'; link.rel = 'noopener noreferrer'; source.append(document.createTextNode('Quelle: '), link, document.createTextNode(` · Saison ${league.season}`)); }
  renderLeaders(); renderTable();
}
async function load() {
  try {
    const response = await fetch('./data/stats.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Daten fehlen');
    const data = await response.json();
    if (data.schemaVersion !== 1 || !Array.isArray(data.leagues) || !data.leagues.length) throw new Error('Ungültiger Datenstand');
    for (const l of data.leagues) if (!Array.isArray(l.players) || l.players.some(p => !p.name || !p.team || !['goals', 'assists', 'points', 'matches'].every(k => Number.isInteger(p[k]) && p[k] >= 0) || p.points !== p.goals + p.assists)) throw new Error('Ungültige Spielerwerte');
    dataset = data; render();
  } catch {
    $('#status').hidden = false;
    $('#status').textContent = dataset ? 'Der Datenstand konnte nicht neu geladen werden. Die bisherige Ansicht bleibt erhalten.' : 'Die Statistiken konnten nicht geladen werden. Bitte prüfe die Verbindung zum lokalen Server und versuche es erneut.';
    $('#status').classList.add('warning');
    if (!dataset) { $('#league-title').textContent = 'Daten nicht verfügbar'; $('#empty').hidden = false; }
  }
}
window.addEventListener('hashchange', () => { if (dataset) render(); });
document.querySelectorAll('[data-metric]').forEach(button => button.addEventListener('click', () => { metric = button.dataset.metric; if (dataset) renderTable(); }));
load();
