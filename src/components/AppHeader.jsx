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

                    {/* <input className='ticker-input'
                        type=''
                        
                        
                        
                    /> */}

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
                    <Link className='navbar-item' to='/'>
                        Home
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