"use client";

import { useState } from "react";

export default function BMICalculator() {
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

  return (
    <div className="rounded-2xl border border-white/10 bg-gym-ink p-6 shadow-card">
      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white">
        BMI <span className="text-gym-lime">Calculator</span>
      </h3>
      <p className="mt-1 text-sm text-white/55">
        Check where you stand — then let us plan your journey.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="height" className="mb-1 block text-sm font-medium text-white/75">
            Height (cm)
          </label>
          <input
            id="height"
            type="number"
            inputMode="decimal"
            min={1}
            placeholder="e.g. 170"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-gym-black px-4 py-2.5 text-white outline-none transition focus:border-gym-lime"
          />
        </div>
        <div>
          <label htmlFor="weight" className="mb-1 block text-sm font-medium text-white/75">
            Weight (kg)
          </label>
          <input
            id="weight"
            type="number"
            inputMode="decimal"
            min={1}
            placeholder="e.g. 70"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-gym-black px-4 py-2.5 text-white outline-none transition focus:border-gym-lime"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-gym-lime px-4 py-3 font-bold text-gym-black transition hover:bg-gym-lime-soft"
        >
          Calculate BMI
        </button>
      </form>

      {result && (
        <div className="mt-5 rounded-xl border border-white/10 bg-gym-black p-4 text-center">
          <p className="text-sm text-white/60">Your BMI</p>
          <p className="font-display text-4xl font-bold text-white">{result.bmi}</p>
          <p className={`mt-1 text-sm font-bold uppercase tracking-wide ${result.color}`}>
            {result.category}
          </p>
        </div>
      )}
    </div>
  );
}
