import React from 'react';
import { useInView } from '../../hooks/useInView';

interface LazyLoadModuleProps {
  children: React.ReactNode;
  placeholder: React.ReactNode;
}

const LazyLoadModule: React.FC<LazyLoadModuleProps> = ({ children, placeholder }) => {
  const [ref, inView] = useInView({ rootMargin: '200px 0px' });
  return <div ref={ref}>{inView ? children : placeholder}</div>;
};

export default LazyLoadModule;