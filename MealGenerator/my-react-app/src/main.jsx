import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Users from './UserInput.jsx'
import RecipeDetails from "./RecipeDetails.jsx";
import GoogleAnalytics from "./GoogleAnalytics.jsx";
import ReactGA from "react-ga4";

ReactGA.initialize("G-5VEDN0823V")

const App = () => (
    <StrictMode>
        <GoogleAnalytics />
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Users />} />
                <Route path="/:recipeId" element={<RecipeDetails />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
);

createRoot(document.getElementById('root')).render(<App />)

