import './AppHeader.css'
import { Link, useNavigate } from "react-router-dom"
import { useState } from 'react'
export function AppHeader() {
    const navigate = useNavigate();
    const [inputText, setInputText] = useState("");


    function handleInput(event) {
        setInputText(event.currentTarget.value.toUpperCase());
    }

    function handleSearch() {
        navigate(`/financials?ticker=${inputText}`);
    }

    function handleKeyDown(event) {
        if (event.key == "Enter") {
            handleSearch();
        }
    }

    return (
        <>
            <div className="header-container">

                <div className='items-left'>

                    <input className='ticker-input'
                        placeholder="Enter ticker here..."
                        type='text'
                        value={inputText}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                    />

                    <button className='search-button' onClick={handleSearch}>
                        <img src='/images/search-icon.png' />
                    </button>

                </div>

                <div className="items-right">
                    <Link className='navbar-item' to='/'>
                        Home
                    </Link>

                    <Link className='navbar-item' to='/financials'>
                        Search Financials

                    </Link>

                    <Link className='navbar-item' to='/earnings'>
                        Upcoming Earnings
                    </Link>
                </div>
            </div>

        </>
    );
}

export default AppHeader;