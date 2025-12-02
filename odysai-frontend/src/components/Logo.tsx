import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24',
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  showText = true
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/assets/logo.png"
        alt="Ody'sai Logo"
        className={`${sizeMap[size]} object-contain`}
      />
      {showText && (
        <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          Ody'sai
        </span>
      )}
    </div>
  );
};
