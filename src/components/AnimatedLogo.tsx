'use client';

import { useState, useEffect } from 'react';

interface AnimatedLogoProps {
  size?: number;
  color?: string;
  onAnimationComplete?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
}

export default function AnimatedLogo({ 
  size = 200, 
  color = '#3B82F6', 
  onAnimationComplete,
  autoPlay = true,
  loop = false 
}: AnimatedLogoProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  const startAnimation = () => {
    setIsAnimating(true);
    setAnimationKey(prev => prev + 1);
  };

  const handleAnimationEnd = () => {
    setIsAnimating(false);
    onAnimationComplete?.();
  };

  useEffect(() => {
    if (autoPlay) {
      startAnimation();
    }
  }, [autoPlay]);

  // SVG boyutları
  const width = size;
  const height = size * 0.4; // Logo oranı
  const strokeWidth = Math.max(2, size / 50);

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        viewBox="0 0 400 160"
        className="cursor-pointer"
        onClick={startAnimation}
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="25%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="75%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>

        {/* cicekgo animasyonu */}
        <g key={animationKey}>
          {/* c harfi */}
          <path
            d="M 20 80 Q 20 60 40 60 Q 60 60 60 80 Q 60 100 40 100 Q 20 100 20 80"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray="120"
            strokeDashoffset="120"
            className={`transition-all duration-800 ${
              isAnimating ? 'animate-drawText' : 'opacity-0'
            }`}
          />

          {/* i harfi */}
          <line
            x1="80"
            y1="60"
            x2="80"
            y2="100"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray="40"
            strokeDashoffset="40"
            className={`transition-all duration-600 delay-800 ${
              isAnimating ? 'animate-drawText' : 'opacity-0'
            }`}
          />
          <circle
            cx="80"
            cy="50"
            r="3"
            fill={color}
            className={`transition-all duration-300 delay-1400 ${
              isAnimating ? 'animate-fadeIn' : 'opacity-0'
            }`}
          />

          {/* c harfi (ikinci) */}
          <path
            d="M 100 80 Q 100 60 120 60 Q 140 60 140 80 Q 140 100 120 100 Q 100 100 100 80"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray="120"
            strokeDashoffset="120"
            className={`transition-all duration-800 delay-1200 ${
              isAnimating ? 'animate-drawText' : 'opacity-0'
            }`}
          />

          {/* e harfi */}
          <path
            d="M 160 60 L 180 60 Q 200 60 200 80 Q 200 100 180 100 L 160 100 M 160 80 L 200 80"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray="100"
            strokeDashoffset="100"
            className={`transition-all duration-800 delay-1600 ${
              isAnimating ? 'animate-drawText' : 'opacity-0'
            }`}
          />

          {/* k harfi */}
          <g className={`transition-all duration-800 delay-2000 ${
            isAnimating ? 'animate-drawK' : 'opacity-0'
          }`}>
            <line
              x1="220"
              y1="60"
              x2="220"
              y2="100"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="40"
              strokeDashoffset="40"
            />
            <line
              x1="220"
              y1="80"
              x2="240"
              y2="60"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="25"
              strokeDashoffset="25"
            />
            <line
              x1="220"
              y1="80"
              x2="240"
              y2="100"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="25"
              strokeDashoffset="25"
            />
          </g>

          {/* g harfi - Kapanma animasyonu */}
          <g className={`transition-all duration-1000 delay-2400 ${
            isAnimating ? 'animate-drawG' : 'opacity-0'
          }`}>
            <path
              d="M 260 80 Q 260 60 280 60 Q 300 60 300 80 Q 300 100 280 100 Q 260 100 260 80"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="120"
              strokeDashoffset="120"
            />
            <line
              x1="280"
              y1="100"
              x2="280"
              y2="120"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="20"
              strokeDashoffset="20"
            />
            <path
              d="M 260 120 Q 280 120 300 120"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="40"
              strokeDashoffset="40"
            />
          </g>

          {/* o harfi (kadran) */}
          <circle
            cx="360"
            cy="80"
            r="25"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray="157"
            strokeDashoffset="157"
            className={`transition-all duration-1200 delay-3200 ${
              isAnimating ? 'animate-drawCircle' : 'opacity-0'
            }`}
          />

          {/* g harfinin o'ya kapanma animasyonu */}
          <g className={`transition-all duration-800 delay-4400 ${
            isAnimating ? 'animate-closeToCircle' : 'opacity-0'
          }`}>
            <path
              d="M 300 80 Q 320 80 335 80"
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="35"
              strokeDashoffset="35"
              className="animate-drawConnection"
            />
          </g>
        </g>
      </svg>

      {/* Hover efekti */}
      <div 
        className="absolute inset-0 bg-transparent hover:bg-blue-50 hover:bg-opacity-20 rounded-lg transition-all duration-300"
        onClick={startAnimation}
      />

      {/* Animasyon tamamlandığında callback */}
      {isAnimating && (
        <div 
          className="hidden"
          onAnimationEnd={handleAnimationEnd}
        />
      )}
    </div>
  );
}
