import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { ClipLoader } from "react-spinners";
import './FinancialsPage.css'
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

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
    const prefersReducedMotion = useReducedMotion();
    const [companyCase, setCompanyCase] = useState("");
    const [caseType, setCaseType] = useState("");
    const [isCaseLoading, setIsCaseLoading] = useState(false);
    const caseRequestRef = useRef(null);

    useEffect(() => {
        if (caseRequestRef.current) {
            caseRequestRef.current.abort();
            caseRequestRef.current = null;
        }

        if (ticker) {
            setCurrDisplay(false);
            setStatementDisplay(false);
            setCompanyCase("");
            setCaseType("");
            fetchData(ticker);
        } else {
            setStatements({});
            setCurrDisplay(false);
            setStatementDisplay(false);
            setCompanyCase("");
            setCaseType("");
        }
    }, [ticker]);

    useEffect(() => {
        return () => {
            if (caseRequestRef.current) {
                caseRequestRef.current.abort();
                caseRequestRef.current = null;
            }
        };
    }, []);

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

    async function askForCase(stance) {
        if (!companyInfo?.name) return;

        if (caseRequestRef.current) {
            caseRequestRef.current.abort();
        }
        const controller = new AbortController();
        caseRequestRef.current = controller;

        setIsCaseLoading(true);
        setCaseType(stance);
        setCompanyCase("");

        try {
            const response = await fetch(`${URL}/company-case`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: companyInfo.name,
                    ticker,
                    intro: companyInfo?.intro || "",
                    stance,
                }),
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const data = await response.json();
            const text = (data?.content || "").trim();
            setCompanyCase(text || "No response generated.");
        } catch (error) {
            if (error?.name === "AbortError") {
                return;
            }
            console.error("Company case request failed:", error);
            setCompanyCase("Could not generate a response right now. Please try again.");
        } finally {
            caseRequestRef.current = null;
            setIsCaseLoading(false);
        }
    }

    function getCaseItems(text) {
        return (text || "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => line.replace(/^[-*]\s*/, ""))
            .filter(Boolean);
    }

    const statementTransition = prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.22, ease: "easeOut" };
    const caseItems = getCaseItems(companyCase);

    return (
        <>
            <div className="page-container">

                {!ticker && <div className="status-message">Enter a ticker to view financials.</div>}

                {ticker && !currDisplay && <div className="status-message">Loading data for {ticker}...</div>}

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
                                <div className="intro-panel">
                                    {(companyInfo["intro"] && companyInfo["intro"] !== "") &&
                                        <p className="company-intro">
                                            {ticker && currDisplay && companyInfo["intro"]}
                                        </p>
                                    }

                                    <div className="company-case-row">
                                        <div className="company-case-label">Introduction</div>
                                        <div className="company-case-actions">
                                            <button
                                                type="button"
                                                className="company-case-btn"
                                                onClick={() => askForCase("bull")}
                                                disabled={isCaseLoading}
                                            >
                                                Bull case
                                            </button>
                                            <button
                                                type="button"
                                                className="company-case-btn"
                                                onClick={() => askForCase("bear")}
                                                disabled={isCaseLoading}
                                            >
                                                Bear case
                                            </button>
                                        </div>
                                    </div>

                                    {isCaseLoading && (
                                        <div className="company-case-output">
                                            Generating {caseType || "bull"} case...
                                        </div>
                                    )}
                                    {!isCaseLoading && companyCase && (
                                        <div className="company-case-output">
                                            <div className="company-case-title">
                                                {caseType === "bear" ? "Bear Case" : "Bull Case"}
                                            </div>
                                            <ul className="company-case-list">
                                                {caseItems.map((item, idx) => (
                                                    <li key={`${caseType}-${idx}`}>{item}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                        </div>
                    ) : <ClipLoader
                        color={"#c5ac6b"}
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
                                whileTap={{ scale: 0.95 }}
                                onClick={() => changeStatementDisplay("incomeStatement")}
                            >
                                <span className="statement-btn-title">Income Statement</span>
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
                                whileTap={{ scale: 0.95 }}
                                onClick={() => changeStatementDisplay("balanceSheet")}
                            >
                                <span className="statement-btn-title">Balance Sheet</span>

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
                                whileTap={{ scale: 0.95 }}
                                onClick={() => changeStatementDisplay("cashFlowStatement")}
                            >
                                <span className="statement-btn-title">Cash Flow</span>

                            </motion.button>}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait" initial={false}>
                        {currDisplay && statementDisplay && (
                            <motion.section
                                key={currStatement}
                                className="statement-panel"
                                initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
                                transition={statementTransition}
                            >
                            {statements?.error && (
                                <div style={{ color: '#ffb3b3', marginBottom: '12px' }}>
                                    Financials error: {statements.error}
                                </div>
                            )}
                            <div style={{ marginBottom: '16px' }}>
                                <h1 className="statement-header" style={{ margin: 0 }}>
                                    {currStatement === "incomeStatement" && "Income Statement"}
                                    {currStatement === "balanceSheet" && "Balance Sheet"}
                                    {currStatement === "cashFlowStatement" && "Statement of Cash Flows"}
                                </h1>
                            </div>

                            <div className="report-container">
                                {formatHTML(statements[currStatement]?.content || statements[currStatement] || "")}
                            </div>
                            </motion.section>
                        )}
                    </AnimatePresence>

                    {currDisplay && Object.keys(statements).length === 0 && ticker && (
                        <div className="status-message">No results found for {ticker}.</div>
                    )}

                </div>
            </div >
        </>
    );
}

export default FinancialsPage;
