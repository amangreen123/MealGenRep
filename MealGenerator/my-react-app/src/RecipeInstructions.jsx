"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const RecipeInstructions = ({ instructions, title }) => {
  const [expanded, setExpanded] = useState(false)

  if (!instructions || instructions.length === 0) {
    return (
      <div className="mt-8 border-2 border-gray-700 rounded-3xl p-6 bg-gray-900/50">
        <div className="text-center text-gray-500 font-terminal">No instructions available</div>
      </div>
    )
  }

  return (
    <div className="mt-8 border-2 border-gray-700 rounded-3xl p-6 bg-gray-900/50 shadow-lg shadow-[#ce7c1c]/10 hover:shadow-[#ce7c1c]/20 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-title">
          <span className="text-[#ce7c1c]">INSTRUCTIONS</span>
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-[#ce7c1c] hover:bg-[#ce7c1c]/10"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-5 h-5 mr-1" /> Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5 mr-1" /> Show All
            </>
          )}
        </Button>
      </div>

      <ScrollArea className={expanded ? "h-[400px]" : "max-h-[200px]"}>
        <ol className="list-decimal list-inside space-y-5 font-terminal text-lg px-4">
          {instructions.map((step, index) => (
            <li key={index} className="pl-2 p-3 rounded-xl hover:bg-gray-800/50 transition-colors duration-200">
              {step}
            </li>
          ))}
        </ol>
      </ScrollArea>
    </div>
  )
}

export default RecipeInstructions
