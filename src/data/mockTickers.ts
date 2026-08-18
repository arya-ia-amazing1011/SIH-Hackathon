import { StockTicker, MacroScenario, QualitativeSynthesis } from '../types';

export const POPULAR_TICKERS: StockTicker[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 128.50,
    currency: 'USD',
    change: 3.42,
    changePercent: 2.73,
    high52: 140.76,
    low52: 45.11,
    volatility: 0.48, // 48% annual vol
    drift: 0.28, // 28% expected baseline annual drift
    beta: 2.15,
    peRatio: 52.4,
    marketCap: '$3.15 Trillion',
    sector: 'Semiconductors / AI Hardware',
    exchange: 'NASDAQ',
    description: 'Global market leader in accelerated computing GPUs, CUDA parallel architecture, and enterprise AI data center chips.',
    eli5Description: 'The tech giant building the ultra-fast computing chips and brains that power nearly all modern AI like ChatGPT.',
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 214.20,
    currency: 'USD',
    change: -4.15,
    changePercent: -1.90,
    high52: 271.00,
    low52: 138.80,
    volatility: 0.58, // 58% annual vol
    drift: 0.18,
    beta: 2.42,
    peRatio: 64.8,
    marketCap: '$682.4 Billion',
    sector: 'EV / Autonomous Robotics',
    exchange: 'NASDAQ',
    description: 'Pioneer in electric vehicles, Full Self-Driving (FSD) neural vision models, humanoid robotics (Optimus), and megapack battery storage.',
    eli5Description: 'The company making high-tech electric cars, robotaxis, home batteries, and humanoid assistant robots.',
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc. (Google)',
    price: 168.40,
    currency: 'USD',
    change: 2.35,
    changePercent: 1.42,
    high52: 191.75,
    low52: 120.21,
    volatility: 0.29, // 29% annual vol
    drift: 0.16, // 16% expected annual drift
    beta: 1.08,
    peRatio: 24.2,
    marketCap: '$2.10 Trillion',
    sector: 'AI Foundation Models, Search & Cloud',
    exchange: 'NASDAQ',
    description: 'Global technology behemoth pioneering Gemini foundation AI models, Google Cloud hyperscale infrastructure, Search/YouTube monetization, and Waymo autonomous mobility.',
    eli5Description: 'The tech powerhouse behind Google Search, YouTube, Android, Waymo robotaxis, and the Gemini AI system.',
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 224.25,
    currency: 'USD',
    change: 1.15,
    changePercent: 0.52,
    high52: 237.23,
    low52: 164.08,
    volatility: 0.24,
    drift: 0.12,
    beta: 1.05,
    peRatio: 33.1,
    marketCap: '$3.44 Trillion',
    sector: 'Consumer Electronics & Services',
    exchange: 'NASDAQ',
    description: 'Global technology behemoth with unmatched consumer ecosystem lock-in across iPhone, Mac, Apple Intelligence, and high-margin services.',
    eli5Description: 'The company that creates iPhones, Macs, iPads, and digital services with hundreds of millions of ultra-loyal users worldwide.',
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    price: 448.90,
    currency: 'USD',
    change: 4.80,
    changePercent: 1.08,
    high52: 468.35,
    low52: 309.45,
    volatility: 0.26,
    drift: 0.16,
    beta: 1.18,
    peRatio: 36.4,
    marketCap: '$3.33 Trillion',
    sector: 'Cloud Infrastructure & Enterprise AI',
    exchange: 'NASDAQ',
    description: 'Dominant enterprise software titan leveraging Azure hyperscale cloud, Copilot workplace AI integration, and partnership with OpenAI.',
    eli5Description: 'The enterprise software giant running Windows, Office Copilot, Xbox gaming, and the Azure cloud hosting modern AI.',
  },
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    price: 2980.50,
    currency: 'INR',
    change: 28.40,
    changePercent: 0.96,
    high52: 3217.90,
    low52: 2220.30,
    volatility: 0.22, // 22% annual vol
    drift: 0.14,
    beta: 0.88,
    peRatio: 26.2,
    marketCap: '₹20.15 Lakh Crore',
    sector: 'Conglomerate (Telecom, Retail, Energy)',
    exchange: 'NSE / BSE',
    description: "India's highest market cap conglomerate dominating digital 5G telecom (Jio), retail chains, green hydrogen energy, and petrochemical refining.",
    eli5Description: "India's massive conglomerate that provides mobile internet to hundreds of millions, runs India's biggest store chain, and refines energy.",
  },
  {
    symbol: 'BTC-USD',
    name: 'Bitcoin',
    price: 64350.00,
    currency: 'USD',
    change: 1820.00,
    changePercent: 2.91,
    high52: 73750.00,
    low52: 25150.00,
    volatility: 0.65,
    drift: 0.35,
    beta: 2.85,
    peRatio: 0,
    marketCap: '$1.27 Trillion',
    sector: 'Digital Asset / Store of Value',
    exchange: 'Crypto Spot',
    description: 'Decentralized digital commodity and apex cryptocurrency acting as global sovereign monetary reserve and algorithmic scarcity store of value.',
    eli5Description: 'Digital gold: a fixed-supply, decentralized digital currency traded 24/7 globally without any central bank.',
  },
  {
    symbol: 'INFY',
    name: 'Infosys Limited',
    price: 1885.00,
    currency: 'INR',
    change: -12.50,
    changePercent: -0.66,
    high52: 1975.00,
    low52: 1358.35,
    volatility: 0.25,
    drift: 0.11,
    beta: 0.94,
    peRatio: 28.1,
    marketCap: '₹7.82 Lakh Crore',
    sector: 'IT Services & Digital Transformation',
    exchange: 'NSE / NYSE',
    description: 'Leading global next-generation IT consulting and digital transformation services provider delivering Topaz Generative AI enterprise solutions.',
    eli5Description: 'A premier global IT services firm building enterprise software, cloud migration, and AI systems for Fortune 500 companies.',
  },
];

