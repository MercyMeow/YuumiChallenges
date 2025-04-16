'use client';

import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
	size?: 'sm' | 'md' | 'lg';
	isLoading?: boolean;
	fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', isLoading = false, fullWidth = false, className = '', disabled, ...props }) => {
	const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 yuumi-button';

	const variantClasses = {
		primary: 'bg-yuumi-primary hover:bg-yuumi-secondary text-yuumi-lighter focus:ring-yuumi-primary',
		secondary: 'bg-yuumi-dark hover:bg-yuumi-darker text-yuumi-light border border-yuumi-primary focus:ring-yuumi-primary',
		success: 'bg-yuumi-success hover:bg-yuumi-success/80 text-yuumi-darker focus:ring-yuumi-success',
		danger: 'bg-yuumi-error hover:bg-yuumi-error/80 text-yuumi-lighter focus:ring-yuumi-error',
		warning: 'bg-yuumi-warning hover:bg-yuumi-warning/80 text-yuumi-darker focus:ring-yuumi-warning',
		info: 'bg-yuumi-primary/70 hover:bg-yuumi-primary/90 text-yuumi-lighter focus:ring-yuumi-primary',
	};

	const sizeClasses = {
		sm: 'text-sm px-3 py-1.5',
		md: 'text-base px-4 py-2',
		lg: 'text-lg px-6 py-3',
	};

	const widthClass = fullWidth ? 'w-full' : '';
	const disabledClass = disabled || isLoading ? 'opacity-70 cursor-not-allowed hover:transform-none' : 'hover:-translate-y-1 hover:shadow-yuumi';

	return (
		<button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${className}`} disabled={disabled || isLoading} {...props}>
			{isLoading && (
				<svg className='animate-spin -ml-1 mr-2 h-4 w-4 text-current' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
					<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
					<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
				</svg>
			)}
			{children}
		</button>
	);
};

export default Button;
