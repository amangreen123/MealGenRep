"use client"
import MealForger from "./UserInput"
import RandomRecipes from "./RandomRecipes"

export default function Page() {
    // Remove the conditional display - always show random recipes
    return (
        <>
            <MealForger />
            <RandomRecipes />
        </>
    )
}