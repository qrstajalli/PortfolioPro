import type { StockQuote } from '../types/auth'

export interface CompanyInfo {
  symbol: string
  name: string
  description: string
  ceo: string
  founded: number
  headquarters: string
  employees: string
  sector: string
  industry: string
  exchange: string
  website: string
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  beta: number
  dividendYield: number
  bookValue?: number
}

export const COMPANY_PROFILES: Record<string, CompanyInfo> = {
  RELIANCE: {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    description:
      'Reliance Industries Limited is an Indian multinational conglomerate headquartered in Mumbai. Its diverse portfolio spans energy, petrochemicals, natural gas, retail, telecommunications, mass media, and renewable energy, making it India’s most valuable enterprise.',
    ceo: 'Mukesh D. Ambani',
    founded: 1958,
    headquarters: 'Mumbai, Maharashtra, India',
    employees: '347,000+',
    sector: 'Energy',
    industry: 'Oil & Gas Refining, Petrochemicals & Retail',
    exchange: 'NSE',
    website: 'https://www.ril.com',
    fiftyTwoWeekHigh: 3217.9,
    fiftyTwoWeekLow: 2220.3,
    beta: 0.94,
    dividendYield: 0.35,
    bookValue: 1240.5,
  },
  TCS: {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    description:
      'Tata Consultancy Services is a global leader in IT consulting, digital solutions, and business services. Partnering with top Fortune 500 enterprises, TCS drives large-scale cloud modernization, artificial intelligence adoption, and cognitive business operations.',
    ceo: 'K. Krithivasan',
    founded: 1968,
    headquarters: 'Mumbai, Maharashtra, India',
    employees: '601,000+',
    sector: 'Information Technology',
    industry: 'IT Services & Consulting',
    exchange: 'NSE',
    website: 'https://www.tcs.com',
    fiftyTwoWeekHigh: 4592.25,
    fiftyTwoWeekLow: 3313.0,
    beta: 0.72,
    dividendYield: 1.34,
    bookValue: 312.4,
  },
  HDFCBANK: {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    description:
      'HDFC Bank Limited is India’s largest private-sector lender by assets and market capitalization. Following its historic merger with Housing Development Finance Corporation (HDFC), it delivers comprehensive retail, corporate, and rural banking solutions.',
    ceo: 'Sashidhar Jagdishan',
    founded: 1994,
    headquarters: 'Mumbai, Maharashtra, India',
    employees: '213,000+',
    sector: 'Financial Services',
    industry: 'Private Commercial & Retail Banking',
    exchange: 'NSE',
    website: 'https://www.hdfcbank.com',
    fiftyTwoWeekHigh: 1794.0,
    fiftyTwoWeekLow: 1363.55,
    beta: 1.08,
    dividendYield: 1.18,
    bookValue: 645.2,
  },
  INFY: {
    symbol: 'INFY',
    name: 'Infosys Ltd',
    description:
      'Infosys is a pioneer in global digital services and consulting. It steers global clients through their digital transformation via Cloud and AI platforms like Infosys Topaz and Cobalt, maintaining best-in-class corporate governance standards.',
    ceo: 'Salil Parekh',
    founded: 1981,
    headquarters: 'Bengaluru, Karnataka, India',
    employees: '317,000+',
    sector: 'Information Technology',
    industry: 'Digital Systems & Software Engineering',
    exchange: 'NSE',
    website: 'https://www.infosys.com',
    fiftyTwoWeekHigh: 1991.45,
    fiftyTwoWeekLow: 1358.35,
    beta: 0.85,
    dividendYield: 2.42,
    bookValue: 215.8,
  },
  ICICIBANK: {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd',
    description:
      'ICICI Bank Limited is an Indian multinational financial services powerhouse offering diversified banking products and digital services to corporate and retail customers through specialized subsidiaries in insurance, asset management, and securities.',
    ceo: 'Sandeep Bakhshi',
    founded: 1994,
    headquarters: 'Mumbai, Maharashtra, India',
    employees: '140,000+',
    sector: 'Financial Services',
    industry: 'Commercial Banking & Wealth Management',
    exchange: 'NSE',
    website: 'https://www.icicibank.com',
    fiftyTwoWeekHigh: 1332.95,
    fiftyTwoWeekLow: 928.0,
    beta: 1.12,
    dividendYield: 0.82,
    bookValue: 388.9,
  },
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    description:
      'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, supported by high-margin software ecosystems including the App Store, iCloud, Apple Pay, and Apple Silicon hardware architecture.',
    ceo: 'Tim Cook',
    founded: 1976,
    headquarters: 'Cupertino, California, USA',
    employees: '161,000+',
    sector: 'Technology',
    industry: 'Consumer Electronics & Software Ecosystems',
    exchange: 'NASDAQ',
    website: 'https://www.apple.com',
    fiftyTwoWeekHigh: 19950.0, // Converted to INR @ 84 ($237.50)
    fiftyTwoWeekLow: 13860.0, // Converted to INR @ 84 ($165.00)
    beta: 1.04,
    dividendYield: 0.45,
    bookValue: 3450.0,
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    description:
      'Microsoft Corporation develops and licenses mission-critical software, enterprise cloud infrastructure via Microsoft Azure, generative AI tools via Copilot, modern productivity suites with Microsoft 365, and gaming through Xbox Game Studios.',
    ceo: 'Satya Nadella',
    founded: 1975,
    headquarters: 'Redmond, Washington, USA',
    employees: '228,000+',
    sector: 'Technology',
    industry: 'Enterprise Cloud & Artificial Intelligence',
    exchange: 'NASDAQ',
    website: 'https://www.microsoft.com',
    fiftyTwoWeekHigh: 39312.0, // Converted to INR @ 84 ($468.00)
    fiftyTwoWeekLow: 25872.0, // Converted to INR @ 84 ($308.00)
    beta: 0.91,
    dividendYield: 0.72,
    bookValue: 8820.0,
  },
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    description:
      'NVIDIA Corporation is the world leader in accelerated computing and graphics processing units (GPUs). Its Blackwell and Hopper architectures power modern large language models, enterprise hyperscalers, and autonomous robotics worldwide.',
    ceo: 'Jensen Huang',
    founded: 1993,
    headquarters: 'Santa Clara, California, USA',
    employees: '29,600+',
    sector: 'Semiconductors',
    industry: 'Accelerated Compute & AI Hardware',
    exchange: 'NASDAQ',
    website: 'https://www.nvidia.com',
    fiftyTwoWeekHigh: 11827.2, // Converted to INR @ 84 ($140.80)
    fiftyTwoWeekLow: 3847.2, // Converted to INR @ 84 ($45.80)
    beta: 1.68,
    dividendYield: 0.03,
    bookValue: 1420.0,
  },
}

export const getCompanyProfile = (symbol: string, quote?: StockQuote): CompanyInfo => {
  const upper = symbol.toUpperCase()
  if (COMPANY_PROFILES[upper]) {
    return COMPANY_PROFILES[upper]
  }

  // Fallback profile if symbol is dynamically introduced
  const mult = quote?.exchange === 'NASDAQ' ? 84 : 1
  const price = quote ? Number(quote.currentPrice) * mult : 1000
  return {
    symbol: upper,
    name: quote?.name || upper,
    description: `${quote?.name || upper} is a publicly traded corporation listed on ${
      quote?.exchange || 'NSE'
    }, operating in the ${quote?.sector || 'General Market'} sector.`,
    ceo: 'Executive Management',
    founded: 2000,
    headquarters: quote?.exchange === 'NASDAQ' ? 'United States' : 'Mumbai, India',
    employees: '25,000+',
    sector: quote?.sector || 'Equities',
    industry: quote?.sector || 'Diversified Industries',
    exchange: quote?.exchange || 'NSE',
    website: 'https://www.nseindia.com',
    fiftyTwoWeekHigh: price * 1.18,
    fiftyTwoWeekLow: price * 0.82,
    beta: 1.0,
    dividendYield: 0.8,
  }
}
