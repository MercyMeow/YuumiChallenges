'use client';

import Image from 'next/image';
import MainLayout from '../components/layouts/MainLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import ChallengeCard from '../components/features/challenges/ChallengeCard';

export default function Home() {
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
	];

	return (
		<MainLayout title='Yuum.Ai Dashboard - League of Legends Challenges'>
			<div className='space-y-8'>
				{/* Hero Section */}
				<section className='bg-yuumi-gradient-bg rounded-lg p-8 text-yuumi-lighter shadow-yuumi animate-fade-in'>
					<div className='max-w-3xl mx-auto text-center'>
						<div className='w-24 h-24 mx-auto mb-6 animate-float'>
							<svg viewBox='0 0 100 100' fill='none' xmlns='http://www.w3.org/2000/svg' className='w-full h-full'>
								<circle cx='50' cy='50' r='45' fill='var(--yuumi-accent)' />
								<path d='M35 65C35 57.268 41.268 51 49 51H51C58.732 51 65 57.268 65 65V65C65 72.732 58.732 79 51 79H49C41.268 79 35 72.732 35 65V65Z' fill='var(--yuumi-darker)' />
								<circle cx='35' cy='40' r='8' fill='var(--yuumi-darker)' />
								<circle cx='65' cy='40' r='8' fill='var(--yuumi-darker)' />
								<path d='M45 30C45 27.2386 47.2386 25 50 25V25C52.7614 25 55 27.2386 55 30V35C55 37.7614 52.7614 40 50 40V40C47.2386 40 45 37.7614 45 35V30Z' fill='var(--yuumi-darker)' />
							</svg>
						</div>
						<h1 className='text-4xl font-bold mb-4 yuumi-gradient-text'>Welcome to Yuum.Ai Dashboard</h1>
						<p className='text-xl mb-6 text-yuumi-lighter'>Track your League of Legends challenges, analyze your games, and compete with the community.</p>
						<div className='flex justify-center space-x-4'>
							<Button variant='primary' size='lg' className='animate-slide-in-up' style={{ animationDelay: '0.2s' }}>
								Get Started
							</Button>
							<Button variant='secondary' size='lg' className='animate-slide-in-up' style={{ animationDelay: '0.4s' }}>
								Learn More
							</Button>
						</div>
					</div>
				</section>

				{/* Featured Challenges */}
				<section>
					<div className='flex justify-between items-center mb-6'>
						<h2 className='text-2xl font-bold yuumi-gradient-text'>Featured Challenges</h2>
						<Button variant='secondary' size='sm' className='animate-pulse-slow'>
							View All
						</Button>
					</div>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children'>
						{sampleChallenges.map((challenge, index) => (
							<div key={challenge.id} className='animate-fade-in' style={{ animationDelay: `${index * 0.2}s` }}>
								<ChallengeCard id={challenge.id} title={challenge.title} description={challenge.description} difficulty={challenge.difficulty as 'easy' | 'medium' | 'hard'} points={challenge.points} completed={challenge.completed} onViewDetails={(id) => console.log(`View details for challenge ${id}`)} />
							</div>
						))}
					</div>
				</section>

				{/* How It Works */}
				<section className='bg-yuumi-dark/50 rounded-lg p-8 shadow-yuumi'>
					<h2 className='text-2xl font-bold mb-6 text-center yuumi-gradient-text'>How It Works</h2>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children'>
						<Card className='transform transition-all duration-500 hover:translate-y-[-10px]'>
							<div className='text-center'>
								<div className='bg-yuumi-primary/20 text-yuumi-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow'>
									<span className='text-2xl font-bold'>1</span>
								</div>
								<h3 className='text-lg font-semibold mb-2 yuumi-gradient-text'>Connect Your Account</h3>
								<p className='text-yuumi-light'>Link your League of Legends account to get started tracking your progress.</p>
							</div>
						</Card>
						<Card className='transform transition-all duration-500 hover:translate-y-[-10px]'>
							<div className='text-center'>
								<div className='bg-yuumi-secondary/20 text-yuumi-secondary w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow' style={{ animationDelay: '0.5s' }}>
									<span className='text-2xl font-bold'>2</span>
								</div>
								<h3 className='text-lg font-semibold mb-2 yuumi-gradient-text'>Complete Challenges</h3>
								<p className='text-yuumi-light'>Play games and complete challenges to earn points and climb the leaderboard.</p>
							</div>
						</Card>
						<Card className='transform transition-all duration-500 hover:translate-y-[-10px]'>
							<div className='text-center'>
								<div className='bg-yuumi-accent/20 text-yuumi-accent w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-slow' style={{ animationDelay: '1s' }}>
									<span className='text-2xl font-bold'>3</span>
								</div>
								<h3 className='text-lg font-semibold mb-2 yuumi-gradient-text'>Earn Rewards</h3>
								<p className='text-yuumi-light'>Unlock achievements, badges, and special rewards as you progress.</p>
							</div>
						</Card>
					</div>
				</section>

				{/* Community Stats */}
				<section>
					<h2 className='text-2xl font-bold mb-6 text-center yuumi-gradient-text'>Community Stats</h2>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children'>
						<Card className='text-center transform transition-all duration-500 hover:scale-105'>
							<h3 className='text-lg font-semibold text-yuumi-light'>Active Users</h3>
							<div className='relative'>
								<p className='text-5xl font-bold text-yuumi-primary mt-2 animate-float'>1,234</p>
								<div className='absolute -top-1 -right-1 w-3 h-3 bg-yuumi-primary rounded-full animate-pulse'></div>
							</div>
						</Card>
						<Card className='text-center transform transition-all duration-500 hover:scale-105'>
							<h3 className='text-lg font-semibold text-yuumi-light'>Challenges Completed</h3>
							<div className='relative'>
								<p className='text-5xl font-bold text-yuumi-secondary mt-2 animate-float' style={{ animationDelay: '0.2s' }}>
									45,678
								</p>
								<div className='absolute -top-1 -right-1 w-3 h-3 bg-yuumi-secondary rounded-full animate-pulse' style={{ animationDelay: '0.2s' }}></div>
							</div>
						</Card>
						<Card className='text-center transform transition-all duration-500 hover:scale-105'>
							<h3 className='text-lg font-semibold text-yuumi-light'>Games Analyzed</h3>
							<div className='relative'>
								<p className='text-5xl font-bold text-yuumi-success mt-2 animate-float' style={{ animationDelay: '0.4s' }}>
									98,765
								</p>
								<div className='absolute -top-1 -right-1 w-3 h-3 bg-yuumi-success rounded-full animate-pulse' style={{ animationDelay: '0.4s' }}></div>
							</div>
						</Card>
						<Card className='text-center transform transition-all duration-500 hover:scale-105'>
							<h3 className='text-lg font-semibold text-yuumi-light'>Total Points Earned</h3>
							<div className='relative'>
								<p className='text-5xl font-bold text-yuumi-accent mt-2 animate-float' style={{ animationDelay: '0.6s' }}>
									12.3M
								</p>
								<div className='absolute -top-1 -right-1 w-3 h-3 bg-yuumi-accent rounded-full animate-pulse' style={{ animationDelay: '0.6s' }}></div>
							</div>
						</Card>
					</div>
				</section>
			</div>
		</MainLayout>
	);
}
