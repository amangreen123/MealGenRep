import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ChefHat, Loader2, Wine, UtensilsCrossed, ScanEye, Sparkles } from "lucide-react"

const CookableSearch = ({ onSearch, ingredients = [], selectedDiet, isSearching = false, focusIngredient }) => {
    const [searchType, setSearchType] = useState("all") // "all", "meals", "drinks"
    const [exactMatch, setExactMatch] = useState(false)
    const [focusSearch, setFocusSearch] = useState(false)

    const handleSearchClick = () => {
        onSearch({
            searchType,
            exactMatch,
            focusSearch,
            focusIngredient: focusSearch && ingredients.length > 0 ? ingredients[0] : null,
        })
    }

    const getSearchButtonText = () => {
        if (focusSearch && ingredients.length > 0) {
            return `Find ${ingredients[0]} ${searchType === "all" ? "Recipes" : searchType === "drinks" ? "Drinks" : "Meals"}`
        }

        if (exactMatch) {
            return `Find Exact ${searchType === "all" ? "Matches" : searchType === "drinks" ? "Drinks" : "Meals"}`
        }

        return `Find ${searchType === "all" ? "All Recipes" : searchType === "drinks" ? "Drinks" : "Meals"}`
    }

    return (
        <div className="bg-gray-800/50 border-2 border-gray-700 rounded-3xl p-6 mb-6 space-y-6 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
                <ChefHat className="h-5 w-5 text-[#ce7c1c]" />
                <h3 className="text-lg font-title">Search Options</h3>
            </div>

            {/* Search Type Selection */}
            <div className="space-y-3">
                <Label className="text-base font-terminal">Search Type</Label>
                <div className="grid grid-cols-3 gap-2">
                    <Button
                        variant={searchType === "all" ? "default" : "outline"}
                        onClick={() => setSearchType("all")}
                        className={`font-terminal ${
                            searchType === "all"
                                ? "bg-[#ce7c1c] hover:bg-[#ce7c1c]/80 text-white border-[#ce7c1c]"
                                : "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                        }`}
                    >
                        <UtensilsCrossed className="h-4 w-4 mr-2" />
                        All
                    </Button>
                    <Button
                        variant={searchType === "meals" ? "default" : "outline"}
                        onClick={() => setSearchType("meals")}
                        className={`font-terminal ${
                            searchType === "meals"
                                ? "bg-[#ce7c1c] hover:bg-[#ce7c1c]/80 text-white border-[#ce7c1c]"
                                : "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                        }`}
                    >
                        <ChefHat className="h-4 w-4 mr-2" />
                        Meals
                    </Button>
                    <Button
                        variant={searchType === "drinks" ? "default" : "outline"}
                        onClick={() => setSearchType("drinks")}
                        className={`font-terminal ${
                            searchType === "drinks"
                                ? "bg-[#ce7c1c] hover:bg-[#ce7c1c]/80 text-white border-[#ce7c1c]"
                                : "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                        }`}
                    >
                        <Wine className="h-4 w-4 mr-2" />
                        Drinks
                    </Button>
                </div>
                <p className="text-sm text-gray-400 font-terminal">
                    {searchType === "all" && "Search both meals and cocktails"}
                    {searchType === "meals" && "Search only food recipes"}
                    {searchType === "drinks" && "Search only cocktails and beverages"}
                </p>
            </div>

            {/* Search Mode Selection - Button Style */}
            <div className="space-y-3">
                <Label className="text-base font-terminal">Search Mode</Label>
                <div className="grid grid-cols-2 gap-3">
                    {/* General Search Button */}
                    <button
                        onClick={() => setExactMatch(false)}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                            !exactMatch
                                ? "bg-[#ce7c1c]/20 border-[#ce7c1c] shadow-md shadow-[#ce7c1c]/20"
                                : "bg-gray-700/30 border-gray-600 hover:border-gray-500"
                        }`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Sparkles className={`h-6 w-6 ${!exactMatch ? "text-[#ce7c1c]" : "text-gray-400"}`} />
                            <span className={`font-terminal text-sm font-bold ${!exactMatch ? "text-[#ce7c1c]" : "text-gray-400"}`}>
                                General
                            </span>
                            <span className="text-xs text-gray-400 text-center font-terminal">
                                Find similar recipes
                            </span>
                        </div>
                        {!exactMatch && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-[#ce7c1c] rounded-full animate-pulse" />
                        )}
                    </button>

                    {/* Exact Match Button */}
                    <button
                        onClick={() => setExactMatch(true)}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                            exactMatch
                                ? "bg-[#ce7c1c]/20 border-[#ce7c1c] shadow-md shadow-[#ce7c1c]/20"
                                : "bg-gray-700/30 border-gray-600 hover:border-gray-500"
                        }`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <ScanEye className={`h-6 w-6 ${exactMatch ? "text-[#ce7c1c]" : "text-gray-400"}`} />
                            <span className={`font-terminal text-sm font-bold ${exactMatch ? "text-[#ce7c1c]" : "text-gray-400"}`}>
                                Exact Match
                            </span>
                            <span className="text-xs text-gray-400 text-center font-terminal">
                                Exact ingredients only
                            </span>
                        </div>
                        {exactMatch && (
                            <div className="absolute top-2 right-2 w-3 h-3 bg-[#ce7c1c] rounded-full animate-pulse" />
                        )}
                    </button>
                </div>
                <p className="text-sm text-gray-400 font-terminal">
                    {exactMatch
                        ? "⚡ Only recipes matching your exact ingredients"
                        : "🌟 Includes recipes with additional ingredients"
                    }
                </p>
            </div>

            {/* Focus Search Toggle - Button Style */}
            {ingredients.length > 0 && (
                <div className="space-y-3">
                    <Label className="text-base font-terminal">Focus Ingredient</Label>
                    <button
                        onClick={() => setFocusSearch(!focusSearch)}
                        className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                            focusSearch
                                ? "bg-[#ce7c1c]/20 border-[#ce7c1c] shadow-md shadow-[#ce7c1c]/20"
                                : "bg-gray-700/30 border-gray-600 hover:border-gray-500"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ScanEye className={`h-5 w-5 ${focusSearch ? "text-[#ce7c1c]" : "text-gray-400"}`} />
                                <div className="text-left">
                                    <div className={`font-terminal text-sm font-bold ${focusSearch ? "text-[#ce7c1c]" : "text-gray-300"}`}>
                                        Focus on "{ingredients[0]}"
                                    </div>
                                    <div className="text-xs text-gray-400 font-terminal">
                                        Show recipes where {ingredients[0]} is the star
                                    </div>
                                </div>
                            </div>
                            <div className={`w-12 h-6 rounded-full transition-colors duration-300 ${
                                focusSearch ? "bg-[#ce7c1c]" : "bg-gray-600"
                            } relative`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                                    focusSearch ? "translate-x-7" : "translate-x-1"
                                }`} />
                            </div>
                        </div>
                    </button>
                </div>
            )}

            {/* Search Button */}
            <Button
                onClick={handleSearchClick}
                className="w-full text-white font-terminal py-6 px-6 rounded-full bg-gradient-to-r from-[#ce7c1c] to-[#e89130] hover:from-[#e89130] hover:to-[#ce7c1c] border-2 border-[#ce7c1c] mt-4 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-[#ce7c1c]/30"
                disabled={ingredients.length === 0 || isSearching}
                size="lg"
            >
                {isSearching ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Searching...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        {getSearchButtonText()}
                    </>
                )}
            </Button>

            {/* Ingredient Count Info */}
            <div className="text-sm text-gray-400 text-center font-terminal bg-gray-700/30 rounded-full py-2 px-4">
                Searching with <span className="text-[#ce7c1c] font-bold">{ingredients.length}</span> ingredient{ingredients.length !== 1 ? "s" : ""}
                {selectedDiet && <span className="text-green-400"> • {selectedDiet} diet</span>}
            </div>
        </div>
    )
}

export default CookableSearch