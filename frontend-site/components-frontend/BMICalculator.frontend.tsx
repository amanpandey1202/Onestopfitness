"use client";

import { useState } from "react";
import CountUp from "@/components/CountUp";

export default function BMICalculatorFrontend() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<{
    bmi: number;
    category: string;
    color: string;
  } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const h = parseFloat(height) / 100;
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return;

    const bmi = w / (h * h);
    let category = "Normal";
    let color = "var(--lime)";
    if (bmi < 18.5) {
      category = "Underweight";
      color = "#38bdf8";
    } else if (bmi < 25) {
      category = "Normal";
      color = "var(--lime)";
    } else if (bmi < 30) {
      category = "Overweight";
      color = "#fbbf24";
    } else {
      category = "Obese";
      color = "#f87171";
    }
    setResult({ bmi: Math.round(bmi * 10) / 10, category, color });
  }

  return (
    <div className="form-card">
      <div className="eyebrow">Quick check</div>
      <h3 style={{ marginTop: 10, fontSize: "clamp(2rem, 5vw, 3rem)" }}>
        Know your<br /><span style={{ color: "var(--lime)" }}>start.</span>
      </h3>
      <p className="form-sub" style={{ marginTop: 14 }}>
        Two numbers, a quick answer — then we help you plan the way forward.
      </p>

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-field">
          <label htmlFor="fheight">Height (cm)</label>
          <input
            id="fheight"
            type="number"
            inputMode="decimal"
            min={1}
            placeholder="e.g. 170"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="fweight">Weight (kg)</label>
          <input
            id="fweight"
            type="number"
            inputMode="decimal"
            min={1}
            placeholder="e.g. 70"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <button type="submit" className="button-primary">
          Calculate BMI
        </button>
      </form>

      {result && (
        <div className="form-success" style={{ textAlign: "center", marginTop: 28 }}>
          <span style={{ font: "9px var(--font-space-mono),monospace", letterSpacing: ".13em", textTransform: "uppercase", color: "#7d8780" }}>Your BMI</span>
          <p style={{ margin: "10px 0 0", color: "var(--paper)", font: "800 clamp(2.4rem,6vw,4rem)/.8 var(--font-barlow),sans-serif", letterSpacing: "-.03em" }}>
            <CountUp end={result.bmi} decimals={1} duration={900} />
          </p>
          <p style={{ marginTop: 10, color: result.color, font: "700 10px var(--font-space-mono),monospace", letterSpacing: ".14em", textTransform: "uppercase" }}>
            {result.category}
          </p>
        </div>
      )}
    </div>
  );
}