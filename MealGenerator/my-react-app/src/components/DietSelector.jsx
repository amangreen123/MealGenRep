import {Button} from "@/components/ui/button.tsx";

export default function DietSelector ({selectedDiet, setSelectedDiet}){
    
    return(
        <div>
            <div className="md:col-span-3 order-3">
                <div className="p-4 h-full flex flex-col">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 font-title text-center">
                        <span className="text-[#ce7c1c]">MY</span> <span className="text-white">DIET</span>
                    </h2>
                    <div className="flex flex-col space-y-2 md:space-y-3 flex-grow">
                        {["KETOGENIC", "PALEO", "GLUTEN FREE", "VEGAN", "VEGETARIAN"].map((diet, index) => {
                            const dietValue = diet.toLowerCase().replace(" ", "-")
                            return (
                                <Button
                                    key={index}
                                    className={`py-2 font-title diet-button border-2 ${
                                        selectedDiet === dietValue
                                            ? "bg-[#ce7c1c] text-white border-[#ce7c1c] font-bold shadow-md shadow-[#ce7c1c]/30"
                                            : "bg-transparent hover:bg-[#ce7c1c]/20 text-white border-[#ce7c1c] font-bold"
                                    } rounded-2xl md:rounded-3xl cursor-pointer text-sm md:text-base transform hover:scale-[1.02] transition-all duration-300`}
                                    onClick={() => setSelectedDiet(selectedDiet === dietValue ? null : dietValue)}
                                >
                                    {diet}
                                </Button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}