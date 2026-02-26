import './App.css'
import { useEffect, useState } from 'react'
import { HomePage } from './pages/HomePage'
import { FinancialsPage } from './pages/FinancialsPage'
import { EarningsPage } from './pages/EarningsPage'
import { AppHeader } from './components/AppHeader'
import { CustomCursor } from './components/CustomCursor'
import { Route, Routes } from 'react-router-dom'

const INTRO_SEEN_KEY = 'wisely_intro_seen_v1';

function App() {
    const [showIntro, setShowIntro] = useState(false);

    useEffect(() => {
        try {
            const hasSeenIntro = window.localStorage.getItem(INTRO_SEEN_KEY) === '1';
            if (!hasSeenIntro) {
                setShowIntro(true);
            }
        } catch {
            setShowIntro(true);
        }
    }, []);

    useEffect(() => {
        if (!showIntro) return;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                dismissIntro();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showIntro]);

    function dismissIntro() {
        setShowIntro(false);
        try {
            window.localStorage.setItem(INTRO_SEEN_KEY, '1');
        } catch { }
    }

    return (
        <>
            <CustomCursor />
            <AppHeader />

            {showIntro && (
                <div className="intro-overlay" role="dialog" aria-modal="true" aria-labelledby="intro-title">
                    <div className="intro-modal">
                        <p className="intro-kicker">WELCOME</p>
                        <h1 id="intro-title">WISELY.</h1>
                        <p className="intro-copy">
                            A fast way to scan sector leaders, open financial statements, and generate clear bull or bear talking points.
                        </p>
                        <p className="intro-copy intro-note">
                            Built for research speed. Not investment advice.
                        </p>
                        <button type="button" className="intro-enter-btn" onClick={dismissIntro}>
                            Enter
                        </button>
                    </div>
                </div>
            )}

            <Routes>
                <Route path='/' element={<HomePage />} />
                <Route path='/financials/' element={<FinancialsPage />} />
                <Route path='/earnings' element={<EarningsPage />} />
            </Routes>
        </>
    )
}

export default App
