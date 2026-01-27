import React from "react";
import MealForgerLogo from "../Images/Meal_Forger.png";

const DynamicLogo = ({ className }) => {
    return (
        <div className={`relative flex items-center justify-center group ${className}`}>

            {/* 1. Ambient Background Glow (Orange Pulse) */}
            {/* This creates the "powered on" feel behind the logo */}
            <div className="absolute inset-0 bg-[#ce7c1c] blur-[60px] opacity-20 rounded-full scale-75 group-hover:scale-110 group-hover:opacity-40 transition-all duration-700 ease-in-out animate-pulse" />

            {/* 2. Secondary White Glow (Subtle Highlight) */}
            <div className="absolute inset-0 bg-white blur-[40px] opacity-5 rounded-full scale-50 group-hover:scale-90 transition-all duration-700" />

            {/* 3. The Logo Image (Interactive) */}
            <img
                src={MealForgerLogo}
                alt="Meal Forger"
                className="relative z-10 h-full w-auto object-contain 
                   drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] 
                   transition-transform duration-500 ease-out 
                   group-hover:scale-105 group-hover:-rotate-2 group-hover:-translate-y-2
                   cursor-pointer"
            />

            {/* 4. Shine Effect on Hover */}
            {/* A distinct white sheen that moves across the logo when hovered */}
            <div className="absolute inset-0 z-20 overflow-hidden rounded-full opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700">
                <div className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            </div>
        </div>
    );
};

export default DynamicLogo;