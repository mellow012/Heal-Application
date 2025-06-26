
     'use server'

     import { currentUser } from '@clerk/nextjs/server'
     import { createClerkClient } from '@clerk/backend'
     import { db } from '@/lib/firebase'
     import { doc, setDoc } from 'firebase/firestore'

     const clerk = createClerkClient({
       secretKey: process.env.CLERK_SECRET_KEY,
     })

     export async function assignAdminRole(hospitalId: string, hospitalName: string) {
       const user = await currentUser()
       if (!user) {
         console.error('AssignAdminRole: User not authenticated')
         throw new Error('User not authenticated')
       }

       const userId = user.id
       console.log('AssignAdminRole: Assigning role', { userId, hospitalId, hospitalName })

       try {
         // Update user metadata using Clerk client
         await clerk.users.updateUser(userId, {
           publicMetadata: {
             role: 'admin',
             hospitalId,
             hospitalName,
           },
         })

         // Sync with Firestore
         await setDoc(doc(db, `users/${userId}/hospitalMembership`), {
           hospitalId,
           hospitalName,
           role: 'admin',
           joinedAt: new Date(),
         })

         console.log('AssignAdminRole: Success', { userId, hospitalId })
         return { success: true, userId }
       } catch (error) {
         console.error('AssignAdminRole: Error updating user', error)
         throw new Error('Failed to assign admin role')
       }
     }
    