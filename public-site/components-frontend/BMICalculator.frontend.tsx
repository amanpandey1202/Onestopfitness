"use client";

import { useState } from "react";

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
    let color = "text-gym-lime";
    if (bmi < 18.5) {
      category = "Underweight";
      color = "text-sky-400";
    } else if (bmi < 25) {
      category = "Normal";
      color = "text-gym-lime";
    } else if (bmi < 30) {
      category = "Overweight";
      color = "text-amber-400";
    } else {
      category = "Obese";
      color = "text-red-400";
    }
    setResult({ bmi: Math.round(bmi * 10) / 10, category, color });
  }

  const inputCls =
    "w-full rounded-md border border-white/12 bg-[#0a0a0a] px-4 py-3 text-white outline-none transition focus:border-gym-lime focus:shadow-[0_0_0_1px_rgba(154,217,1,0.3),0_0_18px_rgba(154,217,1,0.12)]";

  return (
    <div className="panel p-7">
      <h3 className="font-anton text-2xl uppercase leading-none text-white">
        BMI <span className="glow-lime">Calculator</span>
      </h3>
      <p className="mt-2 text-sm text-white/55">
        Check where you stand — then let us plan your journey.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="fheight" className="mb-1.5 block text-sm font-medium text-white/75">
            Height (cm)
          </label>
          <input
            id="fheight"
            type="number"
            inputMode="decimal"
            min={1}
            placeholder="e.g. 170"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="fweight" className="mb-1.5 block text-sm font-medium text-white/75">
            Weight (kg)
          </label>
          <input
            id="fweight"
            type="number"
            inputMode="decimal"
            min={1}
            placeholder="e.g. 70"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={inputCls}
          />
        </div>
        <button type="submit" className="btn btn-primary w-full">
          Calculate BMI
        </button>
      </form>

      {result && (
        <div className="mt-5 rounded-xl border border-gym-lime/25 bg-[#0a0a0a] p-5 text-center shadow-[0_0_24px_rgba(154,217,1,0.08)]">
          <p className="text-xs uppercase tracking-[0.25em] text-white/50">Your BMI</p>
          <p className="stat-num mt-1 text-5xl">{result.bmi}</p>
          <p className={`mt-1.5 text-sm font-bold uppercase tracking-[0.2em] ${result.color}`}>
            {result.category}
          </p>
        </div>
      )}
    </div>
  );
}
