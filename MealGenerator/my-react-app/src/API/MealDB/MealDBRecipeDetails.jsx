import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock, Users, Flame, Zap, Home, Youtube, ChefHat, Search, Tag, Globe, Drumstick, Fish, Leaf, Coffee, CakeSlice, Utensils } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { slugify } from "@/utils/slugify"
import { useRecipeDetails } from "@/hooks/useRecipeDetails"
import { Helmet, HelmetProvider } from 'react-helmet-async'

const MealDBRecipeDetails = () => {
    const { id } = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const state = location.state || {}
    const { meal, userIngredients = [], allRecipes = [], previousPath = "/" } = state

    const recipeId = state.recipeId || meal?.idMeal || id

    // Use the cached hook
    const { getMealDetails, loading, error: fetchError } = useRecipeDetails()

    const [recipeDetails, setRecipeDetails] = useState(null)
    const [error, setError] = useState(null)

    // Default base servings
    const BASE_SERVINGS = 4;
    const [servings, setServings] = useState(BASE_SERVINGS)

    const [baseNutrition, setBaseNutrition] = useState(null)
    const [nutritionInfo, setNutritionInfo] = useState({
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
    })

    useEffect(() => {
        const fetchRecipeData = async () => {
            if (!recipeId) {
                setError("Invalid meal ID")
                return
            }

            try {
                const data = await getMealDetails(recipeId)

                if (data?.meals?.[0]) {
                    const mealData = data.meals[0]
                    setRecipeDetails(mealData)

                    // Determine base nutrition (Mock data if missing)
                    const initialCalories = mealData.nutrition?.perServing?.calories || 500;
                    const initialProtein = mealData.nutrition?.perServing?.protein || 25;
                    const initialFat = mealData.nutrition?.perServing?.fat || 20;
                    const initialCarbs = mealData.nutrition?.perServing?.carbs || 45;

                    const baseNutritionData = {
                        calories: initialCalories,
                        protein: initialProtein,
                        fat: initialFat,
                        carbs: initialCarbs,
                    }
                    setBaseNutrition(baseNutritionData)

                    const initialServings = mealData.nutrition?.servings || BASE_SERVINGS
                    setServings(initialServings)

                    setNutritionInfo({
                        calories: Math.round(baseNutritionData.calories * initialServings),
                        protein: Math.round(baseNutritionData.protein * initialServings),
                        fat: Math.round(baseNutritionData.fat * initialServings),
                        carbs: Math.round(baseNutritionData.carbs * initialServings),
                    })
                } else {
                    setError("Recipe not found")
                }
            } catch (error) {
                console.error("Error fetching recipe:", error)
                setError(error.message || "An error occurred")
            }
        }

        fetchRecipeData()
    }, [recipeId, getMealDetails])

    const handleServingsChange = (newServings) => {
        setServings(newServings)
        if (baseNutrition) {
            setNutritionInfo({
                calories: Math.round(baseNutrition.calories * newServings),
                protein: Math.round(baseNutrition.protein * newServings),
                fat: Math.round(baseNutrition.fat * newServings),
                carbs: Math.round(baseNutrition.carbs * newServings),
            })
        }
    }

    const handleVideoClick = () => {
        if (recipeDetails.strYoutube && recipeDetails.strYoutube !== "") {
            window.open(recipeDetails.strYoutube, "_blank");
        } else {
            const query = encodeURIComponent(`${recipeDetails.strMeal} recipe tutorial`);
            window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank");
        }
    }

    // --- HELPER: Get Icon for Category ---
    const getCategoryIcon = (category) => {
        if (!category) return Tag;
        const c = category.toLowerCase();
        if (c.includes('beef') || c.includes('chicken') || c.includes('lamb') || c.includes('pork') || c.includes('goat')) return Drumstick;
        if (c.includes('seafood') || c.includes('fish')) return Fish;
        if (c.includes('vegan') || c.includes('vegetarian')) return Leaf;
        if (c.includes('breakfast')) return Coffee;
        if (c.includes('dessert')) return CakeSlice;
        return Utensils;
    }

    // --- INGREDIENT SCALER ---
    const getScaledMeasure = (originalMeasure, currentServings) => {
        if (!originalMeasure) return "";
        const ratio = currentServings / BASE_SERVINGS;

        if (Math.abs(ratio - 1) < 0.01) return originalMeasure;

        return originalMeasure.replace(/^([\d\s\/\.]+)/, (match) => {
            try {
                let value = 0;
                const parts = match.trim().split(/\s+/);

                parts.forEach(part => {
                    if (part.includes('/')) {
                        const [num, den] = part.split('/');
                        value += parseFloat(num) / parseFloat(den);
                    } else {
                        value += parseFloat(part);
                    }
                });

                if (isNaN(value)) return match;

                const newValue = value * ratio;
                const formatted = Number.isInteger(newValue)
                    ? newValue.toString()
                    : parseFloat(newValue.toFixed(2));

                return formatted + " ";
            } catch (e) {
                return match;
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center relative z-10">
                <div className="text-center">
                    <div className="text-[#ce7c1c] text-3xl font-title animate-pulse">Loading recipe details...</div>
                </div>
            </div>
        )
    }

    if (error || fetchError || !recipeDetails) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center relative z-10">
                <div className="text-center">
                    <div className="text-[#f5efe4] text-xl font-sans mb-4">
                        {error || fetchError || "Recipe not found"}
                    </div>
                    <Button
                        onClick={() => navigate(previousPath)}
                        className="bg-[#ce7c1c] text-white hover:bg-[#b56a15] font-bold rounded-full"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        )
    }

    // Extract & Scale Ingredients
    const ingredients = []
    for (let i = 1; i <= 20; i++) {
        const ingredient = recipeDetails[`strIngredient${i}`]
        const rawMeasure = recipeDetails[`strMeasure${i}`]

        if (ingredient && ingredient.trim() !== "") {
            const scaledMeasure = getScaledMeasure(rawMeasure || "To taste", servings);
            ingredients.push({ name: ingredient, measure: scaledMeasure })
        }
    }

    const userIngredientsNormalized = userIngredients.map((ing) => ing.toLowerCase().trim())
    const pantryItems = ingredients.filter((item) =>
        userIngredientsNormalized.includes(item.name.toLowerCase().trim())
    )
    const shoppingListItems = ingredients.filter(
        (item) => !userIngredientsNormalized.includes(item.name.toLowerCase().trim())
    )

    const instructionSteps = recipeDetails.strInstructions
        ? recipeDetails.strInstructions
            .split(/\.\s+/)
            .filter((step) => step.trim())
            .map((step) => step.trim() + (step.endsWith(".") ? "" : "."))
        : ["No instructions available."];

    const currentIndex = allRecipes.findIndex((r) => r.idMeal === recipeDetails.idMeal)
    const totalRecipes = allRecipes.length
    const hasPrevious = currentIndex > 0
    const hasNext = currentIndex < totalRecipes - 1

    const navigateToRecipe = (direction) => {
        const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1
        if (newIndex >= 0 && newIndex < totalRecipes) {
            const newRecipe = allRecipes[newIndex]
            navigate(`/mealdb-recipe/${slugify(newRecipe.strMeal)}`, {
                state: {
                    meal: newRecipe,
                    userIngredients,
                    allRecipes,
                    previousPath,
                    recipeId: newRecipe.idMeal,
                },
            })
        }
    }

    const relatedRecipes = allRecipes.filter((r) => r.idMeal !== recipeDetails.idMeal).slice(0, 3)
    const hasDirectVideo = recipeDetails.strYoutube && recipeDetails.strYoutube !== "";

    // Prepare Icon for Main Header
    const MainCategoryIcon = getCategoryIcon(recipeDetails.strCategory);

    return (
        <HelmetProvider>
            {/* ADDED 'relative z-10' TO FIX BACKGROUND OVERLAP */}
            <div className="min-h-screen bg-transparent text-[#f5efe4] font-sans selection:bg-[#ce7c1c] selection:text-white relative z-10">

                <Helmet>
                    <title>{recipeDetails.strMeal} | Meal Forger</title>
                    <meta name="description" content={`Learn how to cook ${recipeDetails.strMeal}.`} />
                    <link rel="canonical" href={`https://mealforger.com/mealdb-recipe/${slugify(recipeDetails.strMeal)}`} />
                </Helmet>

                {/* Top Navigation - Updated BG Opacity */}
                <div className="bg-[#131415]/90 border-b border-gray-800/50 sticky top-0 z-50 backdrop-blur-md">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => navigate(previousPath)}
                                    className="text-gray-400 hover:text-[#ce7c1c] hover:bg-transparent font-sans font-medium text-sm transition-all duration-300 px-0 flex items-center gap-2"
                                >
                                    <Home className="w-5 h-5" />
                                    Back to Menu
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => navigateToRecipe("prev")}
                                    disabled={!hasPrevious}
                                    className="flex border-2 border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-700 bg-transparent font-bold rounded-full px-3 md:px-6 py-2 text-sm transition-all duration-300"
                                >
                                    <ChevronLeft className="w-4 h-4 md:mr-1" />
                                    <span className="hidden md:inline">Previous</span>
                                </Button>
                            </div>

                            {totalRecipes > 1 && (
                                <div className="text-gray-500 font-sans text-xs uppercase tracking-widest hidden sm:block">
                                    Recipe {currentIndex + 1} of {totalRecipes}
                                </div>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => navigateToRecipe("next")}
                                disabled={!hasNext}
                                className="border-2 border-[#ce7c1c] text-[#ce7c1c] hover:bg-[#ce7c1c] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-700 bg-transparent font-bold rounded-full px-6 py-2 text-sm transition-all duration-300"
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        <div className="lg:col-span-2 space-y-8">
                            <div>
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-title mb-4 leading-tight">
                                    <span className="text-[#ce7c1c]">{recipeDetails.strMeal}</span>
                                </h1>

                                {/* --- MAIN PREMIUM TAGS --- */}
                                <div className="flex flex-wrap gap-3 mb-6">
                                    {recipeDetails.strCategory && (
                                        <div className="flex items-center gap-2 bg-[#ce7c1c]/10 border border-[#ce7c1c]/30 text-[#ce7c1c] px-4 py-1.5 rounded-full shadow-sm shadow-orange-900/10">
                                            <MainCategoryIcon className="w-4 h-4" />
                                            <span className="font-bold text-sm tracking-wide uppercase font-title">{recipeDetails.strCategory}</span>
                                        </div>
                                    )}
                                    {recipeDetails.strArea && (
                                        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full shadow-sm shadow-blue-900/10">
                                            <Globe className="w-4 h-4" />
                                            <span className="font-bold text-sm tracking-wide uppercase font-title">{recipeDetails.strArea}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-800 group">
                                <img
                                    src={recipeDetails.strMealThumb || "/placeholder.svg"}
                                    alt={recipeDetails.strMeal}
                                    className="w-full h-[300px] sm:h-[400px] md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6 sm:p-8">
                                    <div className="flex flex-wrap items-center gap-8 text-white">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#ce7c1c] p-2 rounded-full text-white">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase">Time</p>
                                                <p className="font-sans font-bold text-lg">~30 min</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#ce7c1c] p-2 rounded-full text-white">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase">Serves</p>
                                                <p className="font-sans font-bold text-lg">{servings} ppl</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-[#ce7c1c] p-2 rounded-full text-white">
                                                <Flame className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase">Calories</p>
                                                <p className="font-sans font-bold text-lg">{nutritionInfo.calories}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Nutrition Card */}
                            <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-lg">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold font-title">
                                        <span className="text-[#ce7c1c]">NUTRITION</span> FACTS
                                    </h2>
                                    <div className="text-sm font-sans text-gray-400 bg-gray-900 px-3 py-1 rounded-lg border border-gray-800">
                                        Per Serving: <span className="text-white font-bold">{Math.round(nutritionInfo.calories / servings)} kcal</span>
                                    </div>
                                </div>

                                <div className="mb-8 bg-[#0a0b0c] border border-gray-800 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">SERVINGS</label>
                                        <span className="text-3xl font-bold font-title text-[#ce7c1c]">{servings}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="12"
                                        value={servings}
                                        onChange={(e) => handleServingsChange(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ce7c1c]"
                                    />
                                    <div className="flex justify-between mt-3 text-xs font-sans text-gray-500 font-medium">
                                        <span>1</span>
                                        <span>6</span>
                                        <span>12</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
                                        <Flame className="w-6 h-6 text-[#ce7c1c] mx-auto mb-2" />
                                        <div className="text-2xl font-bold font-sans text-white">{nutritionInfo.calories}</div>
                                        <div className="text-xs font-bold text-gray-500 uppercase">Calories</div>
                                    </div>
                                    <div className="text-center p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
                                        <Zap className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                        <div className="text-2xl font-bold font-sans text-white">{nutritionInfo.protein}g</div>
                                        <div className="text-xs font-bold text-gray-500 uppercase">Protein</div>
                                    </div>
                                    <div className="text-center p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
                                        <div className="w-6 h-6 text-yellow-500 font-bold mx-auto mb-2 flex items-center justify-center">C</div>
                                        <div className="text-2xl font-bold font-sans text-white">{nutritionInfo.carbs}g</div>
                                        <div className="text-xs font-bold text-gray-500 uppercase">Carbs</div>
                                    </div>
                                    <div className="text-center p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
                                        <div className="w-6 h-6 text-orange-500 font-bold mx-auto mb-2 flex items-center justify-center">F</div>
                                        <div className="text-2xl font-bold font-sans text-white">{nutritionInfo.fat}g</div>
                                        <div className="text-xs font-bold text-gray-500 uppercase">Fat</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-lg">
                                <h2 className="text-2xl font-bold font-title mb-8 flex items-center gap-3">
                                    <ChefHat className="text-[#ce7c1c] w-8 h-8" />
                                    <span className="text-white">INSTRUCTIONS</span>
                                </h2>

                                <div className="space-y-8 mb-8">
                                    {instructionSteps.map((step, index) => (
                                        <div key={index} className="flex gap-4 sm:gap-6 group">
                                            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gray-800 border border-gray-700 text-[#ce7c1c] rounded-full flex items-center justify-center shadow-lg group-hover:border-[#ce7c1c] transition-colors">
                                                <span className="font-sans text-lg font-bold">{index + 1}</span>
                                            </div>
                                            <p className="font-sans text-base sm:text-lg text-gray-300 leading-8 pt-1 sm:pt-2">
                                                {step}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-8 border-t border-gray-800">
                                    <Button
                                        onClick={handleVideoClick}
                                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold font-sans py-6 px-8 rounded-xl shadow-lg flex items-center justify-center gap-3 text-lg transition-transform hover:-translate-y-1"
                                    >
                                        {hasDirectVideo ? <Youtube className="w-6 h-6" /> : <Search className="w-6 h-6" />}
                                        {hasDirectVideo ? "Watch Video Tutorial" : "Search on YouTube"}
                                    </Button>
                                </div>

                            </div>
                        </div>

                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 shadow-lg">
                                <h3 className="text-xl font-bold font-title mb-4">
                                    <span className="text-[#ce7c1c]">MY</span> PANTRY
                                </h3>
                                {pantryItems.length > 0 ? (
                                    <>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {pantryItems.map((item, index) => (
                                                <Badge
                                                    key={index}
                                                    className="bg-green-900/30 text-green-400 border-green-900 font-sans text-xs px-3 py-1.5 rounded-full"
                                                >
                                                    ✓ {item.name} {item.measure && `(${item.measure.trim()})`}
                                                </Badge>
                                            ))}
                                        </div>
                                        <p className="text-sm font-sans text-gray-400">
                                            You have <span className="text-green-500 font-bold">{pantryItems.length}</span> ingredients ready.
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-sm font-sans text-gray-500 bg-gray-900/50 px-4 py-3 rounded-xl border border-dashed border-gray-800">
                                        No ingredients from your pantry matched.
                                    </p>
                                )}
                            </div>

                            <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 shadow-lg">
                                <h3 className="text-xl font-bold font-title mb-4">
                                    <span className="text-[#ce7c1c]">SHOPPING</span> LIST
                                </h3>
                                {shoppingListItems.length > 0 ? (
                                    <ScrollArea className="h-[400px] pr-4">
                                        <div className="space-y-3">
                                            {shoppingListItems.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="group bg-gray-900/50 border border-gray-800 rounded-xl px-4 py-3 hover:border-[#ce7c1c]/50 transition-colors duration-200 flex justify-between items-center"
                                                >
                                                    <div className="font-sans font-medium text-gray-200">{item.name}</div>
                                                    {item.measure && item.measure.trim() !== "" && (
                                                        <div className="text-[#ce7c1c] text-sm font-bold font-sans">{item.measure}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                ) : (
                                    <div className="text-center py-8 bg-green-900/10 rounded-2xl border border-green-900/30">
                                        <p className="text-green-500 font-bold font-sans">You have everything!</p>
                                    </div>
                                )}
                            </div>

                            {/* --- SIDEBAR RELATED RECIPES --- */}
                            {relatedRecipes.length > 0 && (
                                <div className="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 shadow-lg">
                                    <h3 className="text-xl font-bold font-title mb-6">
                                        YOU MIGHT <span className="text-[#ce7c1c]">ALSO LIKE</span>
                                    </h3>
                                    <div className="space-y-4">
                                        {relatedRecipes.map((recipe) => {
                                            // Get Icon for Sidebar Item
                                            const SideIcon = getCategoryIcon(recipe.strCategory);

                                            return (
                                                <div
                                                    key={recipe.idMeal}
                                                    className="flex items-center gap-4 cursor-pointer hover:bg-gray-800 p-3 rounded-2xl transition-all duration-200 group border border-transparent hover:border-gray-700"
                                                    onClick={() =>
                                                        navigate(`/mealdb-recipe/${slugify(recipe.strMeal)}`, {
                                                            state: {
                                                                meal: recipe,
                                                                userIngredients,
                                                                allRecipes,
                                                                previousPath,
                                                                recipeId: recipe.idMeal,
                                                            },
                                                        })
                                                    }
                                                >
                                                    <img
                                                        src={recipe.strMealThumb || "/placeholder.svg"}
                                                        alt={recipe.strMeal}
                                                        className="w-16 h-16 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold font-sans text-gray-200 group-hover:text-[#ce7c1c] line-clamp-2 mb-2">
                                                            {recipe.strMeal}
                                                        </h4>

                                                        {/* --- UPDATED SIDEBAR TAGS WITH ICONS --- */}
                                                        <div className="flex flex-wrap gap-2">
                                                            {recipe.strCategory && (
                                                                <div className="flex items-center gap-1 bg-[#ce7c1c]/10 text-[#ce7c1c] px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-[#ce7c1c]/20">
                                                                    <SideIcon className="w-3 h-3" />
                                                                    {recipe.strCategory}
                                                                </div>
                                                            )}
                                                            {recipe.strArea && (
                                                                <div className="flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border border-blue-500/20">
                                                                    <Globe className="w-3 h-3" />
                                                                    {recipe.strArea}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </HelmetProvider>
    )
}

export default MealDBRecipeDetails