from fastapi import APIRouter
from sec_downloader import Downloader
from sec_downloader.types import RequestedFilings
from bs4 import BeautifulSoup
import httpx
import os
import anyio
import asyncio
import re
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass

router = APIRouter()
dl = Downloader("Developer", "kjyoon0125@gmail.com")

HEADERS = {
    "User-Agent": "UBC Computer Science Student Personal Project kjyoon0125@gmail.com",
    "Accept-Encoding": "gzip, deflate",
    "Host": "www.sec.gov"
}

@dataclass
class StatementCandidate:
    """Represents a candidate financial statement with ranking metadata"""
    report_type: str  # incomeStatement, balanceSheet, cashFlowStatement
    url: str
    short_name: str
    long_name: str
    menu_category: str
    score: int
    source: str 
    
    def __lt__(self, other):
        return self.score > other.score  

def rank_statement_candidate(short_name: str, long_name: str, menu_category: str) -> int:
    """
    Ranks a candidate based on heuristics.
    Higher score = better candidate.
    """
    combined_text = f"{short_name} {long_name} {menu_category}".lower()
    score = 0
    
    # Positive indicators
    if "consolidated" in combined_text:
        score += 3
    if "statement of" in combined_text:
        score += 3
    if re.search(r'\bprimary\b', combined_text):
        score += 2
    
    # Negative indicators
    if "parenthetical" in combined_text:
        score -= 2
    if "supplemental" in combined_text:
        score -= 3
    if "schedule" in combined_text:
        score -= 3
    if "detail" in combined_text and "details" not in combined_text:
        score -= 1
    if "details" in combined_text:
        score -= 2
    if "note" in combined_text:
        score -= 2
    if "disclosure" in combined_text:
        score -= 2
    if "condensed" in combined_text:
        score -= 1
    
    return score

def classify_statement_type(short_name: str, long_name: str, menu_category: str) -> Optional[str]:
    combined_text = f"{short_name} {long_name} {menu_category}".lower()
    
    skip_terms = ["document and entity information", "cover page", "table of contents"]
    if any(term in combined_text for term in skip_terms):
        return None
    
    income_indicators = [
        "income statement", 
        "operations", 
        "statement of earnings",
        "comprehensive income",
        "profit and loss",
        "statements of operations"
    ]
    if any(indicator in combined_text for indicator in income_indicators):
        return "incomeStatement"
    
    balance_indicators = [
        "balance sheet",
        "financial position",
        "statement of financial position"
    ]
    if any(indicator in combined_text for indicator in balance_indicators):
        return "balanceSheet"
    
    cash_flow_indicators = [
        "cash flow",
        "statement of cash flows"
    ]
    if any(indicator in combined_text for indicator in cash_flow_indicators):
        return "cashFlowStatement"
    
    return None

def parse_sec_number(text: str) -> Optional[float]:
    """
    Robust numeric extraction supporting:
    - Em dashes (—, –)
    - Non-ASCII minus signs
    - Parentheses for negatives
    - Footnote markers (*, (1), etc.)
    """
    if not text:
        return None
    
    clean = text.replace('$', '').replace(',', '').replace('%', '').strip()
    clean = clean.replace('—', '-').replace('–', '-').replace('−', '-')
    clean = re.sub(r'\*+', '', clean)
    clean = re.sub(r'\([0-9]+\)', '', clean).strip()
    
    if not clean or clean == '-':
        return None
    
    is_negative = False
    
    if clean.startswith('(') and clean.endswith(')'):
        is_negative = True
        clean = clean[1:-1].strip()
    
    try:
        val = float(clean)
        return -val if is_negative else val
    except ValueError:
        return None

def extract_inline_xbrl_value(cell) -> Optional[str]:
    ix_elements = cell.find_all(['ix:nonfraction', 'ix:nonnumeric'])
    if ix_elements:
        return ix_elements[0].get_text(strip=True)
    
    return None

def formatHTML_sync(htmlString: str) -> str:
    """
    Safely format HTML preserving financial data with awareness of inline XBRL.
    """
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
        rows_to_remove = []
        
        for i, row in enumerate(rows):
            if i < 2:
                continue
            
            if row.find_all("th"):
                continue
            
            cells = row.find_all(["td", "th"])
            row_text = row.get_text().strip().lower()
            
            has_numeric_data = any(parse_sec_number(cell.get_text(strip=True)) is not None for cell in cells)
            
            if "statement" in row_text and len(row_text) < 100 and not has_numeric_data:
                rows_to_remove.append(row)
                continue
            
            current_row_vals = {}
            for idx, cell in enumerate(cells):
                cell_text = extract_inline_xbrl_value(cell) or cell.get_text(strip=True)
                val = parse_sec_number(cell_text)
                if val is not None:
                    current_row_vals[idx] = (val, cell)
            
            data_indices = sorted(current_row_vals.keys())
            for idx_pos in [0, 2]:
                if idx_pos + 1 < len(data_indices):
                    i_idx = data_indices[idx_pos]
                    next_i = data_indices[idx_pos + 1]
                    curr_val, curr_cell = current_row_vals[i_idx]
                    prev_val, _ = current_row_vals[next_i]
                    if prev_val != 0:
                        change = ((curr_val - prev_val) / abs(prev_val)) * 100
                        if abs(change) < 10000:
                            badge = soup.new_tag("span", attrs={"class": f"growth-badge {('pos' if change >= 0 else 'neg')}"})
                            icon = "▲" if change >= 0 else "▼"
                            badge.string = f"{icon} {abs(change):.1f}%"
                            curr_cell.append(badge)
        
        # Remove identified rows
        for row in rows_to_remove:
            row.decompose()
    
    # Clean attributes
    allowed_attrs = ['rowspan', 'colspan', 'class']
    for tag in soup.find_all(True):
        tag.attrs = {key: value for key, value in tag.attrs.items() if key in allowed_attrs}
    
    # Remove empty elements
    for empty_tag in soup.find_all(['tr', 'div']):
        if not empty_tag.get_text(strip=True) and not empty_tag.contents:
            empty_tag.decompose()
    
    return str(soup)

async def formatHTML(htmlString: str) -> str:
    """Async wrapper for formatHTML_sync"""
    return await anyio.to_thread.run_sync(formatHTML_sync, htmlString)

async def fetch_statement_with_retry(client: httpx.AsyncClient, url: str, max_retries: int = 2) -> Tuple[bool, str, str]:
    """
    Fetch a statement with retry logic.
    Returns: (success, content, error_message)
    """
    for attempt in range(max_retries):
        try:
            res = await client.get(url)
            res.raise_for_status()
            formatted = await formatHTML(res.text)
            return True, formatted, ""
        except httpx.HTTPError as e:
            error_msg = f"HTTP error fetching {url}: {e}"
            if attempt == max_retries - 1:
                return False, "", error_msg
        except Exception as e:
            error_msg = f"Error fetching {url}: {e}"
            if attempt == max_retries - 1:
                return False, "", error_msg
        
        await asyncio.sleep(0.5)
    
    return False, "", "Max retries exceeded"

async def collect_candidates_from_filing_summary(client: httpx.AsyncClient, base_url: str) -> List[StatementCandidate]:
    """
    Collect all statement candidates from FilingSummary.xml.
    Returns a list of ranked candidates.
    """
    candidates = []
    summary_url = base_url + "FilingSummary.xml"
    
    try:
        summary_res = await client.get(summary_url)
        summary_res.raise_for_status()
        soup_xml = BeautifulSoup(summary_res.text, "xml")
        reports = soup_xml.find_all("Report")
        
        for report in reports:
            short_name_tag = report.find("ShortName")
            long_name_tag = report.find("LongName")
            menu_category_tag = report.find("MenuCategory")
            html_file_tag = report.find("HtmlFileName")
            xml_file_tag = report.find("XmlFileName")
            
            short_name = short_name_tag.text if short_name_tag else ""
            long_name = long_name_tag.text if long_name_tag else ""
            menu_category = menu_category_tag.text if menu_category_tag else ""
            
            statement_type = classify_statement_type(short_name, long_name, menu_category)
            if statement_type is None:
                continue
            
            score = rank_statement_candidate(short_name, long_name, menu_category)
            
            file_url = None
            if html_file_tag:
                file_url = base_url + html_file_tag.text
            elif xml_file_tag:
                file_url = base_url + xml_file_tag.text
            
            if file_url:
                candidates.append(StatementCandidate(
                    report_type=statement_type,
                    url=file_url,
                    short_name=short_name,
                    long_name=long_name,
                    menu_category=menu_category,
                    score=score,
                    source="FilingSummary"
                ))
    
    except Exception as e:
        print(f"Failed to fetch FilingSummary.xml: {e}")
        return []
    
    return candidates

async def collect_candidates_from_index(client: httpx.AsyncClient, base_url: str) -> List[StatementCandidate]:
    """
    Fallback: Scrape index.html/index.htm for financial statements.
    Returns a list of potential candidates.
    """
    candidates = []
    
    for index_file in ["index.html", "index.htm"]:
        try:
            index_url = base_url + index_file
            res = await client.get(index_url)
            res.raise_for_status()
            
            soup = BeautifulSoup(res.text, 'html.parser')
            links = soup.find_all('a', href=True)
            
            for link in links:
                href = link['href']
                text = link.get_text().lower()
                
                if not href.endswith(('.htm', '.html')):
                    continue
                
                if any(keyword in text for keyword in ["statement", "balance", "operations", "cash", "income"]):
                    statement_type = classify_statement_type(text, text, "")
                    if statement_type:
                        score = rank_statement_candidate(text, text, "")
                        candidates.append(StatementCandidate(
                            report_type=statement_type,
                            url=base_url + href if not href.startswith('http') else href,
                            short_name=text,
                            long_name=text,
                            menu_category="",
                            score=score,
                            source="fallback"
                        ))
            
            if candidates:
                return candidates
        
        except Exception as e:
            print(f"Failed to scrape {index_file}: {e}")
            continue
    
    return candidates

async def fetch_best_statement(client: httpx.AsyncClient, candidates: List[StatementCandidate]) -> Tuple[str, str, str]:
    """
    Fetch the best statement from candidates with fallback.
    Returns: (content, confidence, source)
    """
    candidates.sort()
    
    for candidate in candidates:
        success, content, error = await fetch_statement_with_retry(client, candidate.url)
        
        if success and content:
            confidence = "high" if candidate.score > 3 and candidate.source == "FilingSummary" else "medium"
            if candidate.source == "fallback":
                confidence = "low"
            
            return content, confidence, candidate.source
        else:
            print(f"Failed to fetch {candidate.url}: {error}")
            continue
    
    # No valid statement found
    return "", "none", "none"

@router.get("/financials")
async def read_financials(ticker: str):
    """
    Fetch financial statements with comprehensive fallback strategy.
    Never returns empty unless no reasonable financial data exists.
    """
    financial_statements = {
        "balanceSheet": {"content": "", "confidence": "none", "source": "none"},
        "incomeStatement": {"content": "", "confidence": "none", "source": "none"},
        "cashFlowStatement": {"content": "", "confidence": "none", "source": "none"}
    }
    
    try:
        # Try 10-K first, then 10-Q
        metadatas = await anyio.to_thread.run_sync(
            dl.get_filing_metadatas,
            RequestedFilings(ticker_or_cik=ticker, form_type="10-K", limit=1)
        )
        
        if not metadatas:
            metadatas = await anyio.to_thread.run_sync(
                dl.get_filing_metadatas,
                RequestedFilings(ticker_or_cik=ticker, form_type="10-Q", limit=1)
            )
        
        if not metadatas:
            print(f"No filings found for {ticker}")
            return financial_statements
        
        metadata = metadatas[0]
        base_url = metadata.primary_doc_url.rsplit("/", 1)[0] + "/"
        
        async with httpx.AsyncClient(headers=HEADERS, timeout=60.0) as client:
            # Step 1: Try FilingSummary.xml
            candidates_by_type: Dict[str, List[StatementCandidate]] = {
                "incomeStatement": [],
                "balanceSheet": [],
                "cashFlowStatement": []
            }
            
            filing_summary_candidates = await collect_candidates_from_filing_summary(client, base_url)
            
            # Group by statement type
            for candidate in filing_summary_candidates:
                candidates_by_type[candidate.report_type].append(candidate)
            
            # Step 2: If FilingSummary fails or yields no candidates, use fallback
            if not filing_summary_candidates:
                print(f"FilingSummary.xml failed or empty for {ticker}, using fallback...")
                fallback_candidates = await collect_candidates_from_index(client, base_url)
                
                for candidate in fallback_candidates:
                    candidates_by_type[candidate.report_type].append(candidate)
            
            # Step 3: Fetch best statement for each type
            for statement_type in ["incomeStatement", "balanceSheet", "cashFlowStatement"]:
                candidates = candidates_by_type[statement_type]
                
                if not candidates:
                    print(f"No candidates found for {statement_type}")
                    continue
                
                content, confidence, source = await fetch_best_statement(client, candidates)
                
                if content:
                    financial_statements[statement_type] = {
                        "content": content,
                        "confidence": confidence,
                        "source": source
                    }
                else:
                    print(f"Failed to fetch any valid {statement_type}")
        
        return financial_statements
    
    except Exception as e:
        print(f"Global error fetching financials for {ticker}: {e}")
        return financial_statements