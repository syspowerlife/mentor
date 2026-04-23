export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function calculateAverageProgress(items: { progresso?: number }[]): number {
  if (!items || items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + (item.progresso || 0), 0);
  return Number((sum / items.length).toFixed(1));
}

export function getOverdueItemsCount(items: { prazo?: string, status?: string }[]): number {
  if (!items || items.length === 0) return 0;
  const now = new Date();
  return items.filter(item => {
    if (!item.prazo || item.status === 'concluido') return false;
    return new Date(item.prazo) < now;
  }).length;
}
