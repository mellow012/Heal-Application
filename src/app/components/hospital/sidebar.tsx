'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Building2,
  Users,
  UserCheck,
  FileText,
  Pill,
  Calendar,
  Activity,
  Brain,
  AlertTriangle,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Staff Management', href: '/dashboard/staff', icon: Users },
  { name: 'Patient Registry', href: '/dashboard/patients', icon: UserCheck },
  { name: 'Medical Records', href: '/dashboard/records', icon: FileText },
  { name: 'Prescriptions', href: '/dashboard/prescriptions', icon: Pill },
  { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
  { name: 'AI Diagnostics', href: '/dashboard/ai-tools', icon: Brain },
  { name: 'Emergency', href: '/dashboard/emergency', icon: AlertTriangle },
  { name: 'Verification', href: '/dashboard/verification', icon: UserCheck },
  { name: 'Analytics', href: '/dashboard/analytics', icon: Activity },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function HospitalSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 shadow-lg transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              HealthCare
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
