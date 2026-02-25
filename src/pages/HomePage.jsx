import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import './HomePage.css';

const sectorData = [
  {
    id: 'tech',
    name: 'Technology',
    accent: '#1d4ed8',
    colStart: 1,
    rowStart: 1,
    colSpan: 12,
    rowSpan: 6,
    companyCols: 24,
    companyRows: 16,
    companies: [
      { ticker: 'NVDA', name: 'NVIDIA', colStart: 1, rowStart: 1, colSpan: 8, rowSpan: 9 },
      { ticker: 'AAPL', name: 'Apple', colStart: 9, rowStart: 1, colSpan: 8, rowSpan: 9 },
      { ticker: 'MSFT', name: 'Microsoft', colStart: 17, rowStart: 1, colSpan: 8, rowSpan: 9 },
      { ticker: 'AVGO', name: 'Broadcom', colStart: 1, rowStart: 10, colSpan: 6, rowSpan: 7 },
      { ticker: 'GE', name: 'General Electric', colStart: 7, rowStart: 10, colSpan: 6, rowSpan: 7 },
      { ticker: 'AMD', name: 'AMD', colStart: 13, rowStart: 10, colSpan: 6, rowSpan: 7 },
      { ticker: 'INTC', name: 'Intel', colStart: 19, rowStart: 10, colSpan: 6, rowSpan: 4 },
      { ticker: 'CSCO', name: 'Cisco Systems', colStart: 19, rowStart: 14, colSpan: 3, rowSpan: 3 },
      { ticker: 'MU', name: 'Micron Technology', colStart: 22, rowStart: 14, colSpan: 3, rowSpan: 3 }
    ]
  },
  {
    id: 'software',
    name: 'Software / Technology Services',
    accent: '#0f766e',
    colStart: 13,
    rowStart: 1,
    colSpan: 12,
    rowSpan: 6,
    companyCols: 12,
    companyRows: 12,
    companies: [
      { ticker: 'GOOGL', name: 'Alphabet', colStart: 1, rowStart: 1, colSpan: 8, rowSpan: 7 },
      { ticker: 'META', name: 'Meta', colStart: 9, rowStart: 1, colSpan: 4, rowSpan: 4 },
      { ticker: 'ORCL', name: 'Oracle', colStart: 9, rowStart: 5, colSpan: 4, rowSpan: 3 },
      { ticker: 'CRM', name: 'Salesforce', colStart: 1, rowStart: 8, colSpan: 4, rowSpan: 5 },
      { ticker: 'ADBE', name: 'Adobe', colStart: 5, rowStart: 8, colSpan: 4, rowSpan: 5 },
      { ticker: 'NFLX', name: 'Netflix', colStart: 9, rowStart: 8, colSpan: 4, rowSpan: 3 },
      { ticker: 'PLTR', name: 'Palantir', colStart: 9, rowStart: 11, colSpan: 2, rowSpan: 2 },
      { ticker: 'NOW', name: 'ServiceNow', colStart: 11, rowStart: 11, colSpan: 2, rowSpan: 2 }
    ]
  },
  {
    id: 'consumer',
    name: 'Consumer',
    accent: '#7c3aed',
    colStart: 9,
    rowStart: 7,
    colSpan: 8,
    rowSpan: 7,
    companyCols: 10,
    companyRows: 10,
    companies: [
      { ticker: 'AMZN', name: 'Amazon', colStart: 1, rowStart: 1, colSpan: 6, rowSpan: 6 },
      { ticker: 'WMT', name: 'Walmart', colStart: 7, rowStart: 1, colSpan: 4, rowSpan: 4 },
      { ticker: 'COST', name: 'Costco', colStart: 7, rowStart: 5, colSpan: 4, rowSpan: 2 },
      { ticker: 'KO', name: 'Coca-Cola', colStart: 1, rowStart: 7, colSpan: 4, rowSpan: 4 },
      { ticker: 'HD', name: 'Home Depot', colStart: 5, rowStart: 7, colSpan: 2, rowSpan: 4 },
      { ticker: 'NKE', name: 'Nike', colStart: 7, rowStart: 7, colSpan: 2, rowSpan: 4 },
      { ticker: 'UPS', name: 'UPS', colStart: 9, rowStart: 7, colSpan: 2, rowSpan: 4 }
    ]
  },
  {
    id: 'finance',
    name: 'Financials',
    accent: '#0b5ed7',
    colStart: 1,
    rowStart: 7,
    colSpan: 8,
    rowSpan: 7,
    companyCols: 15,
    companyRows: 10,
    companies: [
      { ticker: 'JPM', name: 'JPMorgan Chase', colStart: 1, rowStart: 1, colSpan: 6, rowSpan: 6 },
      { ticker: 'V', name: 'Visa', colStart: 7, rowStart: 1, colSpan: 5, rowSpan: 4 },
      { ticker: 'MA', name: 'Mastercard', colStart: 12, rowStart: 1, colSpan: 4, rowSpan: 4 },
      { ticker: 'BAC', name: 'Bank of America', colStart: 7, rowStart: 5, colSpan: 5, rowSpan: 3 },
      { ticker: 'BRK-B', name: 'Berkshire Hathaway', colStart: 12, rowStart: 5, colSpan: 4, rowSpan: 3 },
      { ticker: 'AXP', name: 'American Express', colStart: 1, rowStart: 7, colSpan: 6, rowSpan: 4 },
      { ticker: 'BLK', name: 'BlackRock', colStart: 7, rowStart: 8, colSpan: 3, rowSpan: 3 },
      { ticker: 'SCHW', name: 'Charles Schwab', colStart: 10, rowStart: 8, colSpan: 3, rowSpan: 3 },
      { ticker: 'GS', name: 'Goldman Sachs', colStart: 13, rowStart: 8, colSpan: 3, rowSpan: 3 }
    ]
  },
  {
    id: 'telecom',
    name: 'Telecommunications Services',
    accent: '#5b21b6',
    colStart: 17,
    rowStart: 7,
    colSpan: 8,
    rowSpan: 7,
    companyCols: 12,
    companyRows: 10,
    companies: [
      { ticker: 'TMUS', name: 'T-Mobile', colStart: 1, rowStart: 1, colSpan: 6, rowSpan: 6 },
      { ticker: 'VZ', name: 'Verizon', colStart: 7, rowStart: 1, colSpan: 6, rowSpan: 4 },
      { ticker: 'T', name: 'AT&T', colStart: 7, rowStart: 5, colSpan: 6, rowSpan: 2 },
      { ticker: 'CMCSA', name: 'Comcast', colStart: 1, rowStart: 7, colSpan: 4, rowSpan: 4 },
      { ticker: 'CHTR', name: 'Charter', colStart: 5, rowStart: 7, colSpan: 4, rowSpan: 4 },
      { ticker: 'DIS', name: 'Disney', colStart: 9, rowStart: 7, colSpan: 2, rowSpan: 4 },
      { ticker: 'TME', name: 'Tencent Music', colStart: 11, rowStart: 7, colSpan: 2, rowSpan: 4 }
    ]
  },
  {
    id: 'healthcare',
    name: 'Medical / Healthcare',
    accent: '#be123c',
    colStart: 1,
    rowStart: 14,
    colSpan: 8,
    rowSpan: 7,
    companyCols: 12,
    companyRows: 10,
    companies: [
      { ticker: 'UNH', name: 'UnitedHealth', colStart: 1, rowStart: 1, colSpan: 6, rowSpan: 6 },
      { ticker: 'LLY', name: 'Eli Lilly', colStart: 7, rowStart: 1, colSpan: 3, rowSpan: 4 },
      { ticker: 'JNJ', name: 'Johnson & Johnson', colStart: 10, rowStart: 1, colSpan: 3, rowSpan: 4 },
      { ticker: 'ABBV', name: 'AbbVie', colStart: 7, rowStart: 5, colSpan: 3, rowSpan: 2 },
      { ticker: 'MRK', name: 'Merck', colStart: 10, rowStart: 5, colSpan: 3, rowSpan: 2 },
      { ticker: 'PFE', name: 'Pfizer', colStart: 1, rowStart: 7, colSpan: 3, rowSpan: 4 },
      { ticker: 'TMO', name: 'Thermo Fisher', colStart: 4, rowStart: 7, colSpan: 3, rowSpan: 4 },
      { ticker: 'DHR', name: 'Danaher', colStart: 7, rowStart: 7, colSpan: 3, rowSpan: 4 },
      { ticker: 'ISRG', name: 'Intuitive Surgical', colStart: 10, rowStart: 7, colSpan: 3, rowSpan: 4 }
    ]
  },
  {
    id: 'industrials',
    name: 'Manufacturing & Industrials',
    accent: '#b45309',
    colStart: 9,
    rowStart: 14,
    colSpan: 8,
    rowSpan: 7,
    companyCols: 12,
    companyRows: 10,
    companies: [
      { ticker: 'GE', name: 'General Electric', colStart: 1, rowStart: 1, colSpan: 6, rowSpan: 5 },
      { ticker: 'CAT', name: 'Caterpillar', colStart: 7, rowStart: 1, colSpan: 6, rowSpan: 5 },
      { ticker: 'BA', name: 'Boeing', colStart: 1, rowStart: 6, colSpan: 4, rowSpan: 3 },
      { ticker: 'HON', name: 'Honeywell', colStart: 5, rowStart: 6, colSpan: 4, rowSpan: 3 },
      { ticker: 'RTX', name: 'RTX', colStart: 9, rowStart: 6, colSpan: 4, rowSpan: 3 },
      { ticker: 'DE', name: 'Deere & Company', colStart: 1, rowStart: 9, colSpan: 3, rowSpan: 2 },
      { ticker: 'LMT', name: 'Lockheed Martin', colStart: 4, rowStart: 9, colSpan: 3, rowSpan: 2 },
      { ticker: 'UNP', name: 'Union Pacific', colStart: 7, rowStart: 9, colSpan: 3, rowSpan: 2 },
      { ticker: 'GD', name: 'General Dynamics', colStart: 10, rowStart: 9, colSpan: 3, rowSpan: 2 }
    ]
  },
  {
    id: 'energy',
    name: 'Electric / Energy & Utilities',
    accent: '#0f766e',
    colStart: 17,
    rowStart: 14,
    colSpan: 8,
    rowSpan: 7,
    companyCols: 12,
    companyRows: 10,
    companies: [
      { ticker: 'XOM', name: 'Exxon Mobil', colStart: 1, rowStart: 1, colSpan: 6, rowSpan: 6 },
      { ticker: 'CVX', name: 'Chevron', colStart: 7, rowStart: 1, colSpan: 6, rowSpan: 4 },
      { ticker: 'COP', name: 'ConocoPhillips', colStart: 7, rowStart: 5, colSpan: 3, rowSpan: 2 },
      { ticker: 'SBGSY', name: 'Schneider Electric', colStart: 10, rowStart: 5, colSpan: 3, rowSpan: 2 },
      { ticker: 'GEV', name: 'GE Vernova', colStart: 1, rowStart: 7, colSpan: 6, rowSpan: 2 },
      { ticker: 'NEE', name: 'NextEra Energy', colStart: 7, rowStart: 7, colSpan: 3, rowSpan: 2 },
      { ticker: 'DUK', name: 'Duke Energy', colStart: 10, rowStart: 7, colSpan: 3, rowSpan: 2 },
      { ticker: 'SO', name: 'Southern Company', colStart: 1, rowStart: 9, colSpan: 3, rowSpan: 2 },
      { ticker: 'AEP', name: 'American Electric Power', colStart: 4, rowStart: 9, colSpan: 3, rowSpan: 2 },
      { ticker: 'SMNEY', name: 'Siemens Energy', colStart: 7, rowStart: 9, colSpan: 3, rowSpan: 2 },
      { ticker: 'EXC', name: 'Exelon', colStart: 10, rowStart: 9, colSpan: 3, rowSpan: 2 }
    ]
  }
];

