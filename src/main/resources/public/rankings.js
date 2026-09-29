export function ranking(players, metric, limit = 20) {
  if (!['goals', 'assists', 'points'].includes(metric)) throw new Error('Unbekannte Rangliste');
  const sorted = players.filter(p => p[metric] > 0).slice().sort((a, b) => b[metric] - a[metric] || a.name.localeCompare(b.name, 'de'));
  let previous, rank;
  return sorted.slice(0, limit).map((player, i) => {
    if (player[metric] !== previous) rank = i + 1;
    previous = player[metric];
    return { ...player, rank };
  });
}
