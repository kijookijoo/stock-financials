from fastapi import FastAPI
from sec_downloader import Downloader
from sec_downloader.types import RequestedFilings
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import yfinance as yf

load_dotenv()

app = FastAPI()
dl = Downloader("Developer", "kjyoon0125@gmail.com")

HEADERS = {
    "User-Agent": "UBC Computer Science Student Personal Project kjyoon0125@gmail.com",
    "Accept-Encoding": "gzip, deflate",
    "Host": "www.sec.gov"
}

API_KEY = os.getenv("API_KEY")

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],    
    allow_headers=["*"],     
)

def getFinancialStatementType(fileName):
    fileName_lower = fileName.lower()
    
    # Check for Income Statement
    if any(term in fileName_lower for term in ["income statement", "operations", "comprehensive loss", "comprehensive income"]):
        return "incomeStatement"
    
    # Check for Balance Sheet
    if any(term in fileName_lower for term in ["balance sheet", "financial position"]):
        return "balanceSheet"
    
    # Check for Cash Flow
    if "cash flow" in fileName_lower:
        return "cashFlowStatement"
    
    return None

def formatHTML(htmlString): 
    html_start = htmlString.find("<html")
    if html_start == -1:
        html_start = 0
    clean_html = htmlString[html_start:]
    soup = BeautifulSoup(clean_html, 'html.parser')
    
    for tag in soup.find_all("a"):
        tag.unwrap()
        
    for table in soup.find_all("table"):
        text = table.get_text().lower()
        if any(term in text for term in ["namespace prefix", "data type", "balance type", "period type"]):
            table.decompose()

    for tag in soup.find_all(True):
        tag.attrs = {key: value for key, value in tag.attrs.items() 
                     if key in ['rowspan', 'colspan']}
        
    for empty_tag in soup.find_all(['tr', 'td', 'div']):
        if not empty_tag.get_text(strip=True) and not empty_tag.contents:
            empty_tag.decompose()

    return str(soup)
    
def exportasHTML(fileURL, short_name):
    res = requests.get(fileURL, headers = HEADERS)
    res.raise_for_status()
    
    return {
        "name": short_name,
        "content": res.text
    }

def parseandFind(base_url):
    index_html = requests.get(base_url, headers = HEADERS).text
    soup = BeautifulSoup(index_html, "html.parser")
    
    summary_url = base_url + "FilingSummary.xml"
    summary_xml = requests.get(summary_url, headers=HEADERS).text
    soup_xml = BeautifulSoup(summary_xml, "xml")
    return soup_xml.find_all("Report")

@app.get("/financials")
def read_financials(ticker : str):
    financial_statements = {
        "balanceSheet" : "",
        "incomeStatement" : "",
        "cashFlowStatement" : ""
    }
    
    try:
        metadatas = dl.get_filing_metadatas(
                RequestedFilings(ticker_or_cik=ticker, form_type="10-Q", limit = 1)
            )

        if not metadatas:
            return financial_statements

        metadata = metadatas[0]
        base_url = metadata.primary_doc_url.rsplit("/", 1)[0] + "/"
        
        reports = parseandFind(base_url)

        for report in reports:
            short_name_tag = report.find("ShortName")
            if not short_name_tag:
                continue
            short_name = short_name_tag.text
            
            docType = getFinancialStatementType(short_name)
            if docType is None:
                continue

            html_file = report.find("HtmlFileName")
            if html_file is None:
                continue
            
            html_file = html_file.text
            file_url = base_url + html_file

            try:
                statement_data = exportasHTML(file_url, short_name)
                if financial_statements[docType] == "":
                    financial_statements[docType] = formatHTML(statement_data["content"])
            except Exception as e:
                print(f"Error fetching {short_name}: {e}")
                continue      

        return financial_statements
    except Exception as e:
        print(f"Global error fetching financials for {ticker}: {e}")
        return financial_statements

@app.get("/info")
def get_company_info(ticker: str):
    try:
        company = yf.Ticker(ticker)
        name = company.info.get("longName") or company.info.get("shortName") or ticker.upper()
    except Exception as e:
        print(f"Error fetching yfinance info: {e}")
        name = ticker.upper()
        
    logo_url = f"https://financialmodelingprep.com/image-stock/{ticker.upper()}.png"
    return {
        "name": name, 
        "image": logo_url
    }
