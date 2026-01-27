import React from 'react';

const CircularMatchIndicator = ({
                                    matchPercentage,
                                    canCook = false,
                                    size = 'md' // 'sm', 'md', 'lg'
                                }) => {
    // Size configurations - INCREASED FONT SIZES
    const sizeConfig = {
        sm: {
            width: 40,
            height: 40,
            strokeWidth: 3,
            fontSize: 'text-[12px]',   // Was 8px
            percentSize: 'text-[9px]', // Was 6px
            iconSize: 14
        },
        md: {
            width: 56,
            height: 56,
            strokeWidth: 4,
            fontSize: 'text-[16px]',   // Was 10px
            percentSize: 'text-[11px]',// Was 6px
            iconSize: 22
        },
        lg: {
            width: 72,
            height: 72,
            strokeWidth: 5,
            fontSize: 'text-[22px]',   // Was xs
            percentSize: 'text-[14px]',// Was 6px
            iconSize: 32
        }
    };

    const config = sizeConfig[size];
    const radius = (config.width - config.strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(Math.max(matchPercentage || 0, 0), 100);
    const offset = circumference - (percentage / 100) * circumference;

    // Color based on percentage
    const getColor = () => {
        if (canCook || percentage === 100) {
            return {
                stroke: '#10b981', // green-500
                text: 'text-green-500',
                glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
            };
        }
        if (percentage >= 75) {
            return {
                stroke: '#eab308', // yellow-500
                text: 'text-yellow-500',
                glow: 'drop-shadow-[0_0_6px_rgba(234,179,8,0.4)]'
            };
        }
        if (percentage >= 50) {
            return {
                stroke: '#f97316', // orange-500
                text: 'text-orange-500',
                glow: 'drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]'
            };
        }
        return {
            stroke: '#ef4444', // red-500
            text: 'text-red-500',
            glow: 'drop-shadow-[0_0_6px_rgba(239,68,68,0.4)]'
        };
    };

    const colors = getColor();

    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: config.width, height: config.height }}
        >
            {/* Background Circle */}
            <svg
                width={config.width}
                height={config.height}
                className="transform -rotate-90"
            >
                {/* Background track */}
                <circle
                    cx={config.width / 2}
                    cy={config.height / 2}
                    r={radius}
                    stroke="rgba(75, 85, 99, 0.3)" // gray-600 with opacity
                    strokeWidth={config.strokeWidth}
                    fill="none"
                />

                {/* Progress circle with glow */}
                <circle
                    cx={config.width / 2}
                    cy={config.height / 2}
                    r={radius}
                    stroke={colors.stroke}
                    strokeWidth={config.strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`transition-all duration-700 ease-out ${colors.glow}`}
                    style={{
                        filter: canCook ? 'drop-shadow(0 0 8px rgba(16,185,129,0.6))' : 'none'
                    }}
                />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {canCook ? (
                    // Checkmark for perfect match
                    <svg
                        width={config.iconSize}
                        height={config.iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        className={colors.text}
                    >
                        <path
                            d="M20 6L9 17L4 12"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                ) : (
                    // Percentage text - Flex row ensures alignment
                    <div className="flex items-baseline justify-center">
                        <span className={`${config.fontSize} font-bold font-terminal ${colors.text} leading-none`}>
                          {Math.round(percentage)}
                        </span>
                        <span className={`${config.percentSize} font-terminal ${colors.text} ml-[1px]`}>
                          %
                        </span>
                    </div>
                )}
            </div>

            {/* Pulsing animation for perfect matches */}
            {canCook && (
                <div
                    className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"
                    style={{ animationDuration: '2s' }}
                />
            )}
        </div>
    );
};

export default CircularMatchIndicator;