import { X } from "lucide-react";


export default function PantryList({ingredients, onRemove}) {
    import { X } from "lucide-react"

    export default function PantryList({ ingredients, onRemove }) {
        return (
            <div className="bg-gray-900/50 rounded-3xl border border-gray-700 p-4 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300 mb-4 md:mb-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 font-title text-center">
                    <span className="text-[#ce7c1c]">MY</span> <span className="text-white">PANTRY</span>
                </h2>
                <div className="min-h-[120px] flex flex-wrap gap-2 mb-2">
                    {ingredients.length === 0 ? (
                        <div className="text-center py-4 w-full">
                            <p className="text-gray-400 font-terminal text-sm md:text-base">YOU HAVE NOT ADDED ANY INGREDIENTS</p>
                            <p className="text-gray-500 font-terminal text-xs mt-2">
                                Add ingredients using the search bar above or quick add buttons
                            </p>
                        </div>
                    ) : (
                        ingredients.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center bg-gray-800/70 border border-gray-600 rounded-full py-2 pl-4 pr-2 hover:bg-gray-700/70 hover:border-[#ce7c1c]/50 transition-all duration-200 shadow-sm"
                            >
                                <span className="font-terminal text-sm text-white mr-2">{item}</span>
                                <button
                                    onClick={() => onRemove(item)}
                                    className="ml-auto text-[#ce7c1c] hover:text-white bg-gray-700/50 hover:bg-[#ce7c1c] rounded-full p-1 transition-all duration-200 flex items-center justify-center"
                                    aria-label={`Remove ${item}`}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )
    }
}




    
    
    