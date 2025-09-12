import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          
          {/* Logo and Description */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="text-lg font-bold text-text mb-2">AISync</h3>
            <p className="text-text-secondary text-sm text-center md:text-left max-w-md">
              Advanced AI chat platform powered by multiple AI models for intelligent conversations and assistance.
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <Link 
              href="/privacy" 
              className="text-text-secondary hover:text-primary transition-colors duration-200 text-sm"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms" 
              className="text-text-secondary hover:text-primary transition-colors duration-200 text-sm"
            >
              Terms of Service
            </Link>
            <div className="text-text-secondary text-sm">
              © {new Date().getFullYear()} AISync. All rights reserved.
            </div>
          </div>

        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-text-secondary text-xs">
              Powered by OpenAI, Anthropic, and other leading AI providers
            </div>
            <div className="text-text-secondary text-xs">
              Contact: support@aisyncs.org
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
