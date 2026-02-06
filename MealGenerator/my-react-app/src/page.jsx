import MealForger from "./UserInput"
import { useEffect } from "react"
import RandomRecipes from "./RandomRecipes"
import ReactGA from "react-ga4"

export default function Page() {

    useEffect(() => {
        console.log('🔵 Page mounted');

        // Check if GA is initialized
        console.log('GA_INITIALIZED?', window.GA_INITIALIZED);

        const handleAppInstalled = (evt) => {
            console.log('🟢 appinstalled event FIRED!');

            // Double-check initialization
            if (!window.GA_INITIALIZED) {
                console.warn('⚠️ GA not initialized yet! Initializing now...');
                ReactGA.initialize("G-5VEDN0823V");
                window.GA_INITIALIZED = true;
            }

            console.log('🟢 Sending event...');
            ReactGA.event({
                category: 'Engagement',
                action: 'pwa_install',
                label: 'User installed App',
            });
            console.log('🟢 Event sent!');
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    return (
        <>
            <MealForger />
            <RandomRecipes />
        </>
    )
}