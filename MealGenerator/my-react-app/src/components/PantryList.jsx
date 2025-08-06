import { X } from 'lucide-react'

export default function PantryList({ ingredients, onRemove }) {
    return (
        <div className="bg-gray-900/50 rounded-2xl border border-gray-700 p-4 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
            <h2 className="text-xl md:text-2xl font-bold mb-3 font-title text-center">
                <span className="text-[#ce7c1c]">MY</span> <span className="text-white">PANTRY</span>
            </h2>
            <div className="min-h-[80px] flex flex-wrap gap-2">
                {ingredients.length === 0 ? (
                    <div className="text-center py-3 w-full">
                        <p className="text-gray-400 font-terminal text-sm">YOU HAVE NOT ADDED ANY INGREDIENTS</p>
                        <p className="text-gray-500 font-terminal text-xs mt-1">
                            Add ingredients using the search bar above or quick add buttons
                        </p>
                    </div>
                ) : (
                    ingredients.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center bg-gray-800/70 border border-gray-600 rounded-full py-1.5 pl-3 pr-1.5 hover:bg-gray-700/70 hover:border-[#ce7c1c]/50 transition-all duration-200 shadow-sm"
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
