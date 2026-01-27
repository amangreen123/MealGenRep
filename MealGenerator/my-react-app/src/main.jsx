import ReactGA from "react-ga4";
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Users from './UserInput.jsx';
import RecipeDetails from "./API/Spooncular/RecipeDetails.jsx";
import MealDBRecipeDetails from "./API/MealDB/MealDBRecipeDetails.jsx";
import DrinkDetails from "./API/MealDB/DrinkDetails.jsx"
import GoogleAnalytics from "./GoogleAnalytics.jsx";
import AmbientBackground from "./components/AmbientBackground.jsx";



ReactGA.initialize("G-5VEDN0823V");


const TrackPageViews = () => {
    const location = useLocation();

    useEffect(() => {
        ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }, [location]);

    return null;
};

const AppRoutes = () => {
    return (
        <>
            <TrackPageViews />
            <Routes>
                <Route path="/" element={<Users />} />
                <Route path="/recipe/:recipeId" element={<RecipeDetails />} />
                <Route path="/mealdb-recipe/:id" element={<MealDBRecipeDetails />} />
                <Route path="/drink/:id" element={<DrinkDetails />} />
                <Route path="/mealdb-recipe/:slug" element={<MealDBRecipeDetails />} />
            </Routes>
        </>
    );
};

const App = () => (
    <StrictMode>
        <GoogleAnalytics />
        <BrowserRouter>
            <AmbientBackground />
            <AppRoutes />
        </BrowserRouter>
    </StrictMode>
);

createRoot(document.getElementById('root')).render(<App />);
