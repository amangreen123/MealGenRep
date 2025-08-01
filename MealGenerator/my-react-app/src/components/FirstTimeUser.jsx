import {useEffect, useState} from "react";


export default function FirstTimeUser ({onFirstTimeStatusChange}) {
    const [isFirstTimeUser, setIsFirstTimeUser] = useState(true)
    
    // Check if user is a first-time visitor
    useEffect(() => {
        const firstTimeUser = localStorage.getItem("mealForgerFirstTimeUser")
        if (firstTimeUser === "false") {
            setIsFirstTimeUser(false)
            //optionalChaining look it up later 
            onFirstTimeStatusChange?.(false);
        } else {
            localStorage.setItem("mealForgerFirstTimeUser", "true")
            setIsFirstTimeUser(true)
            onFirstTimeStatusChange?.(true);
        }
    }, [onFirstTimeStatusChange])
    
    const markAsReturningUser = () => {
        localStorage.setItem("mealForgerFirstTimeUser", "false")
        setIsFirstTimeUser(false)
        onFirstTimeStatusChange?.(false);
    }
    
    return {
        isFirstTimeUser,
        markAsReturningUser
    }
}