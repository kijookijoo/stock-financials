import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startOfWeek, endOfWeek, addDays, format, isWeekend, addWeeks } from 'date-fns';
import { ClipLoader } from "react-spinners";
import { motion, AnimatePresence } from "motion/react";
import './EarningsPage.css';

export function EarningsPage() {
    const [earnings, setEarnings] = useState({});
    const [weekStart, setWeekStart] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const API_TOKEN = import.meta.env.VITE_API_TOKEN;

    useEffect(() => {
        const today = new Date();
        const start = isWeekend(today)
            ? startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 })
            : startOfWeek(today, { weekStartsOn: 1 });

        setWeekStart(start);
        fetchEarnings(start);
    }, []);

    const fetchEarnings = async (startDate) => {
        setLoading(true);
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const weekStartStr = format(startDate, 'yyyy-MM-dd');
        const cacheKey = 'finnhub_earnings_cache';

        try {
            const cached = localStorage.getItem(cacheKey);
            let earningsData = [];

            if (cached) {
                const parsedCache = JSON.parse(cached);
                if (parsedCache.date === todayStr && parsedCache.weekStart === weekStartStr) {
                    earningsData = parsedCache.data;
                }
            }

            if (earningsData.length === 0) {
                const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
                const friday = addDays(startDate, 4);
                const fromDate = format(startDate, 'yyyy-MM-dd');
                const toDate = format(friday, 'yyyy-MM-dd');
                // gtgy1230
                const response = await fetch(`https://finnhub.io/api/v1/calendar/earnings?from=${fromDate}&to=${toDate}&token=${API_TOKEN}`);
                const data = await response.json();

                if (data && Array.isArray(data.earningsCalendar)) {
                    earningsData = data.earningsCalendar;
                    localStorage.setItem(cacheKey, JSON.stringify({
                        date: todayStr,
                        weekStart: weekStartStr,
                        data: earningsData
                    }));
                }
            }

            processEarningsData(earningsData, startDate);

            const topSymbols = earningsData
                .sort((a, b) => (b.revenueEstimate || 0) - (a.revenueEstimate || 0))
                .slice(0, 15) 
                .map(item => `https://financialmodelingprep.com/image-stock/${item.symbol}.png`);

            await Promise.allSettled(topSymbols.map(src => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = src;
                    img.onload = resolve;
                    img.onerror = resolve; 
                    setTimeout(resolve, 2000); 
                });
            }));

        } catch (error) {
            console.error("Error fetching earnings:", error);
            processEarningsData([], startDate);
        } finally {
            setLoading(false);
        }
    };

    const processEarningsData = (data, startDate) => {
        const grouped = {};

        for (let i = 0; i < 5; i++) {
            const dateStr = format(addDays(startDate, i), 'yyyy-MM-dd');
            grouped[dateStr] = { bmo: [], amc: [] };
        }

        data.forEach(item => {
            const date = item.date;
            const time = item.hour;

            if (grouped[date]) {
                if (time === 'bmo') {
                    grouped[date].bmo.push(item);
                } else if (time === 'amc') {
                    grouped[date].amc.push(item);
                } else {
                    grouped[date].bmo.push(item);
                }
            }
        });

        Object.keys(grouped).forEach(date => {
            ['bmo', 'amc'].forEach(session => {
                grouped[date][session].sort((a, b) => (b.revenueEstimate || 0) - (a.revenueEstimate || 0));
                grouped[date][session] = grouped[date][session].slice(0, 5);
            });
        });

        setEarnings(grouped);
    };

    const handlePrevWeek = () => {
        const newDate = addWeeks(weekStart, -1);
        setWeekStart(newDate);
        fetchEarnings(newDate);
    };

    const handleNextWeek = () => {
        const newDate = addWeeks(weekStart, 1);
        setWeekStart(newDate);
        fetchEarnings(newDate);
    };

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

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
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    return (
        <div className="earnings-container">
            <header className="earnings-header">
                <h1>Most Anticipated Earnings Releases</h1>
                <div className="week-navigation">
                    <button onClick={handlePrevWeek} className="nav-arrow">&lt;</button>
                    <h2>for the week beginning {format(weekStart, 'MMMM dd, yyyy')}</h2>
                    <button onClick={handleNextWeek} className="nav-arrow">&gt;</button>
                </div>
            </header>

            {loading ? (
                <div className="loading-spinner-container">
                    <ClipLoader color={"#c5ac6b"} size={50} />
                </div>
            ) : (
                <motion.div
                    className="calendar-grid"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                >
                    {days.map((dayName, index) => {
                        const dateStr = format(addDays(weekStart, index), 'yyyy-MM-dd');
                        const dayData = earnings[dateStr] || { bmo: [], amc: [] };

                        return (
                            <motion.div key={dayName} className="day-column" variants={itemVariants}>
                                <div className="day-header">{dayName}</div>
                                <div className="day-content">
                                    <div className="session-column">
                                        <div className="session-header">Before Open</div>
                                        {dayData.bmo.map((company, i) => (
                                            <CompanyCard key={`${company.symbol}-${i}`} company={company} />
                                        ))}
                                    </div>
                                    <div className="session-column">
                                        <div className="session-header">After Close</div>
                                        {dayData.amc.map((company, i) => (
                                            <CompanyCard key={`${company.symbol}-${i}`} company={company} />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}

function CompanyCard({ company }) {
    const navigate = useNavigate();
    const [imageError, setImageError] = useState(false);
    const logoUrl = `https://financialmodelingprep.com/image-stock/${company.symbol}.png`;

    if (imageError) return null;

    return (
        <div
            className="company-card"
            title={`${company.symbol} - EPS Est: ${company.epsEstimate}`}
            onClick={() => navigate(`/financials?ticker=${company.symbol}`)}
        >
            <img
                src={logoUrl}
                alt={company.symbol}
                className="company-logo-earnings"
                onError={() => setImageError(true)}
            />
            <div className="company-info-block">
                <div className="company-name">{company.symbol}</div>
            </div>
        </div>
    );
}

export default EarningsPage;
