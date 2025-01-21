import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Users from './UserInput.jsx'
import RecipeDetails from "./RecipeDetails.jsx";
import GoogleAnalytics from "./GoogleAnalytics.jsx";


createRoot(document.getElementById('root')).render(

  <StrictMode>
      <GoogleAnalytics />
      <BrowserRouter>
            <Routes>

                <Route path="/" element={<Users />} />
                <Route path={"/:recipeId"} element={<RecipeDetails />} />
            </Routes>
      </BrowserRouter>
  </StrictMode>

)
