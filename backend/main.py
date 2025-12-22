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

def parse_sec_number(text):
    if not text: return None
    clean = text.replace('$', '').replace(',', '').replace('%', '').strip()
    if not clean: return None
    is_negative = False
    if clean.startswith('(') and clean.endswith(')'):
        is_negative = True
        clean = clean[1:-1]
    try:
        val = float(clean)
        return -val if is_negative else val
    except ValueError:
        return None

def formatHTML(htmlString): 
    html_start = htmlString.find("<html")
    if html_start == -1:
        html_start = 0
    clean_html = htmlString[html_start:]
    soup = BeautifulSoup(clean_html, 'html.parser')
    
    for text_node in soup.find_all(text=True):
        if 'v3.' in text_node or 'v2.' in text_node:
            text_node.parent.decompose()

    for tag in soup.find_all("a"):
        tag.unwrap()
        
    for table in soup.find_all("table"):
        text_content = table.get_text().lower()
        if any(term in text_content for term in ["namespace prefix", "data type", "balance type"]):
            table.decompose()
            continue

        rows = table.find_all("tr")
        prev_row_vals = {} 
        
        for row in rows:
            cells = row.find_all(["td", "th"])
            current_row_vals = {}
            
            for i, cell in enumerate(cells):
                val = parse_sec_number(cell.get_text(strip=True))
                if val is not None:
                    current_row_vals[i] = (val, cell)
                    
                    if i > 0 and (i-1) in current_row_vals:
                        prev_val, _ = current_row_vals[i-1]
                        pass

            for i in current_row_vals:
                curr_val, curr_cell = current_row_vals[i]
                found_prev = False
                
                if i+1 in current_row_vals:
                    prev_val, _ = current_row_vals[i+1]
                    found_prev = True
                elif i+1 in prev_row_vals:
                    prev_val, _ = prev_row_vals[i+1]
                    found_prev = True
                
                if found_prev and prev_val != 0:
                    change = ((curr_val - prev_val) / abs(prev_val)) * 100
                    if abs(change) < 10000:
                        badge = soup.new_tag("span", attrs={
                            "class": f"growth-badge {('pos' if change >= 0 else 'neg')}"
                        })
                        icon = "▲" if change >= 0 else "▼"
                        badge.string = f"{icon} {abs(change):.1f}%"
                        curr_cell.append(badge)

            prev_row_vals = current_row_vals

    allowed_attrs = ['rowspan', 'colspan', 'class']
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
