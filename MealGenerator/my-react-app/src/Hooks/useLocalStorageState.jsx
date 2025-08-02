import {useState, useEffect} from "react"

const useLocalStorageState = (key, defaultValue) => {
    
    const [value, setValue] = useState(()=> {
        try{
            const stored = localStorage.getItem(key)
            return stored ? JSON.parse(stored) : defaultValue
            
        } catch(error) {
            console.error(`Error reading localStorage key "${key}":`, error)
            return defaultValue
        }
    })
    
    useEffect(()=> {
        try{
            localStorage.setItem(key, JSON.stringify(value))
        } catch(error) {
            console.error(`Error writing to localStorage key "${key}":`, error)
        }
    }, [key,value])
    
    return [value, setValue]
}

export default useLocalStorageState