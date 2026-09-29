export function ranking(players, metric, limit = 15) {
  if (!['goals', 'assists', 'points'].includes(metric)) throw new Error('Unbekannte Rangliste');
  const sorted = players.filter(p => p[metric] > 0).slice().sort((a, b) => b[metric] - a[metric] || a.name.localeCompare(b.name, 'de'));
  return sorted.slice(0, limit).map((player, i) => ({ ...player, rank: i + 1 }));
}
