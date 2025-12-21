import { use, useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import './FinancialsPage.css'
export function FinancialsPage() {
    const URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

    const [statements, setStatements] = useState({});
    const [currDisplay, setCurrDisplay] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const [companyInfo, setCompanyInfo] = useState({});
    const ticker = searchParams.get("ticker");

    useEffect(() => {
        if (ticker) {
            setCurrDisplay(false);
            getStatements(ticker);
            getCompanyInfo(ticker);
        } else {
            setStatements([]);
            setCurrDisplay(false);
        }
    }, [ticker]);

    async function getCompanyInfo(tickerSymbol) {
        try {
            const result = await fetch(`${URL}/info?ticker=${tickerSymbol}`);
            const data = await result.json();
            setCompanyInfo(data);
        } catch (e) {
            const data = {
                "name": "",
                "image": "",
            };
            setCompanyInfo(data);
        }

    }

    async function getStatements(tickerSymbol) {
        if (!tickerSymbol) return;

        try {
            const result = await fetch(`${URL}/financials?ticker=${tickerSymbol}`);
            if (!result.ok) throw new Error("Network response was not ok");
            const data = await result.json();
            setStatements(data);
            setCurrDisplay(true);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            setStatements([]);
            setCurrDisplay(false);
        }
    }

    function formatHTML(htmlString) {
        return (
            <div dangerouslySetInnerHTML={{ __html: htmlString }} />
        );
    }

    return (
        <>
            <div className="page-container">

                {!ticker && <div style={{ color: 'white' }}>Enter a ticker to view financials.</div>}

                {ticker && !currDisplay && <div style={{ color: 'white' }}>Loading data for {ticker}...</div>}

                <div className="reports-container">
                    <div className="info-container">
                        {(companyInfo["image"] != "") &&
                            <div>
                                {ticker && currDisplay && <img className="company-logo" src={companyInfo["image"]} />}
                            </div>
                        }

                        {(companyInfo["name"] != "") && <div className="company-name">
                            {ticker && currDisplay && <h1>{companyInfo["name"]} Inc.</h1>}
                        </div>}

                        <h4 className="company-ticker">
                            ({ticker})
                        </h4>
                    </div>

                    {currDisplay && (
                        <>
                            {currDisplay &&
                                <>
                                    <h2 className="statement-header">
                                        Income Statement
                                    </h2>

                                    <div className="report-container">
                                        {formatHTML(statements["incomeStatement"])}
                                    </div>

                                    <h2 className="statement-header">
                                        Balance Sheet
                                    </h2>

                                    <div className="report-container">
                                        {formatHTML(statements["balanceSheet"])}
                                    </div>

                                    <h2 className="statement-header">
                                        Statement of Cash Flows
                                    </h2>

                                    <div className="report-container">
                                        {formatHTML(statements["cashFlowStatement"])}
                                    </div>
                                </>
                            }
                        </>
                    )}

                    {currDisplay && statements.length === 0 && ticker && (
                        <div style={{ color: 'white' }}>No results found for {ticker}.</div>
                    )}

                </div>

            </div >
        </>
    );
}

export default FinancialsPage;
