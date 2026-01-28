import React from "react";

const AmbientBackground = () => {

    return (
        <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-[#131415]">

            {/* 1. Texture (Noise) - Subtle Grain */}
            <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* 2. Orange Glow (Top-Left to Center) 
         - Sized to hit the logo but fade before the bottom 
      */}
            <div className="absolute -top-[15%] -left-[10%] w-[70vw] h-[70vw] bg-[#ce7c1c] rounded-full blur-[120px] opacity-30 mix-blend-screen" />

            {/* 3. Blue Glow (Bottom-Right) 
         - Sized to provide depth but keep the top-right corner darker 
      */}
            <div className="absolute -bottom-[20%] -right-[10%] w-[70vw] h-[70vw] bg-blue-900 rounded-full blur-[120px] opacity-35 mix-blend-screen" />

            {/* 4. The "Logo Blend" (High Center)
         - This sits right behind the logo area to bridge the Orange and Blue
         - Creates that specific blended hotspot you asked for 
      */}
            <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[40vw] h-[40vw] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen opacity-40" />

        </div>
    );
    
    // return (
    //     <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-[#131415]">
    //
    //         {/* 1. Noise Texture (Kept subtle) */}
    //         <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
    //              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
    //         </div>
    //
    //         {/* 2. Top-Left Warm Glow (ORANGE) - Increased Opacity */}
    //         <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-[#ce7c1c] rounded-full blur-[120px] opacity-40" />
    //
    //         {/* 3. Bottom-Right Cool Glow (BLUE) - Increased Opacity */}
    //         <div className="absolute -bottom-[10%] -right-[10%] w-[50vw] h-[50vw] bg-blue-900 rounded-full blur-[120px] opacity-40" />
    //
    //         {/* 4. Center Accent (New) - Adds a faint light in the middle */}
    //         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-[#ce7c1c] rounded-full blur-[150px] opacity-10" />
    //
    //     </div>
    // );

    // return (
    //     <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden bg-[#131415]">
    //
    //         {/* 1. Texture (Noise) - Adds the "Cast Iron" grainy feel */}
    //         <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
    //              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
    //         </div>
    //
    //         {/* 2. The Forge Fire (Warmth) - Top Left & Center
    //      Expanded to overlap with the blue, creating a blend. */}
    //         <div className="absolute -top-[20%] -left-[10%] w-[90vw] h-[90vw] bg-[#ce7c1c] rounded-full blur-[130px] opacity-25 mix-blend-screen" />
    //
    //         {/* 3. The Cool Shadow (Depth) - Bottom Right
    //      Expanded to meet the orange. */}
    //         <div className="absolute -bottom-[20%] -right-[10%] w-[90vw] h-[90vw] bg-blue-900 rounded-full blur-[130px] opacity-30 mix-blend-screen" />
    //
    //         {/* 4. The Binding Glow - Center
    //      This sits in the middle to smooth the transition between Orange and Blue. */}
    //         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-purple-900/20 rounded-full blur-[150px] mix-blend-screen" />
    //
    //     </div>
    // );
};

export default AmbientBackground;