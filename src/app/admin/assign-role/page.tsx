
    'use client'

     import { useState, useEffect } from 'react'
     import { useRouter } from 'next/navigation'
     import { useAuth, useUser, useSession } from '@clerk/nextjs'
     import { Input } from '@/components/ui/input'
     import { Button } from '@/components/ui/button'
     import { toast } from 'sonner'
     import { assignAdminRole } from '../../api/admin/actions/assignRole'

     export default function AssignAdminRolePage() {
       const [hospitalId, setHospitalId] = useState('')
       const [hospitalName, setHospitalName] = useState('')
       const [loading, setLoading] = useState(false)
       const router = useRouter()
       const { isSignedIn, isLoaded: authLoaded, userId } = useAuth()
       const { user, isLoaded: userLoaded } = useUser()
       const { session, isLoaded: sessionLoaded } = useSession()

       useEffect(() => {
         console.log('AssignAdminRolePage: Clerk state', {
           authLoaded,
           isSignedIn,
           userId,
           userLoaded,
           userMetadata: user?.publicMetadata,
           sessionLoaded,
           sessionStatus: session?.status,
         })
         if (authLoaded && sessionLoaded && isSignedIn && !userId) {
           console.log('AssignAdminRolePage: No userId, attempting session reload')
           session?.reload().catch((e) => console.error('Session reload failed', e))
         }
         if (authLoaded && !isSignedIn) {
           console.log('AssignAdminRolePage: Not signed in, redirecting to /sign-in')
           router.push('/sign-in')
         }
       }, [authLoaded, isSignedIn, userId, userLoaded, sessionLoaded, session, router])

       const handleSubmit = async (e: React.FormEvent) => {
         e.preventDefault()
         setLoading(true)
         try {
           console.log('AssignAdminRolePage: Submitting', { hospitalId, hospitalName, userId })
           const result = await assignAdminRole(hospitalId, hospitalName)
           if (result.success) {
             toast.success('Admin role assigned', {
               description: `Assigned admin for ${hospitalName}`,
             })
             router.push('/hospital/onboarding')
           }
         } catch (error) {
           console.error('AssignAdminRolePage: Error', error)
           toast.error('Failed to assign admin role', {
             description: 'Please try again',
           })
         } finally {
           setLoading(false)
         }
       }

       if (!authLoaded || !userLoaded || !sessionLoaded) {
         return (
           <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
             <div className="text-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
               <p>Loading...</p>
             </div>
           </div>
         )
       }

       return (
         <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
           <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-lg">
             <h1 className="text-2xl font-bold mb-4">Assign Admin Role</h1>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium">Hospital ID</label>
                 <Input
                   value={hospitalId}
                   onChange={(e) => setHospitalId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                   placeholder="e.g., mzuzu-central"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium">Hospital Name</label>
                 <Input
                   value={hospitalName}
                   onChange={(e) => setHospitalName(e.target.value)}
                   placeholder="e.g., Mzuzu Central Hospital"
                 />
               </div>
               <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                 {loading ? 'Assigning...' : 'Assign Admin Role'}
               </Button>
             </form>
           </div>
         </div>
       )
     }
     