export function Meter({
  label,
  value,
  max,
  color = "blue",
}: {
  label: string;
  value: number;
  max: number;
  color?: "blue" | "purple" | "red" | "green";
}) {
  return (
    <div className={`resource-meter ${color}`}>
      <div>
        <span>{label}</span>
        <strong>
          {Math.ceil(value)} <small>/ {max}</small>
        </strong>
      </div>
      <div
        className="resource-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.ceil(value)}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <span style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
      </div>
    </div>
  );
}
