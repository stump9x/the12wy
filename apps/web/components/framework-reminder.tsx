const principles = [
  ["Accountability", "Chủ động chịu trách nhiệm với lựa chọn và kết quả của mình."],
  ["Commitment", "Giữ lời hứa với kế hoạch, ngay cả khi động lực thay đổi."],
  ["Greatness in the Moment", "Làm tốt nhất hành động quan trọng đang ở trước mắt."],
] as const;

const disciplines = [
  ["Vision", "Giữ hướng đi và lý do đủ mạnh."],
  ["Planning", "Chuyển hướng đi thành Goals và Tactics rõ ràng."],
  ["Process Control", "Bảo vệ nhịp thực thi bằng các thói quen hằng ngày."],
  ["Measurement", "Đo Lead Indicators và Lag Indicators để biết cần điều chỉnh gì."],
  ["Time Use", "Dành thời gian cho hành động dẫn dắt kết quả."],
] as const;

function FrameworkList({ title, items }: { title: string; items: readonly (readonly [string, string])[] }) {
  return (
    <div className="framework-group">
      <h4>{title}</h4>
      <ol>
        {items.map(([term, description]) => (
          <li key={term}>
            <strong>{term}</strong>
            <span>{description}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function FrameworkReminder() {
  return (
    <section className="panel framework-reminder" aria-labelledby="framework-reminder-title">
      <div className="framework-heading">
        <div>
          <span className="eyebrow">The 12 Week Year Framework</span>
          <h3 id="framework-reminder-title">Giữ phương pháp ở trung tâm mỗi tuần.</h3>
        </div>
        <p>Nhắc mình: chọn ít điều quan trọng, thực thi nhất quán và đo điều có thể kiểm soát.</p>
      </div>
      <div className="framework-groups">
        <FrameworkList title="Three Principles" items={principles} />
        <FrameworkList title="Five Disciplines" items={disciplines} />
      </div>
    </section>
  );
}
