import { useEffect } from 'react';
import ReactGA from "react-ga4";

const GoogleAnalytics = () => {

    useEffect(() => {
        // Initialize GA4 once when the component mounts

        if (!window.GA_INITIALIZED) {
            ReactGA.initialize("G-5VEDN0823V");
            window.GA_INITIALIZED = true;
        }
    }, []);

    return null; // This component doesn't render anything
};

export default GoogleAnalytics;