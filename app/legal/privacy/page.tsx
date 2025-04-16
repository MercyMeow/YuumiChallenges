'use client';

import React from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import Link from 'next/link';

export default function PrivacyPolicy() {
	return (
		<MainLayout title='Privacy Policy - Yuum.Ai Dashboard'>
			<div className='max-w-4xl mx-auto'>
				<h1 className='text-3xl font-bold yuumi-gradient-text mb-6'>Privacy Policy</h1>

				<div className='bg-yuumi-dark rounded-lg shadow-yuumi p-6 mb-8 animate-fade-in'>
					<p className='text-yuumi-light mb-4'>Last Updated: April 15, 2025</p>

					<div className='prose prose-invert max-w-none text-yuumi-light'>
						<h2 className='text-xl font-semibold yuumi-gradient-text mt-6 mb-4'>1. Introduction</h2>
						<p>At Yuum.Ai Dashboard ("we," "our," or "us"), we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, services, applications, and content (collectively, the "Services").</p>

						<h2 className='text-xl font-semibold yuumi-gradient-text mt-6 mb-4'>2. Information We Collect</h2>
						<p>We collect a limited set of information from and about users of our Services, including:</p>
						<ul className='list-disc pl-6 mb-4'>
							<li>
								<strong>Discord Data:</strong> We collect only your Discord username, Discord ID, and information about which Discord servers you are a member of. We do not collect your email address or other personal information from Discord.
							</li>
							<li>
								<strong>Riot Games Data:</strong> If you choose to link your Riot Games account, we collect information about your League of Legends gameplay, match history, and statistics as necessary to provide our Services.
							</li>
						</ul>
						<p className='mb-4'>
							<strong>What We Don't Collect:</strong> We do not collect device data, usage data, or browsing patterns. We also do not collect your email address from Discord or any other unnecessary personal information.
						</p>

						<h2 className='text-xl font-semibold yuumi-gradient-text mt-6 mb-4'>3. How We Collect Information</h2>
						<p>We collect information:</p>
						<ul className='list-disc pl-6 mb-4'>
							<li>Directly from you when you provide it to us (e.g., when you register for an account).</li>
							<li>From third parties, specifically Discord and Riot Games, when you connect your accounts. We only collect the minimum necessary information from these services as described above.</li>
						</ul>
						<p className='mb-4'>We do not use cookies, tracking pixels, or similar technologies to automatically collect information about your browsing habits or device information.</p>

						<h2 className='text-xl font-semibold yuumi-gradient-text mt-6 mb-4'>4. How We Use Your Information</h2>
						<p>We use your information to:</p>
						<ul className='list-disc pl-6 mb-4'>
							<li>Provide, maintain, and improve our Services.</li>
							<li>Process and complete transactions.</li>
							<li>Send you technical notices, updates, security alerts, and support messages.</li>
							<li>Respond to your comments, questions, and requests.</li>
							<li>Personalize your experience on our Services based only on the information you've explicitly provided.</li>
							<li>Detect, prevent, and address technical issues.</li>
							<li>Protect the safety, integrity, and security of our Services, users, and others.</li>
						</ul>
						<p className='mb-4'>We do not use your information for tracking, profiling, or targeted advertising purposes.</p>

						<h2 className='text-xl font-semibold yuumi-gradient-text mt-6 mb-4'>5. Disclosure of Your Information</h2>
						<p>We may disclose your personal information:</p>
						<ul className='list-disc pl-6 mb-4'>
							<li>To comply with any court order, law, or legal process.</li>
							<li>To enforce our Terms of Service and other agreements.</li>
							<li>To protect the rights, property, or safety of our company, our users, or others.</li>
							<li>With your consent or at your direction.</li>
							<li>To service providers who perform services on our behalf.</li>
						</ul>

						<h2 className='text-xl font-semibold yuumi-gradient-text mt-6 mb-4'>6. Data Security</h2>
						<p>We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. However, the transmission of information via the internet is not completely secure. Although we do our best to protect your personal information, we cannot guarantee the security of your personal information transmitted to our Services.</p>

						<h2 className='text-xl font-semibold yuumi-gradient-text mt-6 mb-4'>7. Third-Party Services</h2>
						<p>Our Services may contain links to third-party websites or services that are not owned or controlled by us. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. We strongly advise you to review the privacy policy of every site you visit.</p>

						<h2 className='text-xl font-semibold yuumi-gradient-text mt-6 mb-4'>8. Data Retention</h2>
						<p>We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.</p>

						<h2 className='text-xl font-semibold yuumi-gradient-text mt-6 mb-4'>9. Children's Privacy</h2>
						<p>Our Services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us.</p>

						<h2 className='text-xl font-semibold yuumi-gradient-text mt-6 mb-4'>10. Your Rights</h2>
						<p>Depending on your location, you may have certain rights regarding your personal information, such as:</p>
						<ul className='list-disc pl-6 mb-4'>
							<li>The right to access the personal information we have about you.</li>
							<li>The right to request that we correct or update your personal information.</li>
							<li>The right to request that we delete your personal information.</li>
							<li>The right to object to the processing of your personal information.</li>
							<li>The right to request a copy of your personal information in a structured, commonly used, and machine-readable format.</li>
						</ul>
						<p>To exercise these rights, please contact us using the information provided in the "Contact Information" section below.</p>

						<h2 className='text-xl font-semibold yuumi-gradient-text mt-6 mb-4'>11. Changes to This Privacy Policy</h2>
						<p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.</p>

						<h2 className='text-xl font-semibold yuumi-gradient-text mt-6 mb-4'>12. Contact Information</h2>
						<p>
							If you have any questions about this Privacy Policy, please contact us at{' '}
							<a href='mailto:privacy@yuumai.com' className='text-yuumi-primary hover:underline'>
								privacy@yuumai.com
							</a>
							.
						</p>

						<h2 className='text-xl font-semibold yuumi-gradient-text mt-6 mb-4'>13. Consent</h2>
						<p>By using our Services, you consent to our Privacy Policy and agree to its terms.</p>
					</div>
				</div>

				<div className='text-center mb-8'>
					<Link href='/' className='text-yuumi-primary hover:underline'>
						Return to Home
					</Link>
				</div>
			</div>
		</MainLayout>
	);
}
