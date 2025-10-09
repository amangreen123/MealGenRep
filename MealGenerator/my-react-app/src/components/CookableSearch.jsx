"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ChefHat, Loader2, Wine, UtensilsCrossed, ScanEye } from "lucide-react"

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
        <div className="bg-gray-800/50 border-2 border-gray-700 rounded-3xl p-6 mb-6 space-y-4 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
                <ChefHat className="h-5 w-5 text-[#ce7c1c]" />
                <h3 className="text-lg font-title">Search Options</h3>
            </div>

            <div className="space-y-2">
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

            <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                    <Label className="text-base flex items-center gap-2 font-terminal">
                        <ScanEye className="h-4 w-4" />
                        Exact Match
                    </Label>
                    <p className="text-sm text-gray-400 font-terminal">Only show recipes with exact ingredient matches</p>
                </div>
                <Switch
                    checked={exactMatch}
                    onCheckedChange={setExactMatch}
                    className="bg-gray-700 data-[state=checked]:bg-[#ce7c1c]"
                />
            </div>

            {/* Focus Search Toggle */}
            {ingredients.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                        <Label className="text-base flex items-center gap-2 font-terminal">
                            <ScanEye className="h-4 w-4" />
                            Focus on {ingredients[0]}
                        </Label>
                        <p className="text-sm text-gray-400 font-terminal">
                            Only show recipes where {ingredients[0]} is a main ingredient
                        </p>
                    </div>
                    <Switch
                        checked={focusSearch}
                        onCheckedChange={setFocusSearch}
                        className="bg-gray-700 data-[state=checked]:bg-[#ce7c1c]"
                    />
                </div>
            )}

            {/* Search Button */}
            <Button
                onClick={handleSearchClick}
                className="w-full text-white font-terminal py-2 px-4 rounded-full bg-[#ce7c1c] hover:bg-[#ce7c1c]/80 border-2 border-[#ce7c1c] mt-4 transform hover:scale-[1.02] transition-all duration-300"
                disabled={ingredients.length === 0 || isSearching}
                size="lg"
            >
                {isSearching ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Searching...
                    </>
                ) : (
                    getSearchButtonText()
                )}
            </Button>

            {/* Ingredient Count Info */}
            <div className="text-sm text-gray-400 text-center font-terminal">
                Searching with {ingredients.length} ingredient{ingredients.length !== 1 ? "s" : ""}
                {selectedDiet && ` • ${selectedDiet} diet`}
            </div>
        </div>
    )
}

export default CookableSearch
