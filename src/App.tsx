import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Mode, StockTicker, TimeHorizon, MacroScenario, QualitativeSynthesis, ViewTab } from './types';
import { POPULAR_TICKERS, MOCK_QUALITATIVE_ARCHIVE } from './data/mockTickers';
import { runMonteCarloSimulation } from './utils/quantEngine';
import { fetchQualitativeSynthesis } from './services/geminiService';
import { Header } from './components/Header';
import { TickerSummaryBar } from './components/TickerSummaryBar';
import { MonteCarloChart } from './components/MonteCarloChart';
import { RiskMetricsPanel } from './components/RiskMetricsPanel';
import { SimulationControls } from './components/SimulationControls';
import { MacroStressTester } from './components/MacroStressTester';
import { QualitativeReport } from './components/QualitativeReport';
import { TerminologyExplainer } from './components/TerminologyExplainer';
import { PitchCardModal } from './components/PitchCardModal';

export default function App() {
  // 1. Ticker, Mode & ViewTab state
  const [currentTicker, setCurrentTicker] = useState<StockTicker>(POPULAR_TICKERS[0]); // NVDA default
  const [mode, setMode] = useState<Mode>('pro');
  const [activeTab, setActiveTab] = useState<ViewTab>('all');

  // 2. Monte Carlo Simulation parameters
  const [horizonDays, setHorizonDays] = useState<TimeHorizon>(90);
  const [confidenceInterval, setConfidenceInterval] = useState<number>(90);
  const [simulationsCount, setSimulationsCount] = useState<number>(500);
  const [volatility, setVolatility] = useState<number>(POPULAR_TICKERS[0].volatility);
  const [drift, setDrift] = useState<number>(POPULAR_TICKERS[0].drift);
  const [randomSeedTrigger, setRandomSeedTrigger] = useState<number>(0);
  const [isChartExpanded, setIsChartExpanded] = useState<boolean>(false);

  // 3. Macro Scenario Stress-Testing state
  const [activeScenario, setActiveScenario] = useState<MacroScenario | null>(null);

  // 4. Qualitative Synthesis & Bull/Bear Weight Sliders
  const [synthesis, setSynthesis] = useState<QualitativeSynthesis>(
    MOCK_QUALITATIVE_ARCHIVE[POPULAR_TICKERS[0].symbol] || {
      ticker: POPULAR_TICKERS[0].symbol,
      lastUpdated: 'Initial Model',
      executiveSummary: POPULAR_TICKERS[0].description,
      eli5Summary: POPULAR_TICKERS[0].eli5Description,
      studentSummary: POPULAR_TICKERS[0].studentDescription || POPULAR_TICKERS[0].eli5Description,
      bullishDrivers: [],
      bearishRisks: [],
      keyCatalysts: [],
      llmSuggestedDrift: POPULAR_TICKERS[0].drift,
      llmSuggestedVol: POPULAR_TICKERS[0].volatility,
      confidenceScore: 90,
      source: 'institutional_archive',
    }
  );
  const [bullWeight, setBullWeight] = useState<number>(70);
  const [bearWeight, setBearWeight] = useState<number>(35);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // 5. Modals
  const [isPitchCardOpen, setIsPitchCardOpen] = useState<boolean>(false);

  // Qualitative drift shift modifier (LLM to Quant bridge)
  const qualitativeDriftShift = useMemo(() => {
    return ((bullWeight - bearWeight) / 100) * 0.08;
  }, [bullWeight, bearWeight]);

  // Execute high-performance Monte Carlo simulation live
  const simulationResults = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    randomSeedTrigger;

    return runMonteCarloSimulation({
      initialPrice: currentTicker.price,
      volatility,
      drift,
      horizonDays,
      simulationsCount,
      riskFreeRate: 0.045, // 4.5% US Treasury benchmark
      qualitativeDriftShift,
      confidenceInterval,
    });
  }, [
    currentTicker.price,
    volatility,
    drift,
    horizonDays,
    simulationsCount,
    qualitativeDriftShift,
    confidenceInterval,
    randomSeedTrigger,
  ]);

  // Load qualitative synthesis when ticker changes
  const loadSynthesisForTicker = useCallback(async (ticker: StockTicker) => {
    setIsAiLoading(true);
    try {
      const data = await fetchQualitativeSynthesis(ticker);
      setSynthesis(data);
    } catch (err) {
      console.error('Failed to load qualitative synthesis:', err);
    } finally {
      setIsAiLoading(false);
    }
  }, []);

  // Ticker Selection Handler
  const handleSelectTicker = (newTicker: StockTicker) => {
    setCurrentTicker(newTicker);
    setVolatility(newTicker.volatility);
    setDrift(newTicker.drift);
    setActiveScenario(null);
    setBullWeight(70);
    setBearWeight(35);
    loadSynthesisForTicker(newTicker);
  };

  // Macro Scenario Apply Handler
  const handleApplyScenarioShift = (driftShift: number, volShift: number, scenario: MacroScenario) => {
    setActiveScenario(scenario);
    setDrift(Math.max(-0.45, Math.min(0.80, currentTicker.drift + driftShift)));
    setVolatility(Math.max(0.08, Math.min(1.20, currentTicker.volatility + volShift)));
  };

  // Clear Macro Scenario
  const handleClearScenario = () => {
    setActiveScenario(null);
    setDrift(currentTicker.drift);
    setVolatility(currentTicker.volatility);
  };

  // Reset parameters to current ticker baseline
  const handleResetParams = () => {
    setVolatility(currentTicker.volatility);
    setDrift(currentTicker.drift);
    setActiveScenario(null);
    setBullWeight(50);
    setBearWeight(50);
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 antialiased selection:bg-[#06B6D4] selection:text-[#0F172A] font-sans pb-12">
      {/* Top Bloomberg Navigation, Ticker Search & View Tabs */}
      <Header
        currentTicker={currentTicker}
        onSelectTicker={handleSelectTicker}
        mode={mode}
        onToggleMode={() => setMode(m => (m === 'pro' ? 'student' : 'pro'))}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenPitchCardModal={() => setIsPitchCardOpen(true)}
        isAiLoading={isAiLoading}
      />

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-3 sm:px-5 pt-3.5 space-y-3.5">
        {/* Institutional Ticker Summary Strip */}
        <TickerSummaryBar ticker={currentTicker} mode={mode} />

        {/* VIEW 1: MONTE CARLO SIMULATOR VIEW (Primary Toggleable Mode or in All Modules) */}
        {(activeTab === 'all' || activeTab === 'simulator') && (
          <section className="space-y-3.5">
            <MonteCarloChart
              trajectories={simulationResults.trajectories}
              results={simulationResults}
              ticker={currentTicker}
              initialPrice={currentTicker.price}
              currency={currentTicker.currency}
              horizonDays={horizonDays}
              onChangeHorizon={setHorizonDays}
              confidenceInterval={confidenceInterval}
              onChangeConfidenceInterval={setConfidenceInterval}
              simulationsCount={simulationsCount}
              onChangeSimCount={setSimulationsCount}
              onRerunSimulation={() => setRandomSeedTrigger(s => s + 1)}
              mode={mode}
              isExpanded={activeTab === 'simulator' || isChartExpanded}
              onToggleExpand={() => {
                if (activeTab === 'simulator') {
                  setActiveTab('all');
                } else {
                  setIsChartExpanded(e => !e);
                }
              }}
            />

            {/* Dynamic Risk Metrics Panel */}
            <RiskMetricsPanel
              results={simulationResults}
              currency={currentTicker.currency}
              horizonDays={horizonDays}
              mode={mode}
            />

            {/* Interactive Parameter Tuner */}
            <SimulationControls
              volatility={volatility}
              drift={drift}
              qualitativeDriftShift={qualitativeDriftShift}
              onChangeVolatility={setVolatility}
              onChangeDrift={setDrift}
              onResetParams={handleResetParams}
              mode={mode}
            />
          </section>
        )}

        {/* VIEW 2: MACRO STRESS-TESTING VIEW */}
        {(activeTab === 'all' || activeTab === 'macro') && (
          <section className="space-y-3.5">
            <MacroStressTester
              ticker={currentTicker}
              activeScenario={activeScenario}
              onApplyScenarioShift={handleApplyScenarioShift}
              onClearScenario={handleClearScenario}
              mode={mode}
            />

            {/* If user is in dedicated macro tab, also show the simulated resulting metrics */}
            {activeTab === 'macro' && (
              <RiskMetricsPanel
                results={simulationResults}
                currency={currentTicker.currency}
                horizonDays={horizonDays}
                mode={mode}
              />
            )}
          </section>
        )}

        {/* VIEW 3: QUALITATIVE INTELLIGENCE VIEW */}
        {(activeTab === 'all' || activeTab === 'qualitative') && (
          <section className="space-y-3.5">
            <QualitativeReport
              synthesis={synthesis}
              ticker={currentTicker}
              bullWeight={bullWeight}
              bearWeight={bearWeight}
              onChangeBullWeight={setBullWeight}
              onChangeBearWeight={setBearWeight}
              onRegenerateAiReport={() => loadSynthesisForTicker(currentTicker)}
              isAiLoading={isAiLoading}
              mode={mode}
            />
          </section>
        )}

        {/* Financial Translator & Educational Glossary */}
        <section>
          <TerminologyExplainer mode={mode} />
        </section>
      </main>

      {/* Institutional Terminal Status Bar Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 h-7 bg-[#0F172A] border-t border-slate-700/80 px-4 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#10B981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
            LIVE SIMULATOR
          </span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline">ENGINE: <strong className="text-slate-300">GBM / 15-PATH BUNDLE</strong></span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline">MODE: <strong className={mode === 'student' ? 'text-[#10B981]' : 'text-[#06B6D4]'}>{mode === 'student' ? 'STUDENT' : 'QUANT PRO'}</strong></span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline">TICKER: <strong className="text-[#06B6D4]">{currentTicker.symbol}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400">LATENCY: <strong className="text-[#10B981]">0.8ms</strong></span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">AI: <strong className="text-[#06B6D4]">GEMINI 3.7 FLASH</strong></span>
        </div>
      </footer>

      {/* Modals */}
      <PitchCardModal
        isOpen={isPitchCardOpen}
        onClose={() => setIsPitchCardOpen(false)}
        ticker={currentTicker}
        results={simulationResults}
        synthesis={synthesis}
        activeScenario={activeScenario}
        horizonDays={horizonDays}
        volatility={volatility}
        drift={drift}
        mode={mode}
      />
    </div>
  );
}

