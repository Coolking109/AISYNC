import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - AISync',
  description: 'Terms of Service for AISync AI chatbot platform',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-surface rounded-2xl p-8 shadow-lg border border-border">
          <h1 className="text-4xl font-bold text-text mb-2">Terms of Service</h1>
          <p className="text-text-secondary mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-invert max-w-none space-y-8">
            
            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">1. Acceptance of Terms</h2>
              <p className="text-text-secondary leading-relaxed">
                By accessing and using AISync ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">2. Description of Service</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                AISync is an AI-powered chatbot platform that provides intelligent responses and assistance through various AI models. 
                The service includes:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>AI-powered chat conversations</li>
                <li>Multiple AI model integration</li>
                <li>User account management</li>
                <li>Session history and management</li>
                <li>Image analysis capabilities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">3. User Accounts</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your account information</li>
                <li>Keep your password secure and confidential</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">4. Acceptable Use</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Generate harmful, illegal, or offensive content</li>
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit malware or harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the service for commercial purposes without permission</li>
                <li>Generate spam or unsolicited communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">5. AI-Generated Content</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                You acknowledge that:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>AI responses may not always be accurate or appropriate</li>
                <li>You should verify important information independently</li>
                <li>AISync is not responsible for decisions made based on AI responses</li>
                <li>AI-generated content should not be considered professional advice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">6. Privacy and Data</h2>
              <p className="text-text-secondary leading-relaxed">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, 
                to understand our practices regarding the collection and use of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">7. Intellectual Property</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                The Service and its original content, features, and functionality are and will remain the exclusive property of AISync. 
                The Service is protected by copyright, trademark, and other laws.
              </p>
              <p className="text-text-secondary leading-relaxed">
                You retain ownership of content you input into the Service, but grant us a license to use it for providing the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">8. Service Availability</h2>
              <p className="text-text-secondary leading-relaxed">
                We strive to maintain high availability but do not guarantee uninterrupted service. We may modify, suspend, 
                or discontinue the Service at any time with or without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">9. Limitation of Liability</h2>
              <p className="text-text-secondary leading-relaxed">
                AISync shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
                resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">10. Termination</h2>
              <p className="text-text-secondary leading-relaxed">
                We may terminate or suspend your account immediately, without prior notice or liability, 
                for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">11. Changes to Terms</h2>
              <p className="text-text-secondary leading-relaxed">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">12. Contact Information</h2>
              <p className="text-text-secondary leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-background p-4 rounded-lg mt-4 border border-border">
                <p className="text-text-secondary">
                  <strong>Email:</strong> legal@aisyncs.org<br />
                  <strong>Website:</strong> aisyncs.org
                </p>
              </div>
            </section>

          </div>
          
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-text-secondary text-center">
              By using AISync, you acknowledge that you have read and understood these Terms of Service 
              and agree to be bound by them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
