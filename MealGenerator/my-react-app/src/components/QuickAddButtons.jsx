import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import {
    GiCarrot,
    GiCheeseWedge,
    GiCupcake,
    GiFishCooked,
    GiFruitBowl,
    GiRoastChicken,
    GiSlicedBread,
    GiSteak,
} from "react-icons/gi"

const popularIngredients = [
    {
        name: "Dessert",
        icon: GiCupcake,
        color: "text-yellow-400 group-hover:text-yellow-500",
    },
    {
        name: "Bread",
        icon: GiSlicedBread,
        color: "text-amber-600 group-hover:text-amber-700",
    },
    {
        name: "Vegetables",
        icon: GiCarrot,
        color: "text-green-800 group-hover:text-green-600",
    },
    {
        name: "Beef",
        icon: GiSteak,
        color: "text-red-500 group-hover:text-red-600",
    },
    {
        name: "Fish",
        icon: GiFishCooked,
        color: "text-blue-400 group-hover:text-blue-500",
    },
    {
        name: "Cheese",
        icon: GiCheeseWedge,
        color: "text-yellow-300 group-hover:text-yellow-400",
    },
    {
        name: "Fruit",
        icon: GiFruitBowl,
        color: "text-pink-500 group-hover:text-pink-600",
    },
    {
        name: "Chicken",
        icon: GiRoastChicken,
        color: "text-orange-400 group-hover:text-orange-500",
    },
]

const categoryIngredients = {
    Dessert: {
        mealDB: ["Chocolate", "Honey", "Vanilla"],
        spoonacular: ["Cocoa Powder", "Custard", "Whipped Cream"],
    },
    Bread: {
        mealDB: ["Baguette", "Ciabatta", "Pita"],
        spoonacular: ["Whole Wheat Bread", "Rye Bread", "Sourdough Bread"],
    },
    Vegetables: {
        mealDB: ["Carrot", "Broccoli", "Zucchini"],
        spoonacular: ["Spinach", "Kale", "Bell Pepper"],
    },
    Beef: {
        mealDB: ["Beef", "Beef Brisket", "Beef Fillet"],
        spoonacular: ["Ground Beef", "Sirloin Steak", "Beef Ribs"],
    },
    Fish: {
        mealDB: ["Salmon", "Tuna", "Cod"],
        spoonacular: ["Haddock", "Mackerel", "Tilapia"],
    },
    Cheese: {
        mealDB: ["Cheddar Cheese", "Mozzarella Cheese", "Feta Cheese"],
        spoonacular: ["Parmesan Cheese", "Gorgonzola Cheese", "Goat Cheese"],
    },
    Fruit: {
        mealDB: ["Apple", "Banana", "Strawberries"],
        spoonacular: ["Mango", "Peach", "Pineapple"],
    },
    Chicken: {
        mealDB: ["Chicken", "Chicken Breast", "Chicken Thighs"],
        spoonacular: ["Chicken Wings", "Rotisserie Chicken", "Chicken Drumsticks"],
    },
}

export default function QuickAddButtons({ onQuickSearch, categoryDialogOpen, setCategoryDialogOpen, selectedCategory, onCategorySearch }) {
    return (
        <>
        
                <h3 className="text-2xl md:text-3xl font-bold mb-6 font-title text-center">
                    <span className="text-white">QUICK</span> <span className="text-[#ce7c1c]">ADD</span>
                </h3>
                <div className="grid grid-rows-2 grid-cols-4 gap-2 max-w-xs mx-auto">
                    {popularIngredients.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => onQuickSearch(item.name)}
                            className="flex items-center justify-center h-16 w-16 bg-gray-900/70 border-2 border-white hover:border-[#ce7c1c] rounded-full cursor-pointer group transition-all duration-300 transform hover:scale-110 hover:bg-gray-800/80 relative mx-auto"
                            aria-label={`Quick add ${item.name}`}
                            title={item.name}
                        >
                            <item.icon className={`w-8 h-8 ${item.color} transition-all duration-300`} />
                            <span className="sr-only">{item.name}</span>
                            <div className="absolute -bottom-1 opacity-0 group-hover:opacity-100 group-hover:bottom-1 transition-all duration-300 text-[10px] font-terminal text-white bg-gray-900/90 px-2 py-0.5 rounded-full">
                                {item.name}
                            </div>
                        </button>
                    ))}
                </div>

            {/* Category Selection Dialog */}
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent className="bg-[#1e1e1e] border border-[#ce7c1c] text-white max-w-[90vw] md:max-w-md rounded-2xl shadow-2xl mx-auto">
                    <DialogTitle className="text-center text-lg font-title mb-2 text-[#ce7c1c]">
                        {selectedCategory} Recipes
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-300 mb-4 font-terminal text-sm">
                        Would you like to search for a specific {selectedCategory} ingredient or let us choose for you?
                    </DialogDescription>

                    <div className="space-y-4">
                        <Button
                            variant="default"
                            onClick={() => onCategorySearch(selectedCategory)}
                            className="w-full py-3 text-base font-terminal font-bold bg-[#ce7c1c] hover:bg-[#ce7c1c]/80 rounded-full transform hover:scale-105 transition-all duration-300"
                        >
                            Surprise Me
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-700" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-2 bg-[#1e1e1e] text-xs text-gray-400 uppercase">OR CHOOSE SPECIFIC</span>
                            </div>
                        </div>

                        {selectedCategory && categoryIngredients[selectedCategory] && (
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    ...categoryIngredients[selectedCategory].mealDB,
                                    ...categoryIngredients[selectedCategory].spoonacular,
                                ].map((ingredient) => (
                                    <Button
                                        key={ingredient}
                                        variant="outline"
                                        onClick={() => onCategorySearch(ingredient)}
                                        className="py-2 text-sm font-terminal hover:bg-[#ce7c1c]/20 border-[#ce7c1c] text-white rounded-xl transform hover:scale-105 transition-all duration-300"
                                    >
                                        {ingredient}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
