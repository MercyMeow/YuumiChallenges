'use client';

import React, { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

interface MainLayoutProps {
	children: ReactNode;
	title?: string;
}

// Authentication navigation component
const AuthNav: React.FC = () => {
	const { isAuthenticated, user, signIn, signOut } = useAuth();

	return (
		<>
			{isAuthenticated ? (
				<>
					<li>
						<Link href='/profile' className='hover:text-yuumi-accent transition-colors duration-300 font-medium'>
							Profile
						</Link>
					</li>
					<li className='relative group'>
						<button className='flex items-center space-x-1 hover:text-yuumi-accent transition-colors duration-300'>
							<div className='w-8 h-8 rounded-full bg-yuumi-primary/20 flex items-center justify-center overflow-hidden'>{user?.image ? <Image src={user.image} alt={user.name || 'User'} width={32} height={32} className='object-cover' /> : <span className='text-yuumi-primary font-bold'>{user?.name?.charAt(0) || 'U'}</span>}</div>
							<span className='hidden md:inline'>{user?.name?.split(' ')[0] || 'User'}</span>
							<svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
							</svg>
						</button>
						<div className='absolute right-0 mt-2 w-48 bg-yuumi-dark rounded-md shadow-yuumi overflow-hidden z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right'>
							<div className='py-1'>
								<Link href='/profile' className='block px-4 py-2 text-sm text-yuumi-light hover:bg-yuumi-primary/20 transition-colors duration-200'>
									Your Profile
								</Link>
								<Link href='/settings' className='block px-4 py-2 text-sm text-yuumi-light hover:bg-yuumi-primary/20 transition-colors duration-200'>
									Settings
								</Link>
								<div className='border-t border-yuumi-primary/20'></div>
								<Link href='/auth/signout' className='block px-4 py-2 text-sm text-yuumi-error hover:bg-yuumi-primary/20 transition-colors duration-200'>
									Sign Out
								</Link>
							</div>
						</div>
					</li>
				</>
			) : (
				<li>
					<Link href='/auth/signin' className='bg-yuumi-primary hover:bg-yuumi-secondary text-white py-2 px-4 rounded-md transition-colors duration-300 animate-pulse-slow'>
						Sign In
					</Link>
				</li>
			)}
		</>
	);
};

const MainLayout: React.FC<MainLayoutProps> = ({ children, title = 'Yuum.Ai Dashboard' }) => {
	return (
		<div className='min-h-screen bg-yuumi-darker text-yuumi-lighter'>
			<Head>
				<title>{title}</title>
				<meta name='description' content='League of Legends challenge tracking and game analysis' />
				<link rel='icon' href='/favicon.ico' />
				<link href='https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap' rel='stylesheet' />
			</Head>

			<header className='bg-yuumi-gradient-bg text-yuumi-lighter shadow-yuumi animate-fade-in'>
				<div className='container mx-auto px-4 py-4 flex justify-between items-center'>
					<div className='flex items-center space-x-2'>
						<div className='w-10 h-10 rounded-full bg-yuumi-accent flex items-center justify-center animate-float'>
							<span className='text-yuumi-darker font-bold text-xl'>Y</span>
						</div>
						<h1 className='text-2xl font-bold yuumi-gradient-text'>Yuum.Ai Dashboard</h1>
					</div>
					<nav>
						<ul className='flex items-center space-x-6'>
							<li>
								<Link href='/' className='hover:text-yuumi-accent transition-colors duration-300 font-medium'>
									Home
								</Link>
							</li>
							<li>
								<Link href='/challenges' className='hover:text-yuumi-accent transition-colors duration-300 font-medium'>
									Challenges
								</Link>
							</li>
							<AuthNav />
						</ul>
					</nav>
				</div>
			</header>

			<main className='container mx-auto px-4 py-8 animate-slide-in-up'>{children}</main>

			<footer className='bg-yuumi-dark text-yuumi-light py-6 mt-12'>
				<div className='container mx-auto px-4 text-center'>
					<div className='flex justify-center space-x-6 mb-4'>
						<a href='#' className='text-yuumi-accent hover:text-yuumi-primary transition-colors duration-300'>
							<span className='sr-only'>Discord</span>
							<svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
								<path d='M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z' />
							</svg>
						</a>
						<a href='#' className='text-yuumi-accent hover:text-yuumi-primary transition-colors duration-300'>
							<span className='sr-only'>Twitter</span>
							<svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
								<path d='M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84' />
							</svg>
						</a>
						<a href='#' className='text-yuumi-accent hover:text-yuumi-primary transition-colors duration-300'>
							<span className='sr-only'>GitHub</span>
							<svg className='h-6 w-6' fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
								<path
									fillRule='evenodd'
									d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'
									clipRule='evenodd'
								/>
							</svg>
						</a>
					</div>
					<div className='space-y-4'>
						<p className='text-yuumi-light'>&copy; {new Date().getFullYear()} Yuum.Ai Dashboard. All rights reserved.</p>
						<div className='flex justify-center space-x-4 text-sm'>
							<Link href='/legal/terms' className='text-yuumi-light hover:text-yuumi-accent transition-colors duration-300'>
								Terms of Service
							</Link>
							<Link href='/legal/privacy' className='text-yuumi-light hover:text-yuumi-accent transition-colors duration-300'>
								Privacy Policy
							</Link>
						</div>
						<div className='text-xs text-yuumi-light/70 max-w-2xl mx-auto'>
							<p>Yuum.Ai Dashboard isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default MainLayout;
