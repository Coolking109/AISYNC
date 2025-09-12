'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, ArrowLeft, Users, Target, Zap, Shield, Globe, Heart, Code, Lightbulb, Rocket, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const AboutPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary to-bg-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-text-secondary hover:text-text transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200"
          >
            <Brain className="w-8 h-8 text-accent animate-glow" />
            <h1 className="text-2xl font-bold gradient-text">AISync</h1>
          </Link>
          
          <Link
            href="/chat"
            className="bg-gradient-to-r from-accent to-accent-secondary hover:shadow-neon text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 hover:scale-105"
          >
            Start Chatting
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl animate-pulse"></div>
              <Brain className="w-24 h-24 text-accent animate-float mx-auto relative" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up">
            About <span className="gradient-text">AISync</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Revolutionizing AI interaction by bringing together the world's most advanced AI models in one unified platform.
          </p>
        </div>

        {/* Mission Section */}
        <div className="glass rounded-3xl p-8 md:p-12 mb-16 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-4 mb-6">
            <Target className="w-8 h-8 text-accent" />
            <h2 className="text-3xl font-bold gradient-text">Our Mission</h2>
          </div>
          <p className="text-lg text-text-secondary leading-relaxed">
            At AISync, we believe that artificial intelligence should be accessible, powerful, and collaborative. Our mission is to democratize access to cutting-edge AI technology by creating a platform where multiple AI models work together to provide the most comprehensive, accurate, and helpful responses possible.
          </p>
        </div>

        {/* What Makes Us Different */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-12 gradient-text animate-slide-up">What Makes Us Different</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass rounded-2xl p-6 hover:shadow-neon transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <Zap className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-text">Multi-Model Intelligence</h3>
              <p className="text-text-secondary">
                Access GPT-4, Gemini, Claude, Cohere, Mistral, and our exclusive AISync Nexus all in one conversation.
              </p>
            </div>
            
            <div className="glass rounded-2xl p-6 hover:shadow-neon transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Shield className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-text">Privacy First</h3>
              <p className="text-text-secondary">
                Your conversations are secure with end-to-end encryption and we never store your personal data.
              </p>
            </div>
            
            <div className="glass rounded-2xl p-6 hover:shadow-neon transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Globe className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-text">Global Accessibility</h3>
              <p className="text-text-secondary">
                Available worldwide with support for multiple languages including English, Spanish, French, and German.
              </p>
            </div>
            
            <div className="glass rounded-2xl p-6 hover:shadow-neon transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Lightbulb className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-text">Intelligent Synthesis</h3>
              <p className="text-text-secondary">
                Our platform doesn't just give you multiple answers - it synthesizes the best insights from all models.
              </p>
            </div>
            
            <div className="glass rounded-2xl p-6 hover:shadow-neon transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <Rocket className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-text">Cutting-Edge Features</h3>
              <p className="text-text-secondary">
                Vision AI, document analysis, web search integration, and continuous learning capabilities.
              </p>
            </div>
            
            <div className="glass rounded-2xl p-6 hover:shadow-neon transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <Heart className="w-12 h-12 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-3 text-text">User-Centric Design</h3>
              <p className="text-text-secondary">
                Built with beautiful, intuitive interfaces that make advanced AI accessible to everyone.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center glass rounded-3xl p-8 md:p-12 animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 gradient-text">
            Ready to Experience the Future of AI?
          </h2>
          <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already experiencing the power of multi-model AI collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chat"
              className="bg-gradient-to-r from-accent to-accent-secondary hover:shadow-neon text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Start Your First Conversation
            </Link>
            {!user && (
              <Link
                href="/?auth=register"
                className="border border-accent text-accent hover:bg-accent hover:text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Create Free Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Default export for easier importing
export default AboutPage;