'use client';

import React from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import ChallengeCard from '../../components/features/challenges/ChallengeCard';

export default function ChallengesPage() {
	// Sample challenges data
	const sampleChallenges = [
		{
			id: '1',
			title: 'Pentakill Master',
			description: 'Get a pentakill in a ranked game',
			difficulty: 'hard',
			points: 500,
			completed: false,
		},
		{
			id: '2',
			title: 'Vision Guardian',
			description: 'Achieve a vision score of 100+ in a single game',
			difficulty: 'medium',
			points: 300,
			completed: true,
		},
		{
			id: '3',
			title: 'First Blood',
			description: 'Get first blood in 5 different games',
			difficulty: 'easy',
			points: 100,
			completed: false,
		},
		{
			id: '4',
			title: 'Objective Stealer',
			description: 'Steal Baron or Dragon 3 times in a single week',
			difficulty: 'medium',
			points: 250,
			completed: false,
		},
		{
			id: '5',
			title: 'CS Master',
			description: 'Achieve 10 CS per minute in a game lasting at least 20 minutes',
			difficulty: 'hard',
			points: 400,
			completed: false,
		},
		{
			id: '6',
			title: 'Support Savior',
			description: 'Get 30+ assists in a single game',
			difficulty: 'medium',
			points: 300,
			completed: true,
		},
	];

	return (
		<MainLayout title='Challenges - Yuum.Ai Dashboard'>
			<div className='space-y-8'>
				<div className='flex justify-between items-center animate-fade-in'>
					<h1 className='text-3xl font-bold yuumi-gradient-text'>Challenges</h1>
					<div className='flex space-x-4'>
						<Button variant='secondary' size='md' className='animate-pulse-slow'>
							Filter
						</Button>
						<Button variant='primary' size='md' className='animate-pulse-slow' style={{ animationDelay: '0.3s' }}>
							Create Challenge
						</Button>
					</div>
				</div>

				{/* Filters */}
				<Card className='p-4 animate-slide-in-up'>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
						<div>
							<label className='block text-sm font-medium text-yuumi-light mb-1'>Difficulty</label>
							<select className='w-full rounded-md bg-yuumi-darker border-yuumi-primary/30 text-yuumi-light shadow-sm focus:border-yuumi-primary focus:ring-yuumi-primary'>
								<option value=''>All Difficulties</option>
								<option value='easy'>Easy</option>
								<option value='medium'>Medium</option>
								<option value='hard'>Hard</option>
							</select>
						</div>
						<div>
							<label className='block text-sm font-medium text-yuumi-light mb-1'>Status</label>
							<select className='w-full rounded-md bg-yuumi-darker border-yuumi-primary/30 text-yuumi-light shadow-sm focus:border-yuumi-primary focus:ring-yuumi-primary'>
								<option value=''>All Statuses</option>
								<option value='completed'>Completed</option>
								<option value='not_completed'>Not Completed</option>
							</select>
						</div>
						<div>
							<label className='block text-sm font-medium text-yuumi-light mb-1'>Sort By</label>
							<select className='w-full rounded-md bg-yuumi-darker border-yuumi-primary/30 text-yuumi-light shadow-sm focus:border-yuumi-primary focus:ring-yuumi-primary'>
								<option value='newest'>Newest</option>
								<option value='oldest'>Oldest</option>
								<option value='points_high'>Points (High to Low)</option>
								<option value='points_low'>Points (Low to High)</option>
							</select>
						</div>
						<div className='flex items-end'>
							<Button variant='secondary' size='md' fullWidth className='animate-pulse-slow'>
								Apply Filters
							</Button>
						</div>
					</div>
				</Card>

				{/* Challenge Grid */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children'>
					{sampleChallenges.map((challenge, index) => (
						<div key={challenge.id} className='animate-fade-in' style={{ animationDelay: `${index * 0.1}s` }}>
							<ChallengeCard id={challenge.id} title={challenge.title} description={challenge.description} difficulty={challenge.difficulty as 'easy' | 'medium' | 'hard'} points={challenge.points} completed={challenge.completed} onViewDetails={(id) => console.log(`View details for challenge ${id}`)} />
						</div>
					))}
				</div>

				{/* Pagination */}
				<div className='flex justify-center mt-8 animate-fade-in' style={{ animationDelay: '0.5s' }}>
					<nav className='flex items-center space-x-2'>
						<Button variant='secondary' size='sm' disabled>
							Previous
						</Button>
						<Button variant='primary' size='sm' className='animate-pulse-slow'>
							1
						</Button>
						<Button variant='secondary' size='sm' className='hover:bg-yuumi-primary/20'>
							2
						</Button>
						<Button variant='secondary' size='sm' className='hover:bg-yuumi-primary/20'>
							3
						</Button>
						<span className='px-2 text-yuumi-light'>...</span>
						<Button variant='secondary' size='sm' className='hover:bg-yuumi-primary/20'>
							10
						</Button>
						<Button variant='secondary' size='sm' className='hover:bg-yuumi-primary/20'>
							Next
						</Button>
					</nav>
				</div>
			</div>
		</MainLayout>
	);
}
