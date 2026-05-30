import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export const Button = ({ children, className = '', ...props }: ButtonProps) => (
  <button className={`btn ${className}`.trim()} {...props}>
    {children}
  </button>
);

export default {};
