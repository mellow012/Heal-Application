
'use client'

import { useAuth, useUser, SignOutButton } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Heart, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Calendar,
  BarChart3,
  Building2
} from 'lucide-react'
import { useState } from 'react'

const Navbar = () => {
  const { user } = useUser()
  const { isSignedIn } = useAuth()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'E-Health Passport', href: '/e-passport', icon: Heart },
    { name: 'Appointments', href: '/appointments', icon: Calendar },
    { name: 'Health Facility Portal', href: '/hospital', icon: Building2 },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Matching HealHealth branding */}
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
          {isSignedIn && (
            <div className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon
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
                )
              })}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                {/* User Avatar & Info */}
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-800">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {user?.emailAddresses[0]?.emailAddress}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                </div>

                {/* Settings & Logout */}
                <div className="flex items-center gap-2">
                  <Link
                    href="/settings"
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Settings"
                    aria-label="Settings"
                  >
                    <Settings className="h-5 w-5" aria-hidden="true" />
                  </Link>
                  <SignOutButton>
                    <button
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Sign Out"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Sign Out</span>
                    </button>
                  </SignOutButton>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/hospital"
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium"
                  aria-label="Health Facility Portal"
                >
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  Health Facility Portal
                </Link>
                <Link
                  href="/sign-in"
                  className="text-slate-600 hover:text-slate-800 font-medium"
                  aria-label="Sign In"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  aria-label="Get Started"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            {isSignedIn && (
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
        {isSignedIn && isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-3">
            <div className="flex flex-col space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
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
                )
              })}
            </div>
            
            {/* Mobile User Info */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation for Signed-Out Users */}
        {!isSignedIn && isMobileMenuOpen && (
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
  )
}

export default Navbar