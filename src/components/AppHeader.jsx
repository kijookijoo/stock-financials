import './AppHeader.css'
import { Link, useNavigate } from "react-router-dom"
import { useState } from 'react'
export function AppHeader() {
    const navigate = useNavigate();
    const [inputText, setInputText] = useState("");


    function handleInput(event) {
        if (event.currentTarget.value.length <= 4) {
            setInputText(event.currentTarget.value.toUpperCase());
        }
    }

    function handleSearch(event) {
        if (event) event.preventDefault();
        navigate(`/financials?ticker=${inputText}`);
    }

    function handleKeyDown(event) {
        if (event.key == "Enter") {
            handleSearch(event);
        }
    }

    return (
        <>
            <div className="header-container">

                <div className='items-left'>
                    <Link className='navbar-item' to='/' style={{ margin: "0px" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-no-axes-combined-icon lucide-chart-no-axes-combined"><path d="M12 16v5" /><path d="M16 14v7" /><path d="M20 10v11" /><path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" /><path d="M4 18v3" /><path d="M8 14v7" /></svg>

                    </Link>

                    <form className="d-flex my-2 my-lg-0" onSubmit={handleSearch}>
                        <input className="form-control me-2"
                            type="text"
                            placeholder="Enter ticker here..."
                            aria-label="text"
                            onKeyDown={handleKeyDown}
                            onChange={handleInput}
                            value={inputText} />

                        <button className="btn btn-outline-success my-2 my-sm-0" onClick={handleSearch} type="submit">Search</button>
                    </form>


                </div>

                <div className="items-right">
                    <Link className='navbar-item' to='/earnings'>
                        Upcoming Earnings
                    </Link>
                </div>
            </div>

        </>
    );
}

export default AppHeader;