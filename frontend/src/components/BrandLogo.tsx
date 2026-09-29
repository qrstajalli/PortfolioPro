import React from 'react'

interface BrandLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const dim = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-8 w-8' : 'h-7 w-7'
  const svgSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'

  return (
    <div
      className={`relative ${dim} rounded-md bg-[#0a0f1d] border border-[#1e2a3f] flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/10 overflow-hidden ${className}`}
      title="PortfolioPro"
    >
      {/* Signature dual-chevron financial growth monogram */}
      <svg className={svgSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 17L9 11L13 15L21 7"
          stroke="url(#brandGrad)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 7H21V13"
          stroke="#10b981"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="brandGrad" x1="3" y1="17" x2="21" y2="7" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="0.6" stopColor="#6366f1" />
            <stop offset="1" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      {/* Subtle brand top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 opacity-90" />
    </div>
  )
}

export default BrandLogo
