'use client';

import React from 'react';
import { SignInButton, useAuth } from '@clerk/nextjs';
import { Stethoscope, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Home: Clerk userId:', userId);
    setTimeout(() => {
      setIsLoading(false);
      setIsVisible(true);
    }, 500);
  }, [userId]);

  if (isLoading || !isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading HealHealth Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"1.5\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`flex items-center justify-center gap-3 mb-10 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Stethoscope className="h-10 w-10 text-blue-500" />
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white">
                HealHealth <span className="text-blue-300">Admin</span>
              </h1>
            </div>

            <div className={`transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Manage Patient Care,
                <br />
                <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  Seamlessly
                </span>
              </h2>
            </div>

            <div className={`transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <p className="text-xl lg:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto leading-relaxed">
                Built for Malawi’s hospitals, HealHealth Admin empowers staff to manage patient records securely.
              </p>
            </div>

            <div className={`flex justify-center items-center mb-12 transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <SignInButton mode="modal" afterSignInUrl="/dashboard">
                <button className="group bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-3 min-w-[200px] justify-center">
                  Sign In
                  <div className="w-2 h-2 bg-blue-200 rounded-full group-hover:scale-125 transition-transform duration-300" />
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}