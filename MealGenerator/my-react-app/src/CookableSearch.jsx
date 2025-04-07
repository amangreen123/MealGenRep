import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ChefHat, Loader2, ScanEye } from "lucide-react"

const CookableSearch = ({ onSearch, ingredients = [], selectedDiet = null, isSearching = false }) => {

    const [cookableOnly, setCookableOnly] = useState(false)
    const [strictMode, setStrictMode] = useState(false)

    const handleSearch = () => {
        onSearch({
            cookableOnly: cookableOnly,
            strictMode: strictMode
        })
    }

    return (
        <Card className="bg-gray-800/50 border-gray-700 mb-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    Search Options
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Cookable Only Toggle */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-base">Cookable Now</Label>
                        <p className="text-sm text-gray-400">
                            {strictMode
                                ? "Only recipes with EXACT ingredient matches"
                                : "Show recipes you can make with your ingredients"}
                        </p>
                    </div>
                    <Switch
                        checked={cookableOnly}
                        onCheckedChange={setCookableOnly}
                    />
                </div>

                {/* Strict Mode Toggle */}
                {cookableOnly && (
                    <div className="flex items-center justify-between pt-2">
                        <div className="space-y-0.5">
                            <Label className="text-base flex items-center gap-2">
                                <ScanEye className="h-4 w-4" />
                                Strict Matching
                            </Label>
                            <p className="text-sm text-gray-400">
                                Require exact ingredient names (e.g. "cheddar cheese" not just "cheddar")
                            </p>
                        </div>
                        <Switch
                            checked={strictMode}
                            onCheckedChange={setStrictMode}
                        />
                    </div>
                )}

                {/* Search Button */}
                <Button
                    onClick={handleSearch}
                    className="w-full gradient-button text-white font-bold py-2 px-4 rounded"
                    disabled={ingredients.length === 0 || isSearching}
                    size="lg"
                >
                    {isSearching ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Searching...
                        </>
                    ) : (
                        `Find ${cookableOnly ? (strictMode ? "Exact Match" : "Cookable") : "All"} Recipes`
                    )}
                </Button>

                {/* Ingredient Count Info */}
                <div className="text-sm text-gray-400 text-center">
                    Searching with {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''}
                    {selectedDiet && ` • ${selectedDiet} diet`}
                </div>
            </CardContent>
        </Card>
    )
}

export default CookableSearch