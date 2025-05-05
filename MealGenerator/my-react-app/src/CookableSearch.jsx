"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ChefHat, Loader2, ScanEye } from "lucide-react"

const CookableSearch = ({ onSearch, ingredients = [], selectedDiet, isSearching = false, focusIngredient }) => {
    const [cookableOnly, setCookableOnly] = useState(false)
    const [strictMode, setStrictMode] = useState(false)
    const [focusSearch, setFocusSearch] = useState(false)

    const handleSearchClick = () => {
        onSearch({
            cookableOnly,
            strictMode,
            focusSearch,
            focusIngredient: focusSearch && ingredients.length > 0 ? ingredients[0] : null,
        })
    }

    return (
        <div className="bg-gray-800/50 border-2 border-gray-700 rounded-3xl p-6 mb-6 space-y-4 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
            <div className="flex items-center gap-2 mb-2">
                <ChefHat className="h-5 w-5 text-[#ce7c1c]" />
                <h3 className="text-lg font-title">Search Options</h3>
            </div>

            {/* Cookable Only Toggle */}
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label className="text-base font-terminal">Cookable Now</Label>
                    <p className="text-sm text-gray-400 font-terminal">
                        {strictMode
                            ? "Only recipes with EXACT ingredient matches"
                            : "Show recipes you can make with your ingredients"}
                    </p>
                </div>
                <Switch
                    checked={cookableOnly}
                    onCheckedChange={setCookableOnly}
                    className="bg-gray-700 data-[state=checked]:bg-[#ce7c1c]"
                />
            </div>

            {/* Strict Mode Toggle */}
            {cookableOnly && (
                <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                        <Label className="text-base flex items-center gap-2 font-terminal">
                            <ScanEye className="h-4 w-4" />
                            Strict Matching
                        </Label>
                        <p className="text-sm text-gray-400 font-terminal">
                            Require exact ingredient names (e.g. "cheddar cheese" not just "cheddar")
                        </p>
                    </div>
                    <Switch
                        checked={strictMode}
                        onCheckedChange={setStrictMode}
                        className="bg-gray-700 data-[state=checked]:bg-[#ce7c1c]"
                    />
                </div>
            )}

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
                    `Find ${focusSearch ? `${ingredients[0]} ` : ""}${cookableOnly ? (strictMode ? "Exact Match" : "Cookable") : "All"} Recipes`
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
