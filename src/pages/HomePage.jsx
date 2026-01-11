import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import './HomePage.css';

export function HomePage() {
    const navigate = useNavigate();

    const techGiants = [
        { ticker: 'AAPL', name: 'Apple' },
        { ticker: 'MSFT', name: 'Microsoft' },
        { ticker: 'GOOGL', name: 'Alphabet' },
        { ticker: 'AMZN', name: 'Amazon' },
        { ticker: 'NVDA', name: 'NVIDIA' },
        // { ticker: 'TSLA', name: 'Tesla' },
        { ticker: 'META', name: 'Meta' },
        { ticker: 'PLTR', name: 'Palantir'}
    ];

    const financeGiants = [
        { ticker: 'JPM', name: 'JPMorgan Chase' },
        { ticker: 'GS', name: 'Goldman Sachs' },
        { ticker: 'BAC', name: 'Bank of America' },
        { ticker: 'MS', name: 'Morgan Stanley' },
        { ticker: 'WFC', name: 'Wells Fargo' },
        { ticker: 'MA', name: 'Mastercard' },
        { ticker: 'C', name: 'Citigroup' }
    ];

    const aerospaceGiants = [
        { ticker: 'GE', name: 'GE Aerospace' },
        { ticker: 'PL', name: 'Planet Labs' },
        { ticker: 'RKLB', name: 'Rocket Lab' },
        { ticker: 'ASTS', name: 'AST SpaceMobile' },
        { ticker: 'BA', name: 'Boeing' },
        { ticker: 'LMT', name: 'Lockheed Martin' },
        { ticker: 'RTX', name: 'RTX Corp' },
    ];

    const healthcareGiants = [
        { ticker: 'UNH', name: 'UnitedHealth' },
        { ticker: 'LLY', name: 'Eli Lilly' },
        { ticker: 'JNJ', name: 'Johnson & Johnson' },
        { ticker: 'ABBV', name: 'AbbVie' },
        { ticker: 'MRK', name: 'Merck' },
        { ticker: 'TMO', name: 'Thermo Fisher' },
        { ticker: 'PFE', name: 'Pfizer' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1
        }
    };

    return (
        <div className="home-container">
            <motion.div
                className="sector-section"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <h2 className="sector-title">Tech</h2>
                <div className="companies-grid">
                    {techGiants.map((company) => (
                        <motion.div
                            key={company.ticker}
                            className="company-card"
                            variants={itemVariants}
                            onClick={() => navigate(`/financials?ticker=${company.ticker}`)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div
                                className="card-logo-wrapper"
                                style={company.ticker === 'AMZN' || company.ticker === 'PLTR' ? { background: 'black' } : {}}
                            >
                                <img
                                    src={`https://financialmodelingprep.com/image-stock/${company.ticker}.png`}
                                    alt={`${company.name} logo`}
                                    className="card-logo"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                            <span className="card-name">{company.name}</span>
                            <span className="card-ticker">{company.ticker}</span>
    
                        </motion.div>
                    ))}
                </div>
            </motion.div>


            <motion.div
                className="sector-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
            >
                <h2 className="sector-title">Finance</h2>
                <div className="companies-grid">
                    {financeGiants.map((company) => (
                        <motion.div
                            key={company.ticker}
                            className="company-card"
                            variants={itemVariants}
                            onClick={() => navigate(`/financials?ticker=${company.ticker}`)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="card-logo-wrapper">
                                <img
                                    src={`https://financialmodelingprep.com/image-stock/${company.ticker}.png`}
                                    alt={`${company.name} logo`}
                                    className="card-logo"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                            <span className="card-name">{company.name}</span>
                            <span className="card-ticker">{company.ticker}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            <motion.div
                className="sector-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
            >
                <h2 className="sector-title">Aerospace & Defense</h2>
                <div className="companies-grid">
                    {aerospaceGiants.map((company) => (
                        <motion.div
                            key={company.ticker}
                            className="company-card"
                            variants={itemVariants}
                            onClick={() => navigate(`/financials?ticker=${company.ticker}`)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div
                                className="card-logo-wrapper"
                                style={['BA', 'LMT'].includes(company.ticker) ? { background: 'black' } : {}}
                            >
                                <img
                                    src={`https://financialmodelingprep.com/image-stock/${company.ticker}.png`}
                                    alt={`${company.name} logo`}
                                    className="card-logo"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                            <span className="card-name">{company.name}</span>
                            <span className="card-ticker">{company.ticker}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            <motion.div
                className="sector-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
            >
                <h2 className="sector-title">Healthcare</h2>
                <div className="companies-grid">
                    {healthcareGiants.map((company) => (
                        <motion.div
                            key={company.ticker}
                            className="company-card"
                            variants={itemVariants}
                            onClick={() => navigate(`/financials?ticker=${company.ticker}`)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div
                                className="card-logo-wrapper"
                                style={['UNH', 'ABBV'].includes(company.ticker) ? { background: 'black' } : {}}
                            >
                                <img
                                    src={`https://financialmodelingprep.com/image-stock/${company.ticker}.png`}
                                    alt={`${company.name} logo`}
                                    className="card-logo"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                            <span className="card-name">{company.name}</span>
                            <span className="card-ticker">{company.ticker}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

export default HomePage;
