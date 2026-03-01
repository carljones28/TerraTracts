import React from 'react';

interface TerrainToggleProps {
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TerrainToggle: React.FC<TerrainToggleProps> = ({ icon, label, isActive, onClick }) => {
  return (
    <div 
      className={`terrain-toggle rounded-full px-5 py-2 cursor-pointer flex items-center space-x-2 transition-all duration-200 ${isActive ? 'bg-secondary/20' : 'bg-primary-light'}`}
      onClick={onClick}
    >
      <i className={`fas ${icon} ${isActive ? 'text-secondary-light' : 'text-secondary'}`}></i>
      <span className={isActive ? 'text-white' : ''}>{label}</span>
    </div>
  );
};

export default TerrainToggle;
