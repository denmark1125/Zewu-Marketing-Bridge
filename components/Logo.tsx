
import React from 'react';

interface LogoProps {
  className?: string;
  color?: string;
}

/**
 * 澤物設計 Zewu Interior Design 官方向量 Logo
 * 此版本為高品質向量圖，適配任何解析度
 */
export const ZewuBrandLogo: React.FC<LogoProps> = ({ 
  className = "w-full h-full", 
  color = "currentColor" 
}) => (
  <svg 
    viewBox="0 0 100 160" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    {/* 外框矩形 - 象徵空間與結構 */}
    <rect 
      x="25" 
      y="10" 
      width="50" 
      height="85" 
      stroke={color} 
      strokeWidth="1.1" 
      rx="0.5" 
    />
    
    {/* 內部波浪線條 - 象徵「澤」的水元素與設計流動感 */}
    <g stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M 25 62 C 30 58, 45 66, 50 62 C 55 58, 70 66, 75 62" />
      <path d="M 25 70 C 30 66, 45 74, 50 70 C 55 66, 70 74, 75 70" />
      <path d="M 25 78 C 30 74, 45 82, 50 78 C 55 74, 70 82, 75 78" />
      <path d="M 25 86 C 30 82, 45 90, 50 86 C 55 82, 70 90, 75 86" />
    </g>
    
    {/* 中文品牌字 */}
    <text 
      x="50" 
      y="130" 
      textAnchor="middle" 
      fill={color} 
      style={{ fontSize: '16px', fontWeight: 300, letterSpacing: '0.25em', fontFamily: 'sans-serif' }}
    >
      澤物設計
    </text>
    
    {/* 英文品牌字 */}
    <text 
      x="50" 
      y="150" 
      textAnchor="middle" 
      fill={color} 
      style={{ fontSize: '6.5px', fontWeight: 300, letterSpacing: '0.12em', fontFamily: 'sans-serif' }}
    >
      ZEWU INTERIOR DESIGN
    </text>
  </svg>
);

export default ZewuBrandLogo;
