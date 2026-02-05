"use client"
import MealForger from "./UserInput"
import { useEffect } from "react"
import RandomRecipes from "./RandomRecipes"

export default function Page() {

    useEffect(() => {
        window.addEventListener('appinstalled', (evt) => {
            console.log('Meal Forger was installed!');
            if (window.gtag) {
                window.gtag('event', 'pwa_install', {
                    event_category: 'Engagement',
                    event_label: 'User installed App',
                });
            }
        });
    }, []);
    
    return (
        <>
            <MealForger />
            <RandomRecipes />
        </>
    )
}