function logoUrlForTicker(ticker) {
  return `https://financialmodelingprep.com/image-stock/${ticker}.png`;
}

function tileScale({ colSpan, rowSpan }) {
  const area = colSpan * rowSpan;
  const normalized = Math.sqrt(area);
  // Slightly boost very large tiles while compressing mid-size tiles.
  let scaled = 0.82 + (normalized / 4.7);
  if (area >= 70) {
    scaled += 0.08;
  }
  if (area <= 28) {
    scaled -= 0.05;
  }
  return Math.max(0.78, Math.min(1.7, Number(scaled.toFixed(2))));
}

function featuredCompanyScaleBoost(ticker, area) {
  const boosts = {
    AMZN: 0.16,
    JPM: 0.14,
    TMUS: 0.12,
    UPS: 0.1,
    GOOGL: 0.16,
    NVDA: 0.16,
    UNH: 0.14,
    XOM: 0.14
  };

  const boost = boosts[ticker] || 0;
  if (!boost || area < 18) {
    return 0;
  }

  return area >= 30 ? boost : boost * 0.7;
}

function sectorScale(sector) {
  const sectorArea = sector.colSpan * sector.rowSpan;
  const scaled = Math.sqrt(sectorArea) / 8;
  return Math.max(0.9, Math.min(1.15, Number(scaled.toFixed(2))));
}

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <motion.section
        className="sectors-heatmap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        {sectorData.map((sector) => (
          <motion.article
            key={sector.id}
            className="sector-block"
            style={{
              '--sector-accent': sector.accent,
              '--sector-scale': sectorScale(sector),
              '--sector-col-start': sector.colStart,
              '--sector-row-start': sector.rowStart,
              '--sector-col-span': sector.colSpan,
              '--sector-row-span': sector.rowSpan
            }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <div className="sector-heading">
              <h2>{sector.name}</h2>
            </div>

            <div
              className="company-heatmap-grid"
              style={{
                '--company-cols': sector.companyCols,
                '--company-rows': sector.companyRows
              }}
            >
              {sector.companies.map((company) => {
                const tileSpan = { colSpan: company.colSpan, rowSpan: company.rowSpan };
                const area = tileSpan.colSpan * tileSpan.rowSpan;
                const baseScale = tileScale(tileSpan);
                const panelScale = Math.min(
                  1.85,
                  Number((baseScale + featuredCompanyScaleBoost(company.ticker, area)).toFixed(2))
                );
                const forceLogoOnly = company.ticker === 'CSCO' || company.ticker === 'MU' || company.ticker === 'INTC';
                const showTicker = !forceLogoOnly && (tileSpan.colSpan * tileSpan.rowSpan) >= 8;

                return (
                  <motion.button
                    key={company.ticker}
                    type="button"
                    className="heatmap-tile"
                    onClick={() => navigate(`/financials?ticker=${company.ticker}`)}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      '--tile-col-start': company.colStart || 'auto',
                      '--tile-row-start': company.rowStart || 'auto',
                      '--tile-col-span': tileSpan.colSpan,
                      '--tile-row-span': tileSpan.rowSpan,
                      '--panel-scale': panelScale
                    }}
                    >
                      <div className="tile-center">
                        <img
                          src={logoUrlForTicker(company.ticker)}
                          alt={`${company.name} logo`}
                          className="tile-logo"
                          loading="lazy"
                        />
                        {showTicker && <span className="tile-ticker">{company.ticker}</span>}
                      </div>
                    </motion.button>
                );
              })}
            </div>
          </motion.article>
        ))}
      </motion.section>
    </div>
  );
}

export default HomePage;
