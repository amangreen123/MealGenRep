import { Button } from "@/components/ui/button"

export default function GenerateButton({ ingredients, isSearching, onSearch, loadingText }) {
    // Only show the button if there are ingredients in the pantry
    if (ingredients.length === 0) {
        return null
    }

    return (
        <Button
            className="w-full bg-[#ce7c1c] hover:bg-[#ce7c1c]/90 text-white px-8 py-4 font-terminal rounded-full cursor-pointer text-lg font-bold shadow-lg transform hover:scale-[1.02] transition-all duration-300"
            onClick={onSearch}
            disabled={isSearching}
        >
            {isSearching ? (loadingText || "Generating...") : "Generate Recipes"}
        </Button>
    )
}
