import React from 'react';
//import logoImage from '@assets/logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  type?: 'text' | 'image' | 'full';
}

const Logo = ({ size = 'md', type = 'full' }: LogoProps) => {
  const dimensions = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10'
  };

  const fontSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  if (type === 'image') {
    return <img src="/attached_assets/logo.png" alt="TerraTracts Logo" className={dimensions[size]} />;
  }

  if (type === 'text') {
    return (
      <span className={`font-bold ${fontSizes[size]} text-purple-800`}>TerraTracts</span>
    );
  }

  // Default: full logo
  return (
    <div className="flex items-center">
      <img src="/attached_assets/logo.png" alt="TerraTracts Logo" className={dimensions[size]} />
    </div>
  );
};

export default Logo;
