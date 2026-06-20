"use client";

import { TechTerm } from "@/components/ui/TechTerm";

interface MathVariableProps {
  symbol: string;
  glossaryKey?: string;
}

export function MathVar({ symbol, glossaryKey }: MathVariableProps) {
  return (
    <TechTerm term={glossaryKey ?? symbol}>
      <span className="font-serif italic font-bold text-accent-cyan hover:underline transition-all cursor-help px-0.5">
        {symbol}
      </span>
    </TechTerm>
  );
}

export function AttentionFormula() {
  return (
    <div className="flex flex-col items-center justify-center my-6 p-6 rounded-xl bg-surface-secondary/40 border border-border-default/40">
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-4 font-sans">
        Self-Attention Equation (Interactive)
      </span>
      
      <div className="flex items-center flex-wrap justify-center gap-y-4 font-serif text-lg sm:text-2xl text-text-primary tracking-wide select-none">
        {/* Left Side */}
        <span className="font-sans font-semibold text-text-secondary mr-2">Attention</span>
        <span>(</span>
        <MathVar symbol="Q" />
        <span className="mx-1">,</span>
        <MathVar symbol="K" />
        <span className="mx-1">,</span>
        <MathVar symbol="V" />
        <span className="ml-1 mr-3">)</span>
        <span className="font-sans mr-3 text-text-muted">=</span>
        
        {/* Softmax Wrapper */}
        <span className="font-sans font-semibold text-accent-violet mr-1">Softmax</span>
        <span className="text-2xl sm:text-3xl font-light text-text-muted mr-1">(</span>
        
        {/* Fraction */}
        <div className="inline-flex flex-col items-center mx-2">
          {/* Numerator */}
          <div className="flex items-center px-2 pb-1 border-b border-text-muted">
            <MathVar symbol="Q" />
            <MathVar symbol="K" />
            <span className="text-[10px] sm:text-xs align-super -mt-2.5 font-sans font-semibold text-text-muted">T</span>
          </div>
          {/* Denominator */}
          <div className="flex items-center pt-1 font-serif text-sm sm:text-lg">
            <span className="font-sans font-light mr-0.5">√</span>
            <span className="border-t border-text-primary/70 px-1 -mt-0.5">
              <MathVar symbol="d_k" />
            </span>
          </div>
        </div>
        
        <span className="text-2xl sm:text-3xl font-light text-text-muted ml-1 mr-2">)</span>
        
        {/* Value Matrix */}
        <MathVar symbol="V" />
      </div>
      
      <p className="text-[10px] text-text-muted mt-4 text-center font-sans">
        💡 Hover over the highlighted variables (<MathVar symbol="Q" />, <MathVar symbol="K" />, <MathVar symbol="V" />, <MathVar symbol="d_k" />) to reveal their definitions.
      </p>
    </div>
  );
}

export function SoftmaxFormula() {
  return (
    <div className="flex flex-col items-center justify-center my-6 p-6 rounded-xl bg-surface-secondary/40 border border-border-default/40">
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-4 font-sans">
        Softmax with Temperature scaling (Interactive)
      </span>
      
      <div className="flex items-center justify-center font-serif text-lg sm:text-2xl text-text-primary tracking-wide select-none">
        {/* Left Side */}
        <span className="font-sans font-semibold text-text-secondary mr-1">P</span>
        <span>(</span>
        <span className="font-serif italic text-text-muted">t</span>
        <sub className="text-[10px] sm:text-xs font-sans text-text-muted ml-0.5">i</sub>
        <span className="mr-4">)</span>
        <span className="font-sans mr-4 text-text-muted">=</span>
        
        {/* Fraction */}
        <div className="inline-flex flex-col items-center">
          {/* Numerator */}
          <div className="flex items-center px-4 pb-1 border-b border-text-muted">
            <span className="font-serif italic text-accent-violet">e</span>
            <div className="text-[10px] sm:text-xs -mt-3 ml-0.5 flex items-center font-sans text-text-muted">
              <MathVar symbol="z_i" />
              <span className="mx-0.5">/</span>
              <MathVar symbol="T" />
            </div>
          </div>
          {/* Denominator */}
          <div className="flex items-center pt-1">
            <span className="text-xl sm:text-2xl font-sans font-light text-text-muted mr-1.5">∑</span>
            <sub className="text-[9px] font-sans text-text-muted -ml-1 mt-2.5 mr-2">j</sub>
            <span className="font-serif italic text-accent-violet">e</span>
            <div className="text-[10px] sm:text-xs -mt-3 ml-0.5 flex items-center font-sans text-text-muted">
              <MathVar symbol="z_j" glossaryKey="z_i" />
              <span className="mx-0.5">/</span>
              <MathVar symbol="T" />
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-text-muted mt-4 text-center font-sans">
        💡 Hover over the variables (<MathVar symbol="z_i" />, <MathVar symbol="T" />) to learn how they control next-token predictions.
      </p>
    </div>
  );
}