export const MACRO_SCENARIOS: MacroScenario[] = [
  {
    id: 'earnings-beat',
    title: 'Company Performs Better Than Expected (+25% Beat & Raise)',
    category: 'earnings_beat',
    description: 'Quarterly revenue and EPS crush Street expectations by +25%, gross margins expand by 320 bps, and management raises full-year forward revenue guidance.',
    studentDescription: 'The company reported blowout quarterly earnings, beat every sales target, and told investors profits will grow even faster next quarter.',
    defaultDriftShift: 0.18, // +18% drift
    defaultVolShift: -0.04, // -4% vol compression as uncertainty resolves
    probability: 'High',
    historicalAnalogy: 'NVDA Q1 2023 Guidance Inflection / GOOGL Cloud Profitability Inflection',
    pointsImpact: '+12% to +18% Instant Re-rating'
  },
  {
    id: 'points-drop-shock',
    title: 'Company Just Dropped X Points (-15% Sudden Flash Selloff)',
    category: 'points_drop',
    description: 'Asset suffers a sudden intraday drawdown of -15% (e.g. -20 to -35 points) triggered by unexpected multiple compression or institutional de-grossing.',
    studentDescription: 'The stock suddenly drops by 15% in a short window due to heavy fund selling or panic, shifting the entire forecast trajectory downward.',
    defaultDriftShift: -0.16, // -16% drift
    defaultVolShift: 0.22, // +22% volatility expansion
    probability: 'Medium',
    historicalAnalogy: 'Post-Earnings Multiple Contraction / Flash Liquidity Vacuum',
    pointsImpact: '-15% to -20% Multiple Contraction'
  },
  {
    id: 'product-breakthrough',
    title: 'Major Product Breakthrough & Adoption Surge',
    category: 'tech_breakthrough',
    description: 'Unveiling of groundbreaking next-gen architecture (e.g. custom AI inference silicon or commercial autonomous licensing) with 4x customer order surge.',
    studentDescription: 'The company launches an incredible new tech product that customers are lining up to buy, multiplying sales projections.',
    defaultDriftShift: 0.22, // +22% drift
    defaultVolShift: 0.05, // +5% volatility (heavy momentum volume)
    probability: 'Medium',
    historicalAnalogy: 'ChatGPT Launch / Next-Gen Architecture Unveiling',
    pointsImpact: '+20% to +30% Multi-Quarter Expansion'
  },
  {
    id: 'customer-loss-cut',
    title: 'Key Customer Loss / Order Cut Shock',
    category: 'customer_shock',
    description: 'A Tier-1 enterprise customer slashes forward hardware/software commitments by 30% to trial in-house custom ASICs or a competing platform.',
    studentDescription: 'One of the company\'s biggest buyers suddenly cuts back on orders, putting a dent in next year\'s revenue projections.',
    defaultDriftShift: -0.13, // -13% drift
    defaultVolShift: 0.15, // +15% volatility
    probability: 'Low',
    historicalAnalogy: 'Tier-1 Hyperscaler ASIC Diversification Announcement',
    pointsImpact: '-8% to -14% Target Revision'
  },
  {
    id: 'antitrust-regulatory-fine',
    title: 'Antitrust Ruling & Regulatory Penalty',
    category: 'regulatory',
    description: 'Regulatory authorities impose significant antitrust penalties and mandate behavioral remedies on distribution partnerships and default bundling.',
    studentDescription: 'Government regulators hit the company with a massive fine and new rules limiting how it distributes its products.',
    defaultDriftShift: -0.09, // -9% drift
    defaultVolShift: 0.11, // +11% volatility
    probability: 'Medium',
    historicalAnalogy: 'DOJ Antitrust Rulings / EU Digital Markets Act Sanctions',
    pointsImpact: '-6% to -10% Structural Multiple Haircut'
  },
  {
    id: 'custom',
    title: 'Custom Stock Shock / Point Drop Simulator',
    category: 'custom',
    description: 'Define any custom performance catalyst or point shock (e.g. "Stock dropped 25 points on guidance miss", "Secures $10B military AI contract").',
    studentDescription: 'Type your own company headline or point drop to simulate the exact quantitative shift in return drift, volatility, and price bands.',
    defaultDriftShift: 0.0,
    defaultVolShift: 0.0,
    probability: 'Medium',
    historicalAnalogy: 'User-specified event vector',
    pointsImpact: 'Dynamic AI Computed Shift'
  }
];

