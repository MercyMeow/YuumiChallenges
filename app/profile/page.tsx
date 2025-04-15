'use client';

import React from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Image from 'next/image';

export default function ProfilePage() {
	// Sample user data
	const user = {
		username: 'SummonerName',
		discordTag: 'DiscordUser#1234',
		avatar: '/yuumi-avatar.png', // Local image in the public folder
		region: 'NA',
		level: 42,
		totalPoints: 1250,
		rank: 156,
		challengesCompleted: 15,
		challengesInProgress: 8,
	};

	// Sample match history
	const matchHistory = [
		{
			id: '1',
			champion: 'Yuumi',
			result: 'Victory',
			kda: '2/1/24',
			date: '2 hours ago',
			gameMode: 'Ranked Solo/Duo',
		},
		{
			id: '2',
			champion: 'Lulu',
			result: 'Defeat',
			kda: '1/4/12',
			date: '5 hours ago',
			gameMode: 'Normal',
		},
		{
			id: '3',
			champion: 'Soraka',
			result: 'Victory',
			kda: '0/2/18',
			date: '1 day ago',
			gameMode: 'ARAM',
		},
		{
			id: '4',
			champion: 'Nami',
			result: 'Victory',
			kda: '3/2/21',
			date: '1 day ago',
			gameMode: 'Ranked Solo/Duo',
		},
		{
			id: '5',
			champion: 'Janna',
			result: 'Defeat',
			kda: '0/5/9',
			date: '2 days ago',
			gameMode: 'Normal',
		},
	];

	// Sample achievements
	const achievements = [
		{
			id: '1',
			title: 'First Blood Master',
			description: 'Get first blood in 10 games',
			progress: 100,
			completed: true,
			date: '3 days ago',
		},
		{
			id: '2',
			title: 'Vision Guardian',
			description: 'Achieve a vision score of 100+ in a single game',
			progress: 100,
			completed: true,
			date: '1 week ago',
		},
		{
			id: '3',
			title: 'Pentakill Hunter',
			description: 'Get a pentakill in a ranked game',
			progress: 0,
			completed: false,
			date: null,
		},
	];

	return (
		<MainLayout title={`${user.username}'s Profile - Yuum.Ai Dashboard`}>
			<div className='space-y-8'>
				{/* Profile Header */}
				<div className='bg-yuumi-dark rounded-lg shadow-yuumi overflow-hidden animate-fade-in'>
					<div className='bg-yuumi-gradient-bg h-32'></div>
					<div className='px-6 py-4 flex flex-col md:flex-row gap-6'>
						<div className='flex-shrink-0 -mt-16 animate-float'>
							<Image src={user.avatar} alt={user.username} width={150} height={150} className='rounded-full border-4 border-yuumi-primary shadow-yuumi' />
						</div>
						<div className='flex-grow'>
							<div className='flex flex-col md:flex-row md:justify-between md:items-center'>
								<div>
									<h1 className='text-2xl font-bold yuumi-gradient-text'>{user.username}</h1>
									<p className='text-yuumi-light'>{user.discordTag}</p>
									<p className='text-yuumi-light'>
										Region: <span className='text-yuumi-accent'>{user.region}</span>
									</p>
								</div>
								<div className='mt-4 md:mt-0'>
									<Button variant='primary' className='animate-pulse-slow'>
										Edit Profile
									</Button>
								</div>
							</div>
							<div className='mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children'>
								<div className='text-center p-3 bg-yuumi-darker rounded-lg border border-yuumi-primary/30 hover:border-yuumi-primary transition-all duration-300'>
									<p className='text-yuumi-light text-sm'>Level</p>
									<p className='text-xl font-bold text-yuumi-primary'>{user.level}</p>
								</div>
								<div className='text-center p-3 bg-yuumi-darker rounded-lg border border-yuumi-primary/30 hover:border-yuumi-secondary transition-all duration-300'>
									<p className='text-yuumi-light text-sm'>Total Points</p>
									<p className='text-xl font-bold text-yuumi-secondary'>{user.totalPoints}</p>
								</div>
								<div className='text-center p-3 bg-yuumi-darker rounded-lg border border-yuumi-primary/30 hover:border-yuumi-success transition-all duration-300'>
									<p className='text-yuumi-light text-sm'>Rank</p>
									<p className='text-xl font-bold text-yuumi-success'>#{user.rank}</p>
								</div>
								<div className='text-center p-3 bg-yuumi-darker rounded-lg border border-yuumi-primary/30 hover:border-yuumi-accent transition-all duration-300'>
									<p className='text-yuumi-light text-sm'>Challenges Completed</p>
									<p className='text-xl font-bold text-yuumi-accent'>{user.challengesCompleted}</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
					{/* Match History */}
					<div className='lg:col-span-2'>
						<Card title='Recent Matches'>
							<div className='space-y-4'>
								{matchHistory.map((match, index) => (
									<div key={match.id} className='flex items-center p-3 bg-yuumi-darker rounded-lg border border-yuumi-primary/20 hover:border-yuumi-primary/60 transition-all duration-300 animate-fade-in' style={{ animationDelay: `${index * 0.1}s` }}>
										<div className='flex-shrink-0 mr-4'>
											<div className={`w-12 h-12 ${match.result === 'Victory' ? 'bg-yuumi-success/20 text-yuumi-success' : 'bg-yuumi-error/20 text-yuumi-error'} rounded-full flex items-center justify-center font-bold`}>{match.champion.charAt(0)}</div>
										</div>
										<div className='flex-grow'>
											<div className='flex justify-between'>
												<h3 className='font-medium text-yuumi-light'>{match.champion}</h3>
												<span className={`font-medium ${match.result === 'Victory' ? 'text-yuumi-success' : 'text-yuumi-error'}`}>{match.result}</span>
											</div>
											<div className='flex justify-between text-sm text-yuumi-light/70'>
												<span>{match.kda} KDA</span>
												<span>{match.gameMode}</span>
												<span>{match.date}</span>
											</div>
										</div>
									</div>
								))}
								<div className='text-center mt-4'>
									<Button variant='secondary' size='sm'>
										View All Matches
									</Button>
								</div>
							</div>
						</Card>
					</div>

					{/* Achievements */}
					<div>
						<Card title='Recent Achievements'>
							<div className='space-y-4'>
								{achievements.map((achievement, index) => (
									<div key={achievement.id} className='p-3 bg-yuumi-darker rounded-lg border border-yuumi-primary/20 hover:border-yuumi-primary/60 transition-all duration-300 animate-fade-in' style={{ animationDelay: `${index * 0.15}s` }}>
										<div className='flex justify-between items-start'>
											<h3 className='font-medium yuumi-gradient-text'>{achievement.title}</h3>
											{achievement.completed && <span className='bg-yuumi-success/20 text-yuumi-success text-xs px-2 py-1 rounded-full animate-pulse-slow'>Completed</span>}
										</div>
										<p className='text-sm text-yuumi-light mt-1'>{achievement.description}</p>
										<div className='mt-2'>
											<div className='w-full bg-yuumi-dark rounded-full h-2.5'>
												<div className='bg-yuumi-primary h-2.5 rounded-full animate-pulse-slow' style={{ width: `${achievement.progress}%` }}></div>
											</div>
											<div className='flex justify-between text-xs text-yuumi-light/70 mt-1'>
												<span>{achievement.progress}%</span>
												{achievement.date && <span className='text-yuumi-accent'>Completed {achievement.date}</span>}
											</div>
										</div>
									</div>
								))}
								<div className='text-center mt-4'>
									<Button variant='secondary' size='sm'>
										View All Achievements
									</Button>
								</div>
							</div>
						</Card>

						<Card title='Linked Accounts' className='mt-6'>
							<div className='space-y-4 stagger-children'>
								<div className='flex items-center justify-between p-3 bg-yuumi-darker rounded-lg border border-yuumi-primary/20 hover:border-yuumi-primary/60 transition-all duration-300'>
									<div className='flex items-center'>
										<div className='w-10 h-10 bg-yuumi-primary/20 rounded-full flex items-center justify-center mr-3 animate-pulse-slow'>
											<span className='text-yuumi-primary font-bold'>D</span>
										</div>
										<div>
											<p className='font-medium text-yuumi-light'>Discord</p>
											<p className='text-sm text-yuumi-light/70'>{user.discordTag}</p>
										</div>
									</div>
									<span className='text-yuumi-success text-sm'>Connected</span>
								</div>
								<div className='flex items-center justify-between p-3 bg-yuumi-darker rounded-lg border border-yuumi-primary/20 hover:border-yuumi-primary/60 transition-all duration-300'>
									<div className='flex items-center'>
										<div className='w-10 h-10 bg-yuumi-error/20 rounded-full flex items-center justify-center mr-3 animate-pulse-slow' style={{ animationDelay: '0.3s' }}>
											<span className='text-yuumi-error font-bold'>R</span>
										</div>
										<div>
											<p className='font-medium text-yuumi-light'>Riot Games</p>
											<p className='text-sm text-yuumi-light/70'>
												{user.username} (<span className='text-yuumi-accent'>{user.region}</span>)
											</p>
										</div>
									</div>
									<span className='text-yuumi-success text-sm'>Connected</span>
								</div>
								<div className='flex items-center justify-between p-3 bg-yuumi-darker rounded-lg border border-yuumi-primary/20 hover:border-yuumi-primary/60 transition-all duration-300'>
									<div className='flex items-center'>
										<div className='w-10 h-10 bg-yuumi-secondary/20 rounded-full flex items-center justify-center mr-3 animate-pulse-slow' style={{ animationDelay: '0.6s' }}>
											<span className='text-yuumi-secondary font-bold'>T</span>
										</div>
										<div>
											<p className='font-medium text-yuumi-light'>Twitch</p>
											<p className='text-sm text-yuumi-light/70'>Not connected</p>
										</div>
									</div>
									<Button variant='secondary' size='sm' className='animate-pulse-slow'>
										Connect
									</Button>
								</div>
							</div>
						</Card>
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
