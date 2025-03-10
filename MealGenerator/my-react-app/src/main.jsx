import ReactGA from "react-ga4";
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Users from './UserInput.jsx';
import RecipeDetails from "./RecipeDetails.jsx";
import MealDBRecipeDetails from "./MealDBRecipeDetails.jsx";
import GoogleAnalytics from "./GoogleAnalytics.jsx";



ReactGA.initialize("G-5VEDN0823V");


const TrackPageViews = () => {
    const location = useLocation();

    useEffect(() => {
        ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }, [location]);

    return null;
};

// Separate the Routes component that includes TrackPageViews
const AppRoutes = () => {
    return (
        <>
            <TrackPageViews />
            <Routes>
                <Route path="/" element={<Users />} />
                <Route path="/recipe/:recipeId" element={<RecipeDetails />} />
                <Route path="/mealdb-recipe/:id" element={<MealDBRecipeDetails />} />
            </Routes>
        </>
    );
};

const App = () => (
    <StrictMode>
        <GoogleAnalytics />
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    </StrictMode>
);

createRoot(document.getElementById('root')).render(<App />);