export const MOCK_QUALITATIVE_ARCHIVE: Record<string, QualitativeSynthesis> = {
  NVDA: {
    ticker: 'NVDA',
    lastUpdated: 'Live Market Model',
    executiveSummary: 'NVIDIA retains an estimated 88%+ market share in datacenter training & inference hardware. Blackwell B200 architecture ramp is fully sold out for the next 4 quarters, with gross margins sustaining near 74%.',
    eli5Summary: 'NVIDIA is dominating the AI revolution because nearly every major company needs its graphics processors to build and run artificial intelligence.',
    bullishDrivers: [
      {
        title: 'Blackwell Ultra Architecture Supercycle',
        impactScore: 9.4,
        horizon: 'Immediate',
        explanation: 'Tier-1 hyperscalers (Microsoft, Meta, Google, AWS) expanding multi-billion dollar capex allocations for NVL72 rack-scale deployments.',
        eli5Explanation: 'All major tech companies are placing huge pre-orders for their newest and fastest AI superchip racks.'
      },
      {
        title: 'CUDA Software Ecosystem Moat',
        impactScore: 8.8,
        horizon: 'Long-term',
        explanation: 'Over 5 million developers locked into CUDA parallel computing libraries, making switching costs to competing ASICs prohibitively high.',
        eli5Explanation: 'Millions of software engineers know how to write programs specifically for Nvidia chips, making it really hard to switch to competitors.'
      },
      {
        title: 'Sovereign AI & Enterprise Monetization',
        impactScore: 8.2,
        horizon: 'Medium-term',
        explanation: 'Nation-states (Japan, Singapore, France, Middle East) procuring domestic sovereign AI clusters to ensure data independence.',
        eli5Explanation: 'Countries around the world are buying billions in Nvidia chips to build their own national AI infrastructure.'
      }
    ],
    bearishRisks: [
      {
        title: 'Custom Silicon ASIC In-Housing',
        impactScore: 7.1,
        horizon: 'Medium-term',
        explanation: 'Google TPU v6, AWS Trainium 2, and Meta MTIA custom accelerators gradually capturing internal inference workloads.',
        eli5Explanation: 'Big tech companies are starting to design their own internal chips to save money on buying so many Nvidia cards.'
      },
      {
        title: 'Geopolitical Export Restriction Tightening',
        impactScore: 6.8,
        horizon: 'Immediate',
        explanation: 'Stricter compute-density caps to China and Southeast Asia could compress regional addressable market growth by 5-8%.',
        eli5Explanation: 'Government trade restrictions might limit how many high-end chips Nvidia can sell to overseas markets.'
      },
      {
        title: 'High Base Effect & Valuation Compression',
        impactScore: 6.2,
        horizon: 'Immediate',
        explanation: 'Trading at ~50x forward P/E leaves minimal margin of safety if quarterly revenue beats compress from +20% to +5%.',
        eli5Explanation: 'The stock has climbed very fast, so even a tiny miss in revenue growth could trigger a temporary pullback.'
      }
    ],
    keyCatalysts: [
      {
        event: 'Blackwell Ultra B300 Full Production Yield',
        timeframe: 'Next 45 Days',
        expectedImpact: 'High',
        bias: 'Bullish',
        detail: 'TSMC CoWoS packaging capacity expansion confirming record delivery throughput.'
      },
      {
        event: 'Quarterly Earnings & Datacenter Guidance',
        timeframe: 'In 3 Weeks',
        expectedImpact: 'High',
        bias: 'Bullish',
        detail: 'Consensus expectation of $38.5B revenue with updated forward datacenter trajectory.'
      },
      {
        event: 'GTC Developer Ecosystem Keynote',
        timeframe: 'Q4 Milestone',
        expectedImpact: 'Moderate',
        bias: 'Bullish',
        detail: 'Unveiling next-gen Rubin architecture roadmap and humanoid robotics platform.'
      }
    ],
    llmSuggestedDrift: 0.28,
    llmSuggestedVol: 0.48,
    confidenceScore: 92,
    source: 'institutional_archive'
  },
  TSLA: {
    ticker: 'TSLA',
    lastUpdated: 'Live Market Model',
    executiveSummary: 'Tesla is undergoing a strategic valuation transition from automotive OEM to AI/physical robotics platform. Key value drivers center on Full Self-Driving (v12.5+ end-to-end neural network) regulatory approval and Megapack energy storage.',
    eli5Summary: 'Tesla is evolving from just selling electric cars to selling self-driving software subscriptions, massive power grid batteries, and AI humanoid robots.',
    bullishDrivers: [
      {
        title: 'Robotaxi Network Commercial Scaling',
        impactScore: 9.1,
        horizon: 'Medium-term',
        explanation: 'Unsupervised FSD deployment and Cybercab fleet economics offering software-like 70%+ gross profit margins.',
        eli5Explanation: 'If cars drive themselves safely without human drivers, Tesla can run a ride-sharing service that generates huge software profits.'
      },
      {
        title: 'Energy Megapack Hyper-Growth (+120% YoY)',
        impactScore: 8.5,
        horizon: 'Immediate',
        explanation: 'Lathrop and Shanghai Megafactories operating at max capacity, supplying utility-scale grid stabilization batteries worldwide.',
        eli5Explanation: 'Tesla is making giant industrial battery packs for electricity grids, and this business is doubling in size every year.'
      },
      {
        title: 'Optimus Humanoid Robotics Commercialization',
        impactScore: 8.0,
        horizon: 'Long-term',
        explanation: 'Internal deployment of 1,000+ humanoid units on automotive assembly lines, reducing manufacturing labor unit costs.',
        eli5Explanation: 'Tesla is building walking robot assistants to do repetitive factory work and eventually help around homes.'
      }
    ],
    bearishRisks: [
      {
        title: 'Global EV Price War & Margin Compression',
        impactScore: 7.9,
        horizon: 'Immediate',
        explanation: 'Intense competition from Chinese OEMs (BYD, Xiaomi) compressing core automotive gross margins (ex-regulatory credits) below 15%.',
        eli5Explanation: 'Electric car competitors are lowering prices in China and Europe, which cuts into profit per car.'
      },
      {
        title: 'Autonomous Regulatory Bottlenecks',
        impactScore: 7.4,
        horizon: 'Medium-term',
        explanation: 'NHTSA inquiries and multi-state autonomous licensing delays pushing timeline for unsupervised robotaxi launch into 2026+.',
        eli5Explanation: 'Safety regulators may take longer to approve driverless cars on public roads.'
      }
    ],
    keyCatalysts: [
      {
        event: 'Robotaxi Unsupervised Regulatory Filing',
        timeframe: 'Next 60 Days',
        expectedImpact: 'High',
        bias: 'Bullish',
        detail: 'First state approvals for commercial driverless rides in Texas and California.'
      },
      {
        event: '$25,000 Next-Gen Vehicle Production Start',
        timeframe: 'First Half Next Year',
        expectedImpact: 'High',
        bias: 'Bullish',
        detail: 'Unboxed manufacturing method reducing assembly footprint by 40%.'
      }
    ],
    llmSuggestedDrift: 0.18,
    llmSuggestedVol: 0.58,
    confidenceScore: 86,
    source: 'institutional_archive'
  },
  RELIANCE: {
    ticker: 'RELIANCE',
    lastUpdated: 'Live Market Model',
    executiveSummary: "Reliance is India's premier digital and energy titan. Upcoming value-unlocking IPOs for Jio Infocomm (5G telecom) and Reliance Retail provide significant catalyst optionality alongside expanding green hydrogen solar giga-factories.",
    eli5Summary: "Reliance is India's biggest company, powering Indian smartphones with Jio 5G, selling goods across thousands of retail stores, and building clean energy factories.",
    bullishDrivers: [
      {
        title: 'Jio Telecom & Retail Value Unlock IPOs',
        impactScore: 9.2,
        horizon: 'Medium-term',
        explanation: 'Planned separate listings of Jio Platforms and Reliance Retail could unlock $120B+ in distinct market capitalization.',
        eli5Explanation: 'Separately listing the telecom and retail divisions on the stock market can release massive hidden value to shareholders.'
      },
      {
        title: '5G ARPU Expansion & Digital Services Monetization',
        impactScore: 8.4,
        horizon: 'Immediate',
        explanation: 'Recent 20% tariff hikes flow straight to EBITDA with 490M+ active mobile subscribers migrating to higher tier 5G plans.',
        eli5Explanation: 'Mobile recharge prices increased, which directly increases monthly profit across nearly 500 million telecom customers.'
      },
      {
        title: 'Jamnagar Green Energy & Solar Giga-Complex',
        impactScore: 7.8,
        horizon: 'Long-term',
        explanation: '₹75,000 Crore capex into integrated photovoltaic cells, electrolyzers, and battery storage targeting net-zero carbon.',
        eli5Explanation: 'Building giant renewable solar and hydrogen battery plants to power India with cheap green energy.'
      }
    ],
    bearishRisks: [
      {
        title: 'Refining Margin (GRM) Volatility',
        impactScore: 6.9,
        horizon: 'Immediate',
        explanation: 'Fluctuating Singapore gross refining margins and petrochemical spreads impacting oil-to-chemicals (O2C) segment earnings.',
        eli5Explanation: 'Swings in global oil prices can make oil refining profits go up and down quickly.'
      },
      {
        title: 'High Consolidated Capital Expenditure',
        impactScore: 6.3,
        horizon: 'Medium-term',
        explanation: 'Sustained elevated capex across retail expansion and 5G infrastructure keeps consolidated debt ratios in focus.',
        eli5Explanation: 'Investing hundreds of billions in new stores and cell towers means high short-term spending.'
      }
    ],
    keyCatalysts: [
      {
        event: 'Annual General Meeting (AGM) IPO Timeline',
        timeframe: 'Upcoming Quarter',
        expectedImpact: 'High',
        bias: 'Bullish',
        detail: 'Expected roadmap announcement for Jio and Retail spin-off IPO listings.'
      },
      {
        event: 'Solar PV Giga-Factory Commissioning',
        timeframe: 'Next 90 Days',
        expectedImpact: 'Moderate',
        bias: 'Bullish',
        detail: 'Phase 1 of Dhirubhai Ambani Green Energy complex entering commercial power delivery.'
      }
    ],
    llmSuggestedDrift: 0.14,
    llmSuggestedVol: 0.22,
    confidenceScore: 90,
    source: 'institutional_archive'
  },
  GOOGL: {
    ticker: 'GOOGL',
    lastUpdated: 'Live Market Model',
    executiveSummary: 'Alphabet retains an impregnable core search advertising cash engine while scaling Google Cloud to 30%+ operating margin run-rates. Gemini multimodal architecture integration across Workspace, Android, and Search Generative Experience fortifies competitive positioning, with Waymo leading global driverless commercial operations.',
    eli5Summary: 'Google dominates search and YouTube while rapidly growing its cloud computing business and leading the commercial robotaxi industry with Waymo.',
    bullishDrivers: [
      {
        title: 'Gemini Foundation AI & Cloud Operating Margin Inflection',
        impactScore: 9.3,
        horizon: 'Immediate',
        explanation: 'Google Cloud annual revenue run-rate surpassing $44B with operating margins expanding over 30%, driven by enterprise Gemini API and TPU v5e/v6 adoption.',
        eli5Explanation: 'More companies are paying for Google Cloud and Gemini AI, turning the cloud into a giant cash machine.'
      },
      {
        title: 'Waymo Autonomous Commercial Ride Monopoly',
        impactScore: 8.7,
        horizon: 'Medium-term',
        explanation: 'Providing over 150,000+ paid driverless robotaxi trips weekly across Phoenix, SF, and LA with multi-city expansion roadmap.',
        eli5Explanation: 'Waymo is already giving hundreds of thousands of paid, driverless rides in major cities ahead of competitors.'
      },
      {
        title: 'YouTube Premium & Connected TV Monetization',
        impactScore: 8.1,
        horizon: 'Long-term',
        explanation: 'Over 100M YouTube Music/Premium subscribers combined with NFL Sunday Ticket driving high-retention subscription cash flows.',
        eli5Explanation: 'YouTube brings in massive recurring revenue from ads, paid music subscriptions, and live sports.'
      }
    ],
    bearishRisks: [
      {
        title: 'Antitrust Search Distribution Remedies',
        impactScore: 7.6,
        horizon: 'Immediate',
        explanation: 'DOJ remedy hearings potentially impacting default search agreements (e.g. Apple Safari revenue share) and exclusive distribution agreements.',
        eli5Explanation: 'Government antitrust rulings might make it harder to be the automatic default search engine on all smartphones.'
      },
      {
        title: 'AI Search Transition & Compute Cost per Query',
        impactScore: 6.9,
        horizon: 'Medium-term',
        explanation: 'Shift from traditional index links to generative AI overviews requires higher compute inference FLOPs, temporarily compressing gross margins.',
        eli5Explanation: 'Generating AI answers costs more computing power than standard search result links.'
      }
    ],
    keyCatalysts: [
      {
        event: 'Gemini 3.0 Multimodal Reasoning Release',
        timeframe: 'Next 45 Days',
        expectedImpact: 'High',
        bias: 'Bullish',
        detail: 'Next-generation agentic reasoning model benchmarking across enterprise code & science.'
      },
      {
        event: 'Waymo Commercial Fleet Expansion (Austin & Atlanta)',
        timeframe: 'Next 90 Days',
        expectedImpact: 'Moderate',
        bias: 'Bullish',
        detail: 'Launching commercial operations with Uber partnership in high-density metro areas.'
      }
    ],
    llmSuggestedDrift: 0.16,
    llmSuggestedVol: 0.29,
    confidenceScore: 91,
    source: 'institutional_archive'
  }
};
