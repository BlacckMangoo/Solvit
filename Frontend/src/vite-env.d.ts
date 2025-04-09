/// <reference types="vite/client" />

declare module 'react-katex' {
  import React from 'react';
  
  export interface KatexProps {
    math: string;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
    settings?: any;
    as?: string | React.ComponentType<any>;
  }
  
  export const InlineMath: React.FC<KatexProps>;
  export const BlockMath: React.FC<KatexProps>;
}
