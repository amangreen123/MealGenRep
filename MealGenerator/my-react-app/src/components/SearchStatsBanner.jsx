import React from 'react';
import { CheckCircle, Search, Filter } from 'lucide-react';

const SearchStatsBanner = ({ searchStats }) => {
    const { totalResults, perfectMatches, searchMode, dietFilter } = searchStats;

    if (totalResults === 0) return null;

    return (
        <div className="mb-6 p-4 bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] border-2 border-gray-800 rounded-2xl shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Left Side - Results Count */}
                <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-[#ce7c1c]" />
                    <div>
                        <p className="font-terminal text-sm text-gray-400">
                            Found <span className="text-[#ce7c1c] font-bold text-lg">{totalResults}</span>{' '}
                            {totalResults === 1 ? 'recipe' : 'recipes'}
                        </p>
                    </div>
                </div>

                {/* Center - Perfect Matches (if any) */}
                {perfectMatches > 0 && (
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-terminal text-sm text-green-500 font-bold">
              {perfectMatches} you can cook now!
            </span>
                    </div>
                )}

                {/* Right Side - Active Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {searchMode === 'exact' && (
                        <span className="inline-flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-3 py-1 rounded-full text-xs font-terminal">
              <Filter className="w-3 h-3" />
              Exact Match
            </span>
                    )}
                    {dietFilter && (
                        <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 text-blue-500 px-3 py-1 rounded-full text-xs font-terminal capitalize">
              <Filter className="w-3 h-3" />
                            {dietFilter}
            </span>
                    )}
                </div>
            </div>

            {/* Bottom - Helpful Message */}
            {searchMode === 'general' && perfectMatches === 0 && totalResults > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs font-terminal text-gray-500">
                        💡 Tip: Toggle "Exact Match" to see only recipes you can make right now
                    </p>
                </div>
            )}

            {searchMode === 'exact' && totalResults === 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs font-terminal text-gray-500">
                        💡 Tip: No exact matches found. Try "General Search" to see recipes with partial matches
                    </p>
                </div>
            )}
        </div>
    );
};

export default SearchStatsBanner;