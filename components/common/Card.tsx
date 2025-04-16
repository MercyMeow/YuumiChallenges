'use client';

import React, { ReactNode } from 'react';

interface CardProps {
	children: ReactNode;
	title?: string;
	className?: string;
	footer?: ReactNode;
}

const Card: React.FC<CardProps> = ({ children, title, className = '', footer }) => {
	return (
		<div className={`yuumi-card bg-yuumi-dark/90 rounded-lg shadow-yuumi overflow-hidden hover-scale ${className}`}>
			{title && (
				<div className='px-6 py-4 border-b border-yuumi-primary/30'>
					<h3 className='text-lg font-semibold yuumi-gradient-text'>{title}</h3>
				</div>
			)}
			<div className='px-6 py-4'>{children}</div>
			{footer && <div className='px-6 py-3 bg-yuumi-darker border-t border-yuumi-primary/30'>{footer}</div>}
		</div>
	);
};

export default Card;
