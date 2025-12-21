from fastapi import FastAPI
from sec_downloader import Downloader
from sec_downloader.types import RequestedFilings
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup

app = FastAPI()

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
    if ("income statement" in fileName_lower or 
        "operations" in fileName_lower or 
        "comprehensive loss" in fileName_lower or 
        "comprehensive income" in fileName_lower):
        return "incomeStatement"
    
    # Check for Balance Sheet
    if ("balance sheet" in fileName_lower or 
        "financial position" in fileName_lower):
        return "balanceSheet"
    
    # Check for Cash Flow
    if ("cash flow" in fileName_lower):
        return "cashFlowStatement"
    
    return None

def formatHTML(htmlString): 
    html_start = htmlString.find("<html")
    clean_html = htmlString[html_start:]
    soup = BeautifulSoup(clean_html, 'html.parser')
    
    # td - numbers
    # a class = "a" - Item names
    # strong - item headers
    # change font, remove links, adjust spacing
    for tag in soup.find_all("a"):
        tag.unwrap()
        
    return soup.prettify()
    
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
        soup = BeautifulSoup(summary_xml, "xml")
        return soup.find_all("Report")
    
@app.get("/financials")
def read_financials(ticker : str):
    metadatas = dl.get_filing_metadatas(
            RequestedFilings(ticker_or_cik=ticker, form_type="10-Q", limit = 2)
        )

    if not metadatas:
        return financial_statements

    base_url = None
    for metadata in metadatas:
        base_url = metadata.primary_doc_url.rsplit("/", 1)[0] + "/"
        break  
    
    if not base_url:
        return financial_statements
    
    reports = parseandFind(base_url)

    financial_statements = {
        "balanceSheet" : "",
        "incomeStatement" : "",
        "cashFlowStatement" : ""
    }
    for report in reports:
        short_name = report.find("ShortName").text
        # check if file is one of B/S, I/S, C/F
        docType = getFinancialStatementType(short_name)
        if docType is None:
            continue

        html_file = report.find("HtmlFileName")
        if html_file is None:
            continue
        
        # handling errors
        html_file = html_file.text
        print(short_name, html_file)
        file_url = base_url + html_file
        print(file_url)   

        statement_data = exportasHTML(file_url, short_name)
        if financial_statements[docType] == "":
            financial_statements[docType] = formatHTML(statement_data["content"])
        else:
            continue      

    return financial_statements





    