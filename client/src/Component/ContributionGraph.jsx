const levels = ["bg-[#161b22]", "bg-[#0e4429]", "bg-[#006d32]", "bg-[#26a641]", "bg-[#39d353]"];

export default function ContributionGraph({ activity = [] }) {
  const counts = new Map(activity.map((entry) => [String(entry.day).slice(0, 10), Number(entry.count)]));
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 363 - start.getDay());
  const days = [];
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const key = date.toISOString().slice(0, 10);
    days.push({ key, count: counts.get(key) || 0 });
  }
  const weeks = [];
  for (let index = 0; index < days.length; index += 7) weeks.push(days.slice(index, index + 7));
  const total = days.reduce((sum, day) => sum + day.count, 0);

  return (
    <section className="overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#30363d] bg-[#161b22] px-4 py-3"><h2 className="text-sm font-semibold">Contributions</h2><span className="text-xs text-[#848d97]">{total} commits in the last year</span></div>
      <div className="overflow-x-auto p-4">
        <div className="flex min-w-max gap-1" role="img" aria-label={`${total} commits in the last year, shown by day`}>
          {weeks.map((week, weekIndex) => <div key={weekIndex} className="grid grid-rows-7 gap-1">{week.map((day) => {
            const level = day.count === 0 ? 0 : day.count < 2 ? 1 : day.count < 4 ? 2 : day.count < 8 ? 3 : 4;
            return <span key={day.key} title={`${day.count} ${day.count === 1 ? "commit" : "commits"} on ${day.key}`} className={`h-[10px] w-[10px] rounded-[2px] ${levels[level]}`} />;
          })}</div>)}
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-[#848d97]">Less {levels.map((level) => <span key={level} className={`h-[10px] w-[10px] rounded-[2px] ${level}`} />)} More</div>
      </div>
    </section>
  );
}
