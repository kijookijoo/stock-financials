import './App.css'
import { HomePage } from './pages/HomePage'
import { FinancialsPage } from './pages/FinancialsPage'
import { EarningsPage } from './pages/EarningsPage'
import { AppHeader } from './components/AppHeader'
import { CustomCursor } from './components/CustomCursor'
import { Route, Routes } from 'react-router-dom'

function App() {

    return (
        <>
            <CustomCursor />
            <AppHeader />



            <Routes>
                <Route path='/' element={<HomePage />} />
                <Route path='/financials/' element={<FinancialsPage />} />
                <Route path='/earnings' element={<EarningsPage />} />
            </Routes>


        </>
    )
}

export default App
