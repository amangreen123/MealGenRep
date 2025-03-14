import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { ChevronLeft, Clock, Users, Scale, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import getDrinkDetails from "@/getDrinkDetails.jsx";

const DrinkIngredientDetails = ({ ingredient, usdaNutrients }) => {

    const drinkData = usdaNutrients[ingredient.name]
    return (
        <div className="bg-gray-700/30 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{ingredient.name}</span>
                <Badge variant="outline">
                    {ingredient.amount} {ingredient.unit}
                </Badge>
            </div>
            {drinkData ? (
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                    <span>Calories: {drinkData.calories} kcal</span>
                    <span>Protein: {drinkData.protein}g</span>
                    <span>Fat: {drinkData.fat}g</span>
                    <span>Carbs: {drinkData.carbs}g</span>
                </div>
            ) : (
                <div className="text-sm text-gray-400">Nutritional info not available</div>
            )}
        </div>
    )

}

const NutritionTabs = ({ recipe, recipeDetails }) => {
    const { macros, usdaNutrients } = recipeDetails
    const allIngredients = [...(recipe.usedIngredients || []), ...(recipe.missedIngredients || [])]

    return (
        <Tabs defaultValue="summary">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold">{Math.round(macros.calories)}</div>
                        <div className="text-sm text-gray-400">Calories</div>
                    </div>
                    <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold">{Math.round(macros.protein)}g</div>
                        <div className="text-sm text-gray-400">Protein</div>
                    </div>
                    <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold">{Math.round(macros.fat)}g</div>
                        <div className="text-sm text-gray-400">Fat</div>
                    </div>
                    <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold">{Math.round(macros.carbs)}g</div>
                        <div className="text-sm text-gray-400">Carbs</div>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="ingredients" className="mt-4">
                <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                        {allIngredients.map((ingredient, index) => (
                            <IngredientDetail key={index} ingredient={ingredient} usdaNutrients={usdaNutrients} />
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>
    )
}

const DrinkDetails = () => {

    
}