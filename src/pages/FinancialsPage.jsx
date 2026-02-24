import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { ClipLoader } from "react-spinners";
import './FinancialsPage.css'
import { motion, AnimatePresence } from "motion/react";

export function FinancialsPage() {
    let URL = import.meta.env.VITE_API_URL; if (URL.endsWith('/')) {
        URL = URL.slice(0, -1);
    }

    const [statements, setStatements] = useState({});
    const [currDisplay, setCurrDisplay] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [companyInfo, setCompanyInfo] = useState({});
    const ticker = searchParams.get("ticker");
    const [currStatement, setCurrStatement] = useState("");
    const [statementDisplay, setStatementDisplay] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (ticker) {
            setCurrDisplay(false);
            setStatementDisplay(false);
            fetchData(ticker);
        } else {
            setStatements({});
            setCurrDisplay(false);
            setStatementDisplay(false);
        }
    }, [ticker]);

    async function fetchData(tickerSymbol) {
        if (!tickerSymbol) return;
        setIsLoading(true);
        setCurrDisplay(false);

        try {
            const [infoResult, financialsResult] = await Promise.all([
                fetch(`${URL}/info?ticker=${tickerSymbol}`).then(res => res.json()),
                fetch(`${URL}/financials?ticker=${tickerSymbol}`).then(res => res.json()).catch(() => ({}))
            ]);

            let introText = "";
            try {
                const introResponse = await fetch(`${URL}/intro?name=${infoResult.name}`);
                if (introResponse.ok) {
                    introText = await introResponse.text();
                    introText = introText.replace(/^"|"$/g, '');
                }
            } catch (e) {
                console.warn("Intro fetch failed", e);
            }


            const companyData = {
                name: infoResult.name,
                image: infoResult.image,
                intro: introText,
                ...infoResult
            };

            if (companyData.image) {
                try {
                    await Promise.race([
                        new Promise((resolve, reject) => {
                            const img = new Image();
                            img.src = companyData.image;
                            img.onload = resolve;
                            img.onerror = reject;
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
                    ]);
                } catch (e) { }
            }

            setCompanyInfo(companyData);

            setStatements(financialsResult);
            setCurrDisplay(true);

        } catch (error) {
            console.error("Critical error in fetchData:", error);
            setCompanyInfo({ name: tickerSymbol });
            setStatements({});
            setCurrDisplay(true);
        } finally {
            setIsLoading(false);
        }
    }

    function formatHTML(htmlString) {
        return (
            <div dangerouslySetInnerHTML={{ __html: htmlString }} />
        );
    }

    function changeStatementDisplay(item) {
        setCurrStatement(item);
        setStatementDisplay(true);
    }

    return (
        <>
            <div className="page-container">

                {!ticker && <div style={{ color: 'white' }}>Enter a ticker to view financials.</div>}

                {ticker && !currDisplay && <div style={{ color: 'white' }}>Loading data for {ticker}...</div>}

                <div className="reports-container">
                    {currDisplay ? (
                        <div className="info-container">
                            <div className="profile-container">
                                {(companyInfo["image"] && companyInfo["image"] !== "") &&
                                    <motion.div
                                        className="logo-wrapper"
                                        initial={{
                                            x: "calc(50vw - 50%)",
                                            y: 0,
                                            scale: 1.2,
                                            opacity: 0
                                        }}
                                        animate={{
                                            x: 0,
                                            y: 0,
                                            scale: 1,
                                            opacity: 1
                                        }}
                                        transition={{
                                            duration: 0.7,
                                            ease: "easeOut"
                                        }}
                                    >
                                        {ticker && currDisplay && <img className="company-logo" src={companyInfo["image"]} />}
                                    </motion.div>
                                }

                                {(companyInfo["name"] && companyInfo["name"] !== "") &&
                                    <motion.div
                                        className="company-name"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: 0.3,
                                            duration: 0.7,
                                            ease: "easeOut"
                                        }}
                                    >
                                        {ticker && currDisplay && <h1>{companyInfo["name"]}</h1>}
                                    </motion.div>
                                }

                                <motion.h4
                                    className="company-ticker"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: 0.4,
                                        duration: 0.7,
                                        ease: "easeOut"
                                    }}
                                >
                                    {ticker && currDisplay && ("(" + ticker + ")")}
                                </motion.h4>
                            </div>

                            <motion.div
                                className="intro-container"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: 0.4,
                                    duration: 0.4,
                                    ease: "easeOut"
                                }}
                            >
                                {(companyInfo["intro"] && companyInfo["intro"] !== "") &&
                                    <p className="company-intro">
                                        {ticker && currDisplay && companyInfo["intro"]}
                                    </p>
                                }
                            </motion.div>

                        </div>
                    ) : <ClipLoader
                        color={"#ffffffff"}
                        size={50}
                        aria-label="Loading Spinner"
                    />}




                    <div className="summary-container">
                        <AnimatePresence>
                            {currDisplay && <motion.button
                                className="income-statement"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    ease: "easeOut"
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => changeStatementDisplay("incomeStatement")}
                            >
                                <motion.img className="incomestatement-image" src='./images/incomestatement.png' />
                            </motion.button>}
                        </AnimatePresence>

                        <AnimatePresence>
                            {currDisplay && <motion.button
                                className="balance-sheet"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    ease: "easeOut"
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => changeStatementDisplay("balanceSheet")}
                            >
                                <motion.img className="incomestatement-image" src='./images/balancesheet.png' />

                            </motion.button>}
                        </AnimatePresence>

                        <AnimatePresence>
                            {currDisplay && <motion.button
                                className="statement-cashflow"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    ease: "easeOut"
                                }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => changeStatementDisplay("cashFlowStatement")}
                            >
                                <motion.img className="incomestatement-image" src='./images/cashflowstatement.png' />

                            </motion.button>}
                        </AnimatePresence>
                    </div>

                    {currDisplay && statementDisplay && (
                        <>
                            {statements?.error && (
                                <div style={{ color: '#ffb3b3', marginBottom: '12px' }}>
                                    Financials error: {statements.error}
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <h1 className="statement-header" style={{ margin: 0 }}>
                                    {currStatement === "incomeStatement" && "Income Statement"}
                                    {currStatement === "balanceSheet" && "Balance Sheet"}
                                    {currStatement === "cashFlowStatement" && "Statement of Cash Flows"}
                                </h1>
                                {statements[currStatement]?.confidence && (
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            backgroundColor:
                                                statements[currStatement].confidence === 'high' ? '#10b981' :
                                                    statements[currStatement].confidence === 'medium' ? '#f59e0b' :
                                                        statements[currStatement].confidence === 'low' ? '#ef4444' : '#6b7280',
                                            color: 'white'
                                        }}
                                    >
                                        {statements[currStatement].confidence.toUpperCase()} CONFIDENCE
                                    </span>
                                )}
                            </div>

                            <div className="report-container">
                                {formatHTML(statements[currStatement]?.content || statements[currStatement] || "")}
                            </div>
                        </>
                    )}

                    {currDisplay && Object.keys(statements).length === 0 && ticker && (
                        <div style={{ color: 'white' }}>No results found for {ticker}.</div>
                    )}

                </div>
            </div >
        </>
    );
}

export default FinancialsPage;
