import React from 'react';
import { Mode } from '../types';
import { BookOpen, GraduationCap } from 'lucide-react';

interface TerminologyExplainerProps {
  mode: Mode;
}

export const TerminologyExplainer: React.FC<TerminologyExplainerProps> = ({ mode }) => {
  const glossary = [
    {
      term: 'Geometric Brownian Motion (GBM)',
      pro: 'Continuous-time stochastic process with drift μ and diffusion σ dW_t modeling log-normal asset price paths.',
      student: 'A mathematical formula that models random zigzagging market price moves while following an overall trend.',
    },
    {
      term: 'Value at Risk (VaR 95%)',
      pro: '1-horizon statistical measure of maximum loss quantile at 95% confidence interval.',
      student: 'A safety benchmark: There is a 95% chance your losses will not exceed this amount over the time period.',
    },
    {
      term: 'Annualized Drift (μ)',
      pro: 'Expected instantaneous rate of return on the underlying asset before stochastic diffusion.',
      student: 'The average yearly growth rate or upward/downward slope expected for this stock.',
    },
    {
      term: 'Volatility (σ)',
      pro: 'Standard deviation of logarithmic asset returns measuring dispersion around the mean.',
      student: 'How wildly the stock swings up and down. Higher volatility means larger unexpected price swings.',
    },
    {
      term: 'Sharpe Ratio',
      pro: 'Mean excess return per unit of total risk (μ - Rf)/σ against the risk-free benchmark.',
      student: 'A score showing if you are getting enough profit to justify the bumpy ride and risk you take.',
    },
  ];

  return (
    <div className="rounded-xl border border-slate-700/70 bg-[#1E293B] p-3.5 sm:p-4 shadow-xl text-xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/60">
        <div className="flex items-center gap-1.5 text-slate-200">
          {mode === 'pro' ? (
            <BookOpen className="h-4 w-4 text-[#06B6D4]" />
          ) : (
            <GraduationCap className="h-4 w-4 text-[#10B981]" />
          )}
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#06B6D4] font-mono">
            {mode === 'pro' ? 'QUANTITATIVE FORMULATION & GLOSSARY' : 'STUDENT GUIDE: FINANCIAL TRANSLATOR & JARGON BUSTER'}
          </h4>
        </div>
        <span className="rounded bg-slate-900 border border-slate-700 px-1.5 py-0.2 text-[9px] text-[#06B6D4] font-mono uppercase">
          {mode === 'pro' ? 'INSTITUTIONAL DEFINITIONS' : 'STUDENT PLAIN ENGLISH'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-3">
        {glossary.map((item, idx) => (
          <div key={idx} className="bg-[#0F172A]/70 p-2.5 rounded-lg border border-slate-700/80 space-y-1">
            <span className="font-bold font-mono text-[#06B6D4] text-[11px] block">{item.term}</span>
            <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
              {mode === 'pro' ? item.pro : item.student}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

