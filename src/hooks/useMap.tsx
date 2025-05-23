import { useContext } from 'react';
import { MapContext } from '../context/MapProvider';

export const useMap = () => {
  const context = useContext(MapContext);

  if (context === null) {
    throw new Error('useMap must be used within a MapProvider');
  }

  return context;
};
