export default function StepIndicator({ step, steps }) {
  if (step < 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            padding: "4px 10px", borderRadius: 6, fontSize: 11, display: "flex", alignItems: "center", gap: 4,
            backgroundColor: step === i ? "#e8f0fe" : step > i ? "#e6f4ea" : "#f5f5f5",
            color: step === i ? "#1a73e8" : step > i ? "#137333" : "#aaa",
            border: "1px solid",
            borderColor: step === i ? "#1a73e8" : step > i ? "#137333" : "#e5e5e5",
          }}>
            {s}
            {step === i && (
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                backgroundColor: "#1a73e8",
                animation: "pulse 1.2s infinite",
                display: "inline-block",
              }} />
            )}
          </div>
          {i < steps.length - 1 && <span style={{ color: "#ccc", fontSize: 12 }}>›</span>}
        </div>
      ))}
    </div>
  );
}
