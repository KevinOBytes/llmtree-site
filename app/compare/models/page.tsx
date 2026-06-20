import type { Metadata } from "next";
import { Suspense } from "react";
import { ModelCompareClient } from "./ModelCompareClient";

export const metadata: Metadata = {
  title: "Model-to-Model Comparison Tool | LLM Tree of Life",
  description:
    "Compare specs, release dates, parameter counts, context windows, architectures, licenses, and benchmark scores of frontier AI models side-by-side.",
};

export default function CompareModelsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-accent-violet border-t-transparent rounded-full animate-spin" />
            <p className="text-text-secondary text-sm">Loading comparison tool...</p>
          </div>
        </div>
      }
    >
      <ModelCompareClient />
    </Suspense>
  );
}
