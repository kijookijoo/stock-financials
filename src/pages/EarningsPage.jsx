import React, { useEffect, useState } from 'react';
import { startOfWeek, endOfWeek, addDays, format, isWeekend, addWeeks } from 'date-fns';
import './EarningsPage.css';

export function EarningsPage() {
    const [earnings, setEarnings] = useState({});
    const [weekStart, setWeekStart] = useState(new Date());
    const [loading, setLoading] = useState(true);
    let API_TOKEN = import.meta.env.API_TOKEN;

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
            // Check cache
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const parsedCache = JSON.parse(cached);
                if (parsedCache.date === todayStr && parsedCache.weekStart === weekStartStr) {
                    console.log("Using cached earnings data");
                    processEarningsData(parsedCache.data, startDate);
                    setLoading(false);
                    return;
                }
            }

            const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
            const friday = addDays(startDate, 4);

            const fromDate = format(startDate, 'yyyy-MM-dd');
            const toDate = format(friday, 'yyyy-MM-dd');

            const response = await fetch(`https://finnhub.io/api/v1/calendar/earnings?from=${fromDate}&to=${toDate}&token=${API_TOKEN}`);
            const data = await response.json();
            console.log("Fetched Earnings Data:", data);

            if (data && Array.isArray(data.earningsCalendar)) {
                localStorage.setItem(cacheKey, JSON.stringify({
                    date: todayStr,
                    weekStart: weekStartStr,
                    data: data.earningsCalendar
                }));
                processEarningsData(data.earningsCalendar, startDate);
            } else {
                console.error("Invalid data format", data);
                processEarningsData([], startDate);
            }
        } catch (error) {
            console.error("Failed to fetch earnings", error);
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

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    return (
        <div className="earnings-container">
            <header className="earnings-header">
                <h1>Most Anticipated Earnings Releases</h1>
                <h2>for the week beginning {format(weekStart, 'MMMM dd, yyyy')}</h2>
            </header>

            <div className="calendar-grid">
                {days.map((dayName, index) => {
                    const dateStr = format(addDays(weekStart, index), 'yyyy-MM-dd');
                    const dayData = earnings[dateStr] || { bmo: [], amc: [] };

                    return (
                        <div key={dayName} className="day-column">
                            <div className="day-header">{dayName}</div>
                            <div className="day-content">
                                {/* Before Open Column */}
                                <div className="session-column">
                                    <div className="session-header">Before Open</div>
                                    {dayData.bmo.map((company, i) => (
                                        <CompanyCard key={`${company.symbol}-${i}`} company={company} />
                                    ))}
                                </div>
                                {/* After Close Column */}
                                <div className="session-column">
                                    <div className="session-header">After Close</div>
                                    {dayData.amc.map((company, i) => (
                                        <CompanyCard key={`${company.symbol}-${i}`} company={company} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CompanyCard({ company }) {
    const logoUrl = `https://financialmodelingprep.com/image-stock/${company.symbol}.png`;

    return (
        <div className="company-card" title={`${company.symbol} - EPS Est: ${company.epsEstimate}`}>
            <img
                src={logoUrl}
                alt={company.symbol}
                className="company-logo"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            <div className="company-logo-placeholder" style={{ display: 'none' }}>
                {company.symbol[0]}
            </div>
            <div className="company-symbol">{company.symbol}</div>
        </div>
    );
}

export default EarningsPage;
