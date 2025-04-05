import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ChefHat, Loader2 } from "lucide-react"


const CookableSearch = ({ onSearch, ingredients = [], selectedDiet = null, isSearching = false }) => {
    
    const [cookableOnly, setCookableOnly] = useState(false)
    
    const handleSearch = () => {
        onSearch({
            cookableOnly: cookableOnly,
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
                        <p className="text-sm text-gray-400">Only show recipes you can make with your ingredients</p>
                    </div>
                    <Switch checked={cookableOnly} onCheckedChange={setCookableOnly} />
                </div>

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
                        `Find ${cookableOnly ? "Cookable" : "All"} Recipes`
                    )}
                </Button>

                {/* Ingredient Count Info */}
                <div className="text-sm text-gray-400 text-center">
                    Searching with {ingredients.length} ingredients
                    {selectedDiet && ` • ${selectedDiet} diet`}
                </div>
            </CardContent>
        </Card>
    )
}

export default CookableSearch