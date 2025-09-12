'use client';

import React from 'react';
import { Brain, Sparkles, Zap, Shield, ArrowRight, MessageSquare, Globe, Users } from 'lucide-react';
import Link from 'next/link';

export const HomePage: React.FC = () => {
  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Multi-Model Intelligence",
      description: "Get answers from OpenAI, Google, Anthropic, Cohere & Mistral simultaneously for comprehensive insights."
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Smart Consensus",
      description: "Our AI aggregates responses from multiple models to provide you with the most accurate and balanced answers."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Experience rapid response times with our optimized infrastructure and parallel model processing."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Privacy First",
      description: "Your conversations stay local in your browser. We don't store or track your personal data."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Web Integration",
      description: "Access real-time information from the web with source citations for verified answers."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Session Management",
      description: "Organize your conversations with smart session management and chat history."
    }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main Hero Content */}
          <div className="glass rounded-3xl p-8 md:p-12 mb-8 backdrop-blur-xl shadow-glass animate-fade-in">
            <div className="flex justify-center mb-6">
              <Brain className="w-20 h-20 text-accent animate-float mx-auto" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-up">
              <span className="gradient-text">AISync</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Experience the power of multiple AI models working together. Get comprehensive, accurate answers from the world's leading AI systems.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center items-center animate-slide-up">
              <Link 
                href="/chat"
                className="bg-gradient-to-r from-accent to-accent-secondary hover:shadow-neon text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center space-x-2 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Start Chatting</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              
              <div className="glass px-6 py-3 rounded-xl">
                <span className="text-sm gradient-text font-medium">
                  Powered by 5+ AI Models
                </span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-fade-in">
            <div className="glass rounded-2xl p-6 hover:shadow-neon transition-all duration-300 hover:scale-105">
              <div className="text-3xl font-bold gradient-text mb-2">5+</div>
              <div className="text-text-secondary">AI Models</div>
            </div>
            <div className="glass rounded-2xl p-6 hover:shadow-neon transition-all duration-300 hover:scale-105">
              <div className="text-3xl font-bold gradient-text mb-2">∞</div>
              <div className="text-text-secondary">Conversations</div>
            </div>
            <div className="glass rounded-2xl p-6 hover:shadow-neon transition-all duration-300 hover:scale-105">
              <div className="text-3xl font-bold gradient-text mb-2">100%</div>
              <div className="text-text-secondary">Private</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4 animate-fade-in">
              Powerful Features
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto animate-fade-in">
              Discover what makes our AI chat platform unique and powerful
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass rounded-2xl p-8 hover:shadow-neon transition-all duration-300 hover:scale-105 animate-slide-up"
              >
                <div className="text-accent mb-4 animate-float">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold gradient-text mb-3">
                  {feature.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-3xl p-8 md:p-12 backdrop-blur-xl border border-glass shadow-glass animate-fade-in">
            <Sparkles className="w-16 h-16 text-accent mx-auto mb-6 animate-float" />
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-6">
              Ready to Experience Multi-Model AI?
            </h2>
            <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already experiencing the future of AI-powered conversations.
            </p>
            <Link 
              href="/chat"
              className="bg-gradient-to-r from-accent-secondary to-accent-tertiary hover:shadow-neon-purple text-white px-10 py-5 rounded-2xl font-semibold text-lg flex items-center space-x-3 mx-auto transition-all duration-300 hover:scale-105 active:scale-95 w-fit"
            >
              <Brain className="w-6 h-6" />
              <span>Start Your AI Journey</span>
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 border-t border-glass">
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-2xl p-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="w-8 h-8 text-accent animate-glow" />
              <span className="text-2xl font-bold gradient-text">AISync</span>
            </div>
            <p className="text-text-secondary mb-4">
              Powered by OpenAI • Google • Anthropic • Cohere • Mistral
            </p>
            <div className="flex items-center justify-center space-x-6 mb-4">
              <Link 
                href="/about"
                className="text-sm text-text-secondary hover:text-accent transition-colors duration-200"
              >
                About Us
              </Link>
              <Link 
                href="/privacy"
                className="text-sm text-text-secondary hover:text-accent transition-colors duration-200"
              >
                Privacy
              </Link>
            </div>
            <div className="text-sm text-text-secondary opacity-70">
              © 2025 AISync. Built with privacy in mind.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
