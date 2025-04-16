"use client";

import React from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <MainLayout title="Terms of Service - Yuum.Ai Dashboard">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold yuumi-gradient-text mb-6">Terms of Service</h1>
        
        <div className="bg-yuumi-dark rounded-lg shadow-yuumi p-6 mb-8 animate-fade-in">
          <p className="text-yuumi-light mb-4">Last Updated: April 15, 2025</p>
          
          <div className="prose prose-invert max-w-none text-yuumi-light">
            <h2 className="text-xl font-semibold yuumi-gradient-text mt-6 mb-4">1. Introduction</h2>
            <p>
              Welcome to Yuum.Ai Dashboard ("we," "our," or "us"). By accessing or using our website, services, applications, and content (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). Please read these Terms carefully.
            </p>
            
            <h2 className="text-xl font-semibold yuumi-gradient-text mt-6 mb-4">2. Acceptance of Terms</h2>
            <p>
              By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Services.
            </p>
            
            <h2 className="text-xl font-semibold yuumi-gradient-text mt-6 mb-4">3. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. If we make changes, we will provide notice by updating the date at the top of these Terms and by maintaining a current version of the Terms at <Link href="/legal/terms" className="text-yuumi-primary hover:underline">https://yuumai.com/legal/terms</Link>. Your continued use of our Services after the date any such changes become effective constitutes your acceptance of the new Terms.
            </p>
            
            <h2 className="text-xl font-semibold yuumi-gradient-text mt-6 mb-4">4. Privacy Policy</h2>
            <p>
              Please refer to our <Link href="/legal/privacy" className="text-yuumi-primary hover:underline">Privacy Policy</Link> for information about how we collect, use, and disclose information about you.
            </p>
            
            <h2 className="text-xl font-semibold yuumi-gradient-text mt-6 mb-4">5. Account Registration</h2>
            <p>
              To use certain features of our Services, you may be required to register for an account. When you register, you agree to provide accurate, current, and complete information and to update this information to maintain its accuracy. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
            
            <h2 className="text-xl font-semibold yuumi-gradient-text mt-6 mb-4">6. User Conduct</h2>
            <p>
              You agree not to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use the Services in any way that violates any applicable law or regulation</li>
              <li>Use the Services for any harmful, fraudulent, deceptive, or manipulative purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Services</li>
              <li>Interfere with or disrupt the Services or servers or networks connected to the Services</li>
              <li>Circumvent, disable, or otherwise interfere with security-related features of the Services</li>
              <li>Use any robot, spider, crawler, scraper, or other automated means to access the Services</li>
              <li>Introduce any viruses, trojan horses, worms, logic bombs, or other harmful material</li>
              <li>Collect or harvest any information from the Services</li>
              <li>Impersonate or misrepresent your affiliation with any person or entity</li>
            </ul>
            
            <h2 className="text-xl font-semibold yuumi-gradient-text mt-6 mb-4">7. Intellectual Property</h2>
            <p>
              The Services and their contents, features, and functionality are owned by us, our licensors, or other providers and are protected by copyright, trademark, patent, and other intellectual property laws. You may not use, reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Services, except as permitted by these Terms.
            </p>
            
            <h2 className="text-xl font-semibold yuumi-gradient-text mt-6 mb-4">8. Third-Party Services</h2>
            <p>
              Our Services may contain links to third-party websites or services that are not owned or controlled by us. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites or services. You further acknowledge and agree that we shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods, or services available on or through any such websites or services.
            </p>
            
            <h2 className="text-xl font-semibold yuumi-gradient-text mt-6 mb-4">9. Termination</h2>
            <p>
              We may terminate or suspend your access to all or part of the Services, without notice, for any conduct that we, in our sole discretion, believe is in violation of these Terms or is harmful to other users of the Services, us, or third parties, or for any other reason.
            </p>
            
            <h2 className="text-xl font-semibold yuumi-gradient-text mt-6 mb-4">10. Disclaimer of Warranties</h2>
            <p>
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
            
            <h2 className="text-xl font-semibold yuumi-gradient-text mt-6 mb-4">11. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, PUNITIVE, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION DAMAGES FOR LOSS OF PROFITS, GOODWILL, USE, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATING TO THE USE OF, OR INABILITY TO USE, THE SERVICES.
            </p>
            
            <h2 className="text-xl font-semibold yuumi-gradient-text mt-6 mb-4">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which we are located, without regard to its conflict of law provisions.
            </p>
            
            <h2 className="text-xl font-semibold yuumi-gradient-text mt-6 mb-4">13. Contact Information</h2>
            <p>
              If you have any questions about these Terms, please contact us at <a href="mailto:legal@yuumai.com" className="text-yuumi-primary hover:underline">legal@yuumai.com</a>.
            </p>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <Link href="/" className="text-yuumi-primary hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
