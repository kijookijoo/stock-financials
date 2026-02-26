import './AppHeader.css'
import { Link, useNavigate } from "react-router-dom"
import { useState } from 'react'
export function AppHeader() {
    const navigate = useNavigate();
    const [inputText, setInputText] = useState("");


    function handleInput(event) {
        if (event.currentTarget.value.length <= 5) {
            setInputText(event.currentTarget.value.toUpperCase());
        }
    }

    function handleSearch(event) {
        if (event) event.preventDefault();
        const trimmed = inputText.trim();
        if (!trimmed) return;
        navigate(`/financials?ticker=${trimmed}`);
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
                    <Link className='navbar-item brand-link' to='/' style={{ margin: "0px" }}>
                        <span className="brand-wordmark">WISELY.</span>
                    </Link>

                    <form className="header-search" onSubmit={handleSearch}>
                        <input className="header-search-input"
                            type="text"
                            placeholder="Search ticker here..."
                            aria-label="text"
                            required
                            minLength={1}
                            onKeyDown={handleKeyDown}
                            onChange={handleInput}
                            value={inputText} />

                        <button className="header-search-button" onClick={handleSearch} type="submit">Search</button>
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
