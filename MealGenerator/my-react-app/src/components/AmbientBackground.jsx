import React from "react";

const AmbientBackground = () => {
    return (
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-[#131415]">

            {/* 1. Noise Texture (Kept subtle) */}
            <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* 2. Top-Left Warm Glow (ORANGE) - Increased Opacity */}
            <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-[#ce7c1c] rounded-full blur-[120px] opacity-40" />

            {/* 3. Bottom-Right Cool Glow (BLUE) - Increased Opacity */}
            <div className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] bg-blue-900 rounded-full blur-[120px] opacity-40" />

            {/* 4. Center Accent (New) - Adds a faint light in the middle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-[#ce7c1c] rounded-full blur-[150px] opacity-10" />

        </div>
    );
};

export default AmbientBackground;