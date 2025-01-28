"use client"

import { useState } from "react"
import { PlusCircle, ChefHat } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import axios from "axios"

export default function RecipeBuilder() {
    const [ingredients, setIngredients] = useState([])
    const [newIngredient, setNewIngredient] = useState("")
    const [newAmount, setNewAmount] = useState("")
    const [newUnit, setNewUnit] = useState("")
    const [loading, setLoading] = useState(false)

    const getNutrition = async (ingredient) => {
        const appId = import.meta.env.VITE_APP_ID
        const appKey = import.meta.env.VITE_APP_KEY

        try {
            const response = await axios.get(
                `https://api.edamam.com/api/nutrition-data?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(ingredient)}`
            )
            return response.data
        } catch (error) {
            console.error("Error fetching nutrition data:", error)
            throw new Error("An error occurred while fetching nutrition data.")
        }
    }

    const addIngredient = async () => {
        if (newIngredient && newAmount && newUnit) {
            setLoading(true)
            try {
                const nutritionData = await getNutrition(`${newAmount} ${newUnit} ${newIngredient}`)
                const ingredient = {
                    name: newIngredient,
                    amount: Number.parseFloat(newAmount),
                    unit: newUnit,
                    calories: nutritionData.calories,
                    protein: nutritionData.totalNutrients.PROCNT?.quantity || 0,
                    carbs: nutritionData.totalNutrients.CHOCDF?.quantity || 0,
                    fat: nutritionData.totalNutrients.FAT?.quantity || 0,
                }
                setIngredients([...ingredients, ingredient])
                setNewIngredient("")
                setNewAmount("")
                setNewUnit("")
            } catch (error) {
                console.error("Error adding ingredient:", error)
            } finally {
                setLoading(false)
            }
        }
    }

    const totalMacros = ingredients.reduce(
        (acc, ing) => ({
            calories: Math.round(acc.calories + ing.calories),
            protein: Number((acc.protein + ing.protein).toFixed(1)),
            carbs: Number((acc.carbs + ing.carbs).toFixed(1)),
            fat: Number((acc.fat + ing.fat).toFixed(1)),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return (
        <Card className="card">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ChefHat className="w-6 h-6" />
                    Build Your Recipe
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ingredient"
                            value={newIngredient}
                            onChange={(e) => setNewIngredient(e.target.value)}
                            className="input"
                        />
                        <Input
                            placeholder="Amount"
                            type="number"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            className="input"
                        />
                        <Input placeholder="Unit" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="input" />
                        <Button onClick={addIngredient} className="button" disabled={loading}>
                            <PlusCircle className="w-4 h-4" />
                        </Button>
                    </div>

                    <ScrollArea className="h-[300px] w-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ingredient</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Calories</TableHead>
                                    <TableHead>Protein</TableHead>
                                    <TableHead>Carbs</TableHead>
                                    <TableHead>Fat</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ingredients.map((ing, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{ing.name}</TableCell>
                                        <TableCell>{`${ing.amount} ${ing.unit}`}</TableCell>
                                        <TableCell>{ing.calories}</TableCell>
                                        <TableCell>{ing.protein}g</TableCell>
                                        <TableCell>{ing.carbs}g</TableCell>
                                        <TableCell>{ing.fat}g</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>

                    <div className="p-4 bg-gray-700/50 rounded-md">
                        <h4 className="font-semibold mb-2">Total Macros:</h4>
                        <p>
                            Calories: {totalMacros.calories} |
                            Protein: {totalMacros.protein} g |
                            Carbs: {totalMacros.carbs} g |
                            Fat: {totalMacros.fat} g
                        </p>
                    </div>

                    {/*
                     <Card className="bg-gray-800/50 border-gray-700">
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ChefHat className="w-6 h-6" />
                                Nutrition Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                        </CardContent>
                        </Card>
                        */}
                </div>
            </CardContent>
        </Card>
    )
}