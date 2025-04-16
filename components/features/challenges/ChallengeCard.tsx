'use client';

import React from 'react';
import Card from '../../common/Card';
import Button from '../../common/Button';

interface ChallengeProps {
	id: string;
	title: string;
	description: string;
	difficulty: 'easy' | 'medium' | 'hard';
	points: number;
	completed?: boolean;
	onViewDetails?: (id: string) => void;
}

const ChallengeCard: React.FC<ChallengeProps> = ({ id, title, description, difficulty, points, completed = false, onViewDetails }) => {
	const difficultyColors = {
		easy: 'bg-yuumi-success/20 text-yuumi-success',
		medium: 'bg-yuumi-warning/20 text-yuumi-warning',
		hard: 'bg-yuumi-error/20 text-yuumi-error',
	};

	return (
		<Card
			className='h-full flex flex-col animate-fade-in transition-all duration-300 hover:transform hover:scale-105'
			footer={
				<div className='flex justify-between items-center'>
					<span className='text-yuumi-accent font-medium'>{points} points</span>
					<Button variant='primary' size='sm' onClick={() => onViewDetails && onViewDetails(id)}>
						View Details
					</Button>
				</div>
			}
		>
			<div className='flex justify-between items-start mb-2'>
				<h3 className='text-xl font-bold yuumi-gradient-text'>{title}</h3>
				<span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[difficulty]} animate-pulse-slow`}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
			</div>
			<p className='text-yuumi-light mb-4'>{description}</p>
			{completed && (
				<div className='mt-auto mb-2 flex items-center text-yuumi-success animate-float'>
					<svg className='w-5 h-5 mr-1' fill='currentColor' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'>
						<path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
					</svg>
					<span>Completed</span>
				</div>
			)}
		</Card>
	);
};

export default ChallengeCard;
