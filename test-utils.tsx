import React from 'react';
import { render } from '@testing-library/react';
import { AppProvider } from './context/AppContext';

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <AppProvider>{children}</AppProvider>;
};

const customRender = (ui: React.ReactElement, options?: any) =>
    render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
