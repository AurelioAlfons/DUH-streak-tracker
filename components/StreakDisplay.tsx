type Props = { current: number; longest: number; loading: boolean };

export default function StreakDisplay({ current, longest, loading }: Props) {
  return (
    <section
      className={`scoreboard ${loading ? "loading" : ""}`}
      aria-label="Streak scores"
      aria-busy={loading}
    >
      <div>
        <span className="score-label">CURRENT</span>
        <strong>{loading ? "–" : current}</strong>
        <span className="score-unit">DAYS</span>
      </div>
      <div className="score-right">
        <span className="score-label">BEST</span>
        <strong>{loading ? "–" : longest}</strong>
        <span className="score-unit">DAYS</span>
      </div>
    </section>
  );
}
