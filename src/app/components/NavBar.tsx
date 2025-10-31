'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../components/AuthProvide';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { 
  Heart, 
  User, 
  LogOut, 
  Menu, 
  X,
  BarChart3,
  Building2
} from 'lucide-react';

export default function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine navigation based on user role
  const navigation = user?.customClaims?.role === 'hospital_admin' ? [
    { name: 'Dashboard', href: '/hospital-admin/dashboard', icon: BarChart3 },
    { name: 'Staff Management', href: '/hospital-admin/staff', icon: User }, // Assuming User icon for simplicity
    { name: 'Patient Management', href: '/hospital-admin/patients', icon: Heart }, // Assuming Heart icon
    { name: 'Hospital Profile', href: '/hospital-admin/profile/edit', icon: Building2 },
  ] : [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Health Facility Portal', href: '/hospital', icon: Building2 },
  ];

  const isActive = (href) => pathname === href;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
      setIsDropdownOpen(false);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative p-3 bg-white rounded-2xl shadow-md group-hover:shadow-lg transition-all duration-300">
              <Heart className="h-8 w-8 text-red-500" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold text-slate-800">
                Heal<span className="text-blue-600">Health</span>
              </h1>
              <p className="text-xs text-blue-600 font-medium -mt-1">Healthcare Made Simple</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {!loading && user && (
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                    aria-label={item.name}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {!loading && user ? (
              <div className="relative flex items-center gap-3">
                {/* User Avatar & Info */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-800">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold hover:ring-2 hover:ring-blue-200 transition-all"
                    aria-label="User menu"
                    aria-expanded={isDropdownOpen}
                  >
                    {user.displayName?.[0] || user.email?.[0]}
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-14 right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50"
                  >
                    <Link
                      href="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                      aria-label="Profile"
                    >
                      <User className="h-4 w-4" aria-hidden="true" />
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 w-full text-left"
                      aria-label="Sign Out"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 p-8">
                <Link
                  href="/hospital"
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium"
                  aria-label="Health Facility Portal"
                >
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  Health Facility Portal
                </Link>
                <Link
                  href="/login"
                  className="text-slate-600 hover:text-slate-800 font-medium"
                  aria-label="Sign In"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  aria-label="Get Started"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {!loading && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {!loading && user && isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-3">
            <div className="flex flex-col space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                    aria-label={item.name}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {item.name}
                  </Link>
                );
              })}
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                  isActive('/profile')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
                aria-label="Profile"
              >
                <User className="h-5 w-5" aria-hidden="true" />
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                aria-label="Sign Out"
              >
                <LogOut className="h-5 w-5" aria-hidden="true" />
                Sign Out
              </button>
            </div>

            {/* Mobile User Info */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.displayName?.[0] || user.email?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {user.displayName || 'User'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation for Signed-Out Users */}
        {!loading && !user && isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-3">
            <div className="flex flex-col space-y-1">
              <Link
                href="/hospital"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                aria-label="Health Facility Portal"
              >
                <Building2 className="h-5 w-5" aria-hidden="true" />
                Health Facility Portal
              </Link>
              <Link
                href="/sign-in"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                aria-label="Sign In"
              >
                <User className="h-5 w-5" aria-hidden="true" />
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50"
                aria-label="Get Started"
              >
                <User className="h-5 w-5" aria-hidden="true" />
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
``}