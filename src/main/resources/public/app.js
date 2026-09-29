import { ranking } from './rankings.js';

const $ = selector => document.querySelector(selector);
const metrics = { goals: { title: 'Torschützen', card: 'Top-Torschütze', symbol: '◎' }, assists: { title: 'Assist-Rangliste', card: 'Top-Vorlagengeber', symbol: '↗' }, points: { title: 'Scorer-Rangliste', card: 'Top-Scorer', symbol: '✧' } };
let dataset, league, metric = 'points', limit = 10;
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
function playerLink(player) {
  const link = el('a', 'player-link'); link.href = safeLink(player.url); link.target = '_blank'; link.rel = 'noopener noreferrer';
  link.append(el('span', 'player-name', player.name), el('span', 'player-team', player.team));
  return link;
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
    const label = el('h3', 'card-label'); const symbol = el('span', 'card-symbol', config.symbol); symbol.setAttribute('aria-hidden', 'true'); label.append(symbol, document.createTextNode(config.card));
    const main = el('div', 'leader-main'), identity = el('div');
    identity.append(el('p', 'leader-name', first?.name || 'Noch keine Werte'), el('p', 'leader-team', first?.team || ''));
    main.append(identity, el('span', 'leader-value', first ? String(first[key]) : '—'));
    const ties = first ? leaders.filter(p => p[key] === first[key]).length - 1 : 0;
    card.append(label, main, el('p', 'leader-tie', ties ? `+ ${ties} weitere Spieler mit ${first[key]} ${key === 'goals' ? 'Toren' : key === 'assists' ? 'Assists' : 'Scorerpunkten'}` : ''));
    return card;
  }));
}
function renderTable() {
  const rows = ranking(league.players, metric, limit);
  $('#ranking-title').textContent = metrics[metric].title;
  $('#table-caption').textContent = `${league.name}, Saison ${league.season || 'unbekannt'}: ${metrics[metric].title}, absteigend sortiert.`;
  $('#ranking-count').textContent = `${rows.length} von ${league.players.filter(p => p[metric] > 0).length} Spielern`;
  document.querySelectorAll('[data-metric]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.metric === metric)));
  document.querySelectorAll('[data-column]').forEach(cell => { cell.classList.toggle('selected', cell.dataset.column === metric); cell.removeAttribute('aria-sort'); if (cell.dataset.column === metric) cell.setAttribute('aria-sort', 'descending'); });
  $('#ranking-body').replaceChildren(...rows.map(p => {
    const tr = el('tr'), rankCell = el('td'); rankCell.append(el('span', `rank${p.rank === 1 ? ' first' : ''}`, String(p.rank)));
    const identity = el('th'); identity.scope = 'row'; identity.append(playerLink(p));
    tr.append(rankCell, identity, el('td', 'numeric games-column', String(p.matches)));
    for (const key of Object.keys(metrics)) {
      const td = el('td', `numeric${key === metric ? ' selected' : ''}`, String(p[key]));
      if (key === 'points' && metric === key) td.append(el('span', 'points-detail', `${p.goals} + ${p.assists}`));
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
  document.title = `${league.name} · Tore, Assists & Scorer — Stats`;
  const timestamp = league.fetchedAt ? new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Zurich' }).format(new Date(league.fetchedAt)) : null;
  const stale = timestamp && Date.now() - Date.parse(league.fetchedAt) > 24 * 60 * 60 * 1000;
  const ended = league.seasonEnd && Date.now() > Date.parse(league.seasonEnd);
  $('#status').classList.toggle('warning', Boolean(stale || ended || league.refreshError));
  $('#status').textContent = timestamp ? `Abgerufen am ${timestamp} Uhr (Schweizer Zeit).${league.refreshError ? ' Letzter Online-Abruf fehlgeschlagen; letzter verfügbarer Datenstand.' : stale ? ' Gespeicherter Datenstand ist älter als 24 Stunden.' : ' Letzter gespeicherter Datenstand.'}${ended ? ' Die Quelle liefert eine vergangene Saison.' : ''}` : 'Für diese Liga konnte noch kein Datenstand abgerufen werden.';
  const source = $('#source'); source.replaceChildren();
  if (league.source) { const link = el('a', '', league.source.name); link.href = safeLink(league.source.url); link.target = '_blank'; link.rel = 'noopener noreferrer'; source.append(document.createTextNode('Quelle: '), link, document.createTextNode(` · Saison ${league.season}`)); }
  renderLeaders(); renderTable();
}
async function load() {
  const button = $('#reload'); button.disabled = true;
  try {
    const response = await fetch('./data/stats.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Daten fehlen');
    const data = await response.json();
    if (data.schemaVersion !== 1 || !Array.isArray(data.leagues) || !data.leagues.length) throw new Error('Ungültiger Datenstand');
    for (const l of data.leagues) if (!Array.isArray(l.players) || l.players.some(p => !p.name || !p.team || !['goals', 'assists', 'points', 'matches'].every(k => Number.isInteger(p[k]) && p[k] >= 0) || p.points !== p.goals + p.assists)) throw new Error('Ungültige Spielerwerte');
    dataset = data; render();
  } catch {
    $('#status').textContent = dataset ? 'Der Datenstand konnte nicht neu geladen werden. Die bisherige Ansicht bleibt erhalten.' : 'Die Statistiken konnten nicht geladen werden. Bitte prüfe die Verbindung zum lokalen Server und versuche es erneut.';
    $('#status').classList.add('warning');
    if (!dataset) { $('#league-title').textContent = 'Daten nicht verfügbar'; $('#empty').hidden = false; }
  } finally { button.disabled = false; }
}
window.addEventListener('hashchange', () => { if (dataset) render(); });
document.querySelectorAll('[data-metric]').forEach(button => button.addEventListener('click', () => { metric = button.dataset.metric; if (dataset) renderTable(); }));
$('#limit').addEventListener('change', event => { limit = event.target.value === 'all' ? Infinity : Number(event.target.value); if (dataset) renderTable(); });
$('#reload').addEventListener('click', load);
load();
