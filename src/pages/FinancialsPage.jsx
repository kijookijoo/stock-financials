import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import './FinancialsPage.css'
import { motion, AnimatePresence } from "motion/react";

export function FinancialsPage() {
    let URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8004"; if (URL.endsWith('/')) {
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

        try {
            const [infoResult, introResult, financialsResult] = await Promise.all([
                fetch(`${URL}/info?ticker=${tickerSymbol}`).then(res => res.json()),
                fetch(`${URL}/intro?ticker=${tickerSymbol}`).then(res => res.text()),
                fetch(`${URL}/financials?ticker=${tickerSymbol}`).then(res => res.json())
            ]);

            const companyData = { ...infoResult, intro: introResult.replace(/^"|"$/g, '') };

            if (companyData.image) {
                await new Promise((resolve) => {
                    const img = new Image();
                    img.src = companyData.image;
                    img.onload = resolve;
                });
            }

            setCompanyInfo(companyData);
            setStatements(financialsResult);
            setCurrDisplay(true);

        } catch (error) {
            console.error("Error fetching data:", error);
            setStatements({});
            setCompanyInfo({});
            setCurrDisplay(false);
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
                    <div className="info-container">
                        {(companyInfo["image"] && companyInfo["image"] !== "") &&
                            <div className="logo-wrapper">
                                {ticker && currDisplay && <img className="company-logo" src={companyInfo["image"]} />}
                            </div>
                        }

                        {(companyInfo["name"] && companyInfo["name"] !== "") && <div className="company-name">
                            {ticker && currDisplay && <h1>{companyInfo["name"]}</h1>}
                        </div>}

                        <h4 className="company-ticker">
                            {ticker && currDisplay && ("(" + ticker + ")")}
                        </h4>

                        {(companyInfo["intro"] && companyInfo["intro"] !== "") &&
                            <p className="company-intro">
                                {ticker && currDisplay && companyInfo["intro"]}
                            </p>
                        }
                    </div>

                    <div className="summary-container">
                        <AnimatePresence>
                            <motion.button className="income-statement"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => changeStatementDisplay("incomeStatement")}
                            >
                                <motion.img className="incomestatement-image" src='./images/incomestatement.png' />
                            </motion.button>
                        </AnimatePresence>

                        <AnimatePresence>
                            <motion.button className="balance-sheet"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => changeStatementDisplay("balanceSheet")}
                            >
                                <motion.img className="incomestatement-image" src='./images/balancesheet.png' />

                            </motion.button>
                        </AnimatePresence>

                        <AnimatePresence>
                            <motion.button className="statement-cashflow"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => changeStatementDisplay("cashFlowStatement")}
                            >
                                <motion.img className="incomestatement-image" src='./images/cashflowstatement.png' />

                            </motion.button>
                        </AnimatePresence>
                    </div>

                    {currDisplay && statementDisplay && (
                        <>
                            <h1 className="statement-header">
                                {currStatement === "incomeStatement" && "Income Statement"}
                                {currStatement === "balanceSheet" && "Balance Sheet"}
                                {currStatement === "cashFlowStatement" && "Statement of Cash Flows"}
                            </h1>

                            <div className="report-container">
                                {formatHTML(statements[currStatement])}
                            </div>
                        </>
                    )}

                    {currDisplay && Object.keys(statements).length === 0 && ticker && (
                        <div style={{ color: 'white' }}>No results found for {ticker}.</div>
                    )}

                </div>
                2            </div >
        </>
    );
}

export default FinancialsPage;
