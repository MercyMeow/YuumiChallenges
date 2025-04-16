import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { runDatabaseBootstrap } from '@/lib/db/bootstrap';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Yuum.Ai Dashboard',
	description: 'League of Legends challenge tracking and game analysis',
};

// Initialize database when the app starts
runDatabaseBootstrap()
	.then((result) => {
		if (result) {
			console.log('Database bootstrap successful');
		} else {
			console.warn('Database bootstrap failed, but application will continue');
		}
	})
	.catch((error) => {
		console.error('Error during database bootstrap:', error);
	});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
