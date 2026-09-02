const principles = ["Accountability", "Commitment", "Greatness in the Moment"] as const;

const disciplines = ["Vision", "Planning", "Process Control", "Measurement", "Time Use"] as const;

function FrameworkList({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="framework-group">
      <h4>{title}</h4>
      <ol>
        {items.map((term) => (
          <li key={term}><strong>{term}</strong></li>
        ))}
      </ol>
    </div>
  );
}

export function FrameworkReminder() {
  return (
    <section className="panel framework-reminder" aria-labelledby="framework-reminder-title">
      <div className="framework-heading">
        <h3 id="framework-reminder-title">The 12 Week Year Framework</h3>
      </div>
      <div className="framework-groups">
        <FrameworkList title="3 Principles" items={principles} />
        <FrameworkList title="5 Disciplines" items={disciplines} />
      </div>
    </section>
  );
}
