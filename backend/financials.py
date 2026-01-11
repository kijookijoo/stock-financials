from fastapi import APIRouter
from sec_downloader import Downloader
from sec_downloader.types import RequestedFilings
from bs4 import BeautifulSoup
import httpx
import os
import anyio
import asyncio

router = APIRouter()
dl = Downloader("Developer", "kjyoon0125@gmail.com")

HEADERS = {
    "User-Agent": "UBC Computer Science Student Personal Project kjyoon0125@gmail.com",
    "Accept-Encoding": "gzip, deflate",
    "Host": "www.sec.gov"
}

def get_statement_priority(short_name):
    """
    Returns (statement_type, score) based on the report's short name.
    Higher score means higher priority.
    """
    name = short_name.lower()
    
    # Keywords that usually indicate we should SKIP this report
    exclude_keywords = [
        "(parenthetical)", 
        "parenthetical",
        "detailed", 
        "details", 
        "disclosure", 
        "note", 
        "accounting policies",
        "schedule",
        "tables"
    ]
    if any(word in name for word in exclude_keywords):
        return None, 0

    doc_type = None
    score = 0
    
    # INCOME STATEMENT detection
    if any(term in name for term in ["income statement", "operations", "comprehensive loss", "comprehensive income", "statement of earnings"]):
        doc_type = "incomeStatement"
        score = 10
        # "Consolidated" is a strong indicator of the primary statement
        if "consolidated" in name:
            score += 5
        # "Condensed" is expected in 10-Qs but slightly less priority than a full consolidated if both exist
        if "condensed" in name:
            score -= 1
            
    # BALANCE SHEET detection
    elif any(term in name for term in ["balance sheet", "financial position"]):
        doc_type = "balanceSheet"
        score = 10
        if "consolidated" in name:
            score += 5
            
    # CASH FLOW detection
    elif "cash flow" in name:
        doc_type = "cashFlowStatement"
        score = 10
        if "consolidated" in name:
            score += 5

    return doc_type, score

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

def formatHTML_sync(htmlString): 
    html_start = htmlString.find("<html")
    if html_start == -1:
        html_start = 0
    clean_html = htmlString[html_start:]
    soup = BeautifulSoup(clean_html, 'html.parser')
    
    for text_node in soup.find_all(text=True):
        if 'v3.' in text_node or 'v2.' in text_node:
            if text_node.parent:
                text_node.parent.decompose()

    for tag in soup.find_all("a"):
        tag.unwrap()
        
    for table in soup.find_all("table"):
        text_content = table.get_text().lower()
        if any(term in text_content for term in ["namespace prefix", "data type", "balance type"]):
            table.decompose()
            continue

        rows = table.find_all("tr")
        for row in rows:
            cells = row.find_all(["td", "th"])
            row_text = row.get_text().strip().lower()
            if "statement" in row_text and len(row_text) < 100:
                row.decompose()
                continue

            current_row_vals = {}
            for i, cell in enumerate(cells):
                val = parse_sec_number(cell.get_text(strip=True))
                if val is not None:
                    current_row_vals[i] = (val, cell)

            data_indices = sorted(current_row_vals.keys())
            for idx_pos in [0, 2]:
                if idx_pos + 1 < len(data_indices):
                    i = data_indices[idx_pos]
                    next_i = data_indices[idx_pos + 1]
                    curr_val, curr_cell = current_row_vals[i]
                    prev_val, _ = current_row_vals[next_i]
                    if prev_val != 0:
                        change = ((curr_val - prev_val) / abs(prev_val)) * 100
                        if abs(change) < 10000:
                            badge = soup.new_tag("span", attrs={"class": f"growth-badge {('pos' if change >= 0 else 'neg')}"})
                            icon = "▲" if change >= 0 else "▼"
                            badge.string = f"{icon} {abs(change):.1f}%"
                            curr_cell.append(badge)

    allowed_attrs = ['rowspan', 'colspan', 'class']
    for tag in soup.find_all(True):
        tag.attrs = {key: value for key, value in tag.attrs.items() if key in allowed_attrs}
        
    for empty_tag in soup.find_all(['tr', 'div']):
        if not empty_tag.get_text(strip=True) and not empty_tag.contents:
            empty_tag.decompose()

    return str(soup)

async def formatHTML(htmlString):
    return await anyio.to_thread.run_sync(formatHTML_sync, htmlString)

async def fetch_statement(client, url, docType):
    try:
        res = await client.get(url)
        res.raise_for_status()
        formatted = await formatHTML(res.text)
        return docType, formatted
    except Exception as e:
        print(f"Error fetching statement from {url}: {e}")
        return docType, ""

@router.get("/financials")
async def read_financials(ticker : str):
    financial_statements = {
        "balanceSheet" : "",
        "incomeStatement" : "",
        "cashFlowStatement" : ""
    }
    try:
        # SEC downloader is synchronous, run in thread
        metadatas = await anyio.to_thread.run_sync(
            dl.get_filing_metadatas,
            RequestedFilings(ticker_or_cik=ticker, form_type="10-Q", limit = 1)
        )
        if not metadatas:
            return financial_statements
        
        metadata = metadatas[0]
        base_url = metadata.primary_doc_url.rsplit("/", 1)[0] + "/"
        summary_url = base_url + "FilingSummary.xml"
        
        async with httpx.AsyncClient(headers=HEADERS, timeout=30.0) as client:
            summary_res = await client.get(summary_url)
            summary_res.raise_for_status()
            soup_xml = BeautifulSoup(summary_res.text, "xml")
            reports = soup_xml.find_all("Report")
            
            # 1. Identify best candidates for each statement type
            best_candidates = {
                "balanceSheet": {"url": None, "score": -1},
                "incomeStatement": {"url": None, "score": -1},
                "cashFlowStatement": {"url": None, "score": -1}
            }
            
            for report in reports:
                short_name_tag = report.find("ShortName")
                if not short_name_tag: 
                    continue
                
                docType, score = get_statement_priority(short_name_tag.text)
                if docType and score > best_candidates[docType]["score"]:
                    html_file = report.find("HtmlFileName")
                    if html_file:
                        best_candidates[docType]["url"] = base_url + html_file.text
                        best_candidates[docType]["score"] = score
            
            # 2. Fetch the best candidates concurrently
            tasks = []
            for docType, info in best_candidates.items():
                if info["url"]:
                    tasks.append(fetch_statement(client, info["url"], docType))
            
            if tasks:
                results = await asyncio.gather(*tasks)
                for docType, content in results:
                    if content:
                        financial_statements[docType] = content
                        
        return financial_statements
    except Exception as e:
        print(f"Global error fetching financials for {ticker}: {e}")
        return financial_statements