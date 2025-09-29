import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Terms and Conditions - DevDocsFile',
  description: 'Read our Terms and Conditions to understand the rules and guidelines for using DevDocsFile.',
};

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Terms and Conditions</h1>
        <p className="text-muted-foreground">Last updated: September 29, 2025</p>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <div className="mb-8 p-6 bg-muted/20 rounded-lg">
          <p className="italic">
            Please read these Terms and Conditions ("Terms") carefully before using the DevDocsFile website and services.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
          <p>Permission is granted to temporarily access the materials on DevDocsFile's website for personal, non-commercial transitory viewing only.</p>
          <p className="mt-2">This is the grant of a license, not a transfer of title, and under this license you may not:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to reverse engineer any software</li>
            <li>Remove any copyright or other proprietary notations</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p>When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. User Content</h2>
          <p>Our service allows you to post, link, store, share and otherwise make available certain information, text, or other material. You are responsible for the content that you post on or through the service.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Prohibited Uses</h2>
          <p>You may use our service only for lawful purposes and in accordance with these Terms. You agree not to use our service:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>In any way that violates any applicable law or regulation</li>
            <li>To transmit any advertising or promotional material without our prior written consent</li>
            <li>To impersonate or attempt to impersonate the Company or a Company employee</li>
            <li>To engage in any other conduct that restricts or inhibits anyone's use of the service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
          <p>The service and its original content, features, and functionality are and will remain the exclusive property of DevDocsFile and its licensors.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
          <p>We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
          <p>In no event shall DevDocsFile, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
          <p>These Terms shall be governed and construed in accordance with the laws of [Your Country], without regard to its conflict of law provisions.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at:</p>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="font-medium">Email: <a href="mailto:support@devdocsfile.com" className="text-primary hover:underline">support@devdocsfile.com</a></p>
          </div>
        </section>
      </div>

      <div className="mt-12 text-center">
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}