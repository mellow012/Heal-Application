'use client';

import React from 'react';
import { 
  Heart, 
  Shield, 
  Calendar, 
  Users, 
  Smartphone,
  Stethoscope,
  ArrowRight,
  CheckCircle,
  Star,
  Clock,
  FileText,
  Activity,
  Loader2,
  Sparkles,
  Award,
  Globe,
  LogOut
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { 
  useAuth, 
  useUser, 
  SignInButton, 
  SignUpButton, 
  UserButton,
  SignOutButton 
} from '@clerk/nextjs';

// Animated counter component
const AnimatedCounter = ({ target, suffix = '', duration = 1500 }: { target: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * target));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

// Feature card component - light and welcoming
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: { icon: React.ComponentType<any>; title: string; description: string; delay?: number }) => (
  <div 
    className="group p-8 bg-white rounded-3xl shadow-sm hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 border border-blue-50 hover:border-blue-100"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-300">
      <Icon className="h-7 w-7 text-blue-600" />
    </div>
    <h3 className="text-xl font-semibold text-slate-800 mb-4">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);

// Stats card component - clean and bright
const StatsCard = ({ number, label, suffix = '', icon: Icon }: { number: number; label: string; suffix?: string; icon: React.ComponentType<any> }) => (
  <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-blue-50 hover:shadow-md transition-all duration-300">
    <div className="flex justify-center mb-4">
      <div className="p-3 bg-blue-50 rounded-xl">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
    </div>
    <div className="text-3xl font-bold text-slate-800 mb-2">
      <AnimatedCounter target={number} suffix={suffix} />
    </div>
    <p className="text-slate-600 font-medium">{label}</p>
  </div>
);

// Main component
export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative mb-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
            <div className="absolute inset-0 h-10 w-10 rounded-full bg-blue-100 animate-ping mx-auto opacity-20" />
          </div>
          <p className="text-slate-600 font-medium">Loading HealHealth...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: FileText,
      title: "Digital Health Records",
      description: "Keep all your medical information organized and accessible. From prescriptions to test results, everything in one secure place."
    },
    {
      icon: Calendar,
      title: "Easy Appointment Booking",
      description: "Schedule appointments with ease. Get reminders and manage your healthcare calendar without the hassle."
    },
    {
      icon: Activity,
      title: "Health Insights",
      description: "Track your health progress with smart analytics. Get personalized insights to improve your wellbeing."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your health data is protected with the highest security standards. Your privacy is our top priority."
    },
    {
      icon: Smartphone,
      title: "Works Everywhere",
      description: "Access your health information from any device, anywhere. Designed to work perfectly on mobile and desktop."
    },
    {
      icon: Users,
      title: "Family Care",
      description: "Manage health records for your whole family. Share information securely with healthcare providers."
    }
  ];

  const stats = [
    { number: 25000, label: "Happy Users", suffix: "+", icon: Users },
    { number: 24, label: "Support Available", suffix: "/7", icon: Clock },
    { number: 99, label: "Reliability", suffix: "%", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Top Navigation Bar for Signed In Users */}
      {isSignedIn && (
        <div className="bg-white border-b border-blue-100 px-4 py-3">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              <span className="font-semibold text-slate-800">HealHealth</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Welcome back, {user?.firstName || 'User'}!
              </span>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
          <div className="absolute top-40 right-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-20 left-40 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-5xl mx-auto text-center">
            {/* Brand Logo */}
            <div className={`flex items-center justify-center gap-4 mb-12 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="relative p-4 bg-white rounded-3xl shadow-lg">
                <Heart className="h-10 w-10 text-red-500" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div className="text-left">
                <h1 className="text-3xl lg:text-4xl font-bold text-slate-800">
                  Heal<span className="text-blue-600">Health</span>
                </h1>
                <p className="text-blue-600 text-sm font-medium">Healthcare Made Simple</p>
              </div>
            </div>

            {/* Main Headline */}
            <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h2 className="text-4xl lg:text-6xl font-bold text-slate-800 mb-6 leading-tight">
                {isSignedIn ? (
                  <>
                    Welcome Back to
                    <br />
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Your Health Hub
                    </span>
                  </>
                ) : (
                  <>
                    Healthcare That
                    <br />
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Feels Like Home
                    </span>
                  </>
                )}
              </h2>
            </div>

            {/* Subtitle */}
            <div className={`transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <p className="text-xl lg:text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                {isSignedIn ? (
                  <>
                    Continue managing your health journey with ease. Access your records, 
                    schedule appointments, and stay on top of your wellness goals.
                  </>
                ) : (
                  <>
                    Experience healthcare the way it should be - simple, secure, and designed with you in mind. 
                    Built for Malawi, trusted by thousands.
                  </>
                )}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              {isSignedIn ? (
                <>
                  <button className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-3 min-w-[200px] justify-center">
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                  
                  <SignOutButton>
                    <button className="group bg-white border-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-3 min-w-[200px] justify-center">
                      Sign Out
                      <LogOut className="h-5 w-5" />
                    </button>
                  </SignOutButton>
                </>
              ) : (
                <>
                  <SignUpButton mode="modal">
                    <button className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-3 min-w-[200px] justify-center">
                      Get Started Free
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </SignUpButton>
                  
                  <SignInButton mode="modal">
                    <button className="group bg-white border-2 border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50 px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-3 min-w-[200px] justify-center">
                      Sign In
                      <div className="w-2 h-2 bg-blue-600 rounded-full group-hover:scale-125 transition-transform duration-300" />
                    </button>
                  </SignInButton>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className={`flex flex-wrap justify-center gap-6 transform transition-all duration-1000 delay-900 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-slate-700">Secure & Compliant</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <Award className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-700">Award Winning</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-slate-700">5-Star Rated</span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className={`mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto transform transition-all duration-1000 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 lg:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              <span>What Makes Us Special</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-6 leading-tight">
              Everything You Need for
              <br />
              <span className="text-blue-600">Better Health</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Discover features designed to make your healthcare journey smoother, 
              more organized, and completely stress-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                {...feature}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="py-16 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-lg text-slate-700 mb-6 italic">
                "HealHealth has completely transformed how I manage my family's healthcare. 
                It's so easy to use and gives me peace of mind knowing everything is organized and secure."
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800">Maria Banda</p>
                  <p className="text-sm text-slate-600">Blantyre, Malawi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      {!isSignedIn && (
        <div className="py-20 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
          {/* Subtle background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-2xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-2xl" />
          </div>
          
          <div className="relative container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full font-medium mb-8">
                <Globe className="h-4 w-4" />
                <span>Join Our Community</span>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Ready to Take Control of
                <br />
                Your Health Journey?
              </h2>
              
              <p className="text-xl text-blue-100 mb-10 leading-relaxed max-w-3xl mx-auto">
                Join thousands of families across Malawi who have made healthcare simpler 
                and more accessible with HealHealth.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <SignUpButton mode="modal">
                  <button className="group bg-white text-blue-600 px-10 py-5 rounded-2xl font-semibold text-xl hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-white/25 transform hover:-translate-y-1 flex items-center gap-3 justify-center min-w-[250px]">
                    Start Your Free Trial
                    <Heart className="h-6 w-6 group-hover:scale-110 transition-transform duration-300 text-red-500" />
                  </button>
                </SignUpButton>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-blue-200 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-300" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-300" />
                  <span>30-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-300" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}