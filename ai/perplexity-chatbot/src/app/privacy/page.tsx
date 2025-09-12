import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - AISync',
  description: 'Privacy Policy for AISync AI chatbot platform',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-surface rounded-2xl p-8 shadow-lg border border-border">
          <h1 className="text-4xl font-bold text-text mb-2">Privacy Policy</h1>
          <p className="text-text-secondary mb-8">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-invert max-w-none space-y-8">
            
            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">1. Introduction</h2>
              <p className="text-text-secondary leading-relaxed">
                AISync ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our AI chatbot service ("the Service").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-text mb-3 mt-6">Personal Information</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                We collect information you provide directly to us, such as:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Email address (for account creation and communication)</li>
                <li>Username (for account identification)</li>
                <li>Profile information (if you choose to provide it)</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-medium text-text mb-3 mt-6">Usage Information</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Chat conversations and messages</li>
                <li>AI model selections and preferences</li>
                <li>Session history and timestamps</li>
                <li>Feature usage patterns</li>
                <li>Images uploaded for analysis (temporarily processed)</li>
              </ul>

              <h3 className="text-xl font-medium text-text mb-3 mt-6">Technical Information</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>IP address and location data</li>
                <li>Device and browser information</li>
                <li>Operating system details</li>
                <li>Access times and duration</li>
                <li>Referral sources</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">3. How We Use Your Information</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Provide and maintain the AI chatbot service</li>
                <li>Process and respond to your inquiries</li>
                <li>Improve AI model performance and accuracy</li>
                <li>Personalize your experience</li>
                <li>Send important service updates and notifications</li>
                <li>Monitor and analyze usage patterns</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information. We may share your information only in these situations:
              </p>
              
              <h3 className="text-xl font-medium text-text mb-3 mt-6">Third-Party AI Services</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                We use third-party AI services (OpenAI, Anthropic, etc.) to process your conversations. 
                These services may process your messages according to their own privacy policies.
              </p>

              <h3 className="text-xl font-medium text-text mb-3 mt-6">Legal Requirements</h3>
              <p className="text-text-secondary leading-relaxed mb-4">
                We may disclose your information if required by law or to protect our rights and safety.
              </p>

              <h3 className="text-xl font-medium text-text mb-3 mt-6">Service Providers</h3>
              <p className="text-text-secondary leading-relaxed">
                We may share information with trusted service providers who assist in operating our service, 
                subject to confidentiality agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">5. Data Storage and Security</h2>
              
              <h3 className="text-xl font-medium text-text mb-3">Security Measures</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4 mb-4">
                <li>Encrypted data transmission (HTTPS/TLS)</li>
                <li>Secure password hashing and storage</li>
                <li>Regular security audits and updates</li>
                <li>Limited access controls for staff</li>
                <li>Secure cloud infrastructure</li>
              </ul>

              <h3 className="text-xl font-medium text-text mb-3">Data Retention</h3>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Account information: Until account deletion</li>
                <li>Chat conversations: 90 days (or as configured by user)</li>
                <li>Technical logs: 30 days</li>
                <li>Images: Processed temporarily, not stored permanently</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">6. Your Rights and Choices</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correct:</strong> Update or correct inaccurate information</li>
                <li><strong>Delete:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your conversation history</li>
                <li><strong>Restrict:</strong> Limit how we process your data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from non-essential communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">7. Cookies and Tracking</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Analyze site usage and performance</li>
                <li>Improve user experience</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-4">
                You can control cookies through your browser settings, but some features may not work properly if disabled.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">8. Children's Privacy</h2>
              <p className="text-text-secondary leading-relaxed">
                AISync is not intended for children under 13 years of age. We do not knowingly collect personal information 
                from children under 13. If we become aware of such collection, we will delete the information immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">9. International Data Transfers</h2>
              <p className="text-text-secondary leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your data during such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">10. Changes to This Policy</h2>
              <p className="text-text-secondary leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">11. Contact Us</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-background p-4 rounded-lg border border-border">
                <p className="text-text-secondary">
                  <strong>Email:</strong> privacy@aisyncs.org<br />
                  <strong>Data Protection Officer:</strong> dpo@aisyncs.org<br />
                  <strong>Website:</strong> aisyncs.org
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-text mb-4">12. GDPR Compliance</h2>
              <p className="text-text-secondary leading-relaxed">
                If you are in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR). 
                We process your data based on legitimate interests, consent, or contract necessity. 
                You may file a complaint with your local data protection authority if you believe we have violated your rights.
              </p>
            </section>

          </div>
          
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-text-secondary text-center">
              This Privacy Policy is effective as of the date stated above and will remain in effect except with respect to any changes 
              in its provisions in the future, which will be in effect immediately after being posted on this page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
