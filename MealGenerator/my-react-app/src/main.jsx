import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Users from './UserInput.jsx';
import RecipeDetails from "./RecipeDetails.jsx";
import MealDBRecipeDetails from "./MealDBRecipeDetails.jsx";
import GoogleAnalytics from "./GoogleAnalytics.jsx";

const TrackPageViews = () => {
    const location = useLocation();

    useEffect(() => {
        // Send page view event to GA
        window.gtag('event', 'page_view', {
            page_path: location.pathname + location.search,
        });
    }, [location]);

    return null;
};

const App = () => (
    <StrictMode>
        <GoogleAnalytics />
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Users />} />
                <Route path="/recipe/:recipeId" element={<RecipeDetails />} />
                <Route path="/mealdb-recipe/:id" element={<MealDBRecipeDetails />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
);

createRoot(document.getElementById('root')).render(<App />);
