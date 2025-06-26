  import { Webhook } from 'svix'
       import { headers } from 'next/headers'
       import { db } from '@/lib/firebase'
       import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore'

       export async function POST(req: Request) {
         const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

         if (!WEBHOOK_SECRET) {
           console.error('ClerkWebhook: Missing WEBHOOK_SECRET')
           return new Response('Missing webhook secret', { status: 500 })
         }

         // Get headers
         const headerPayload = headers()
         const svix_id = headerPayload.get('svix-id')
         const svix_timestamp = headerPayload.get('svix-timestamp')
         const svix_signature = headerPayload.get('svix-signature')

         if (!svix_id || !svix_timestamp || !svix_signature) {
           console.error('ClerkWebhook: Missing svix headers')
           return new Response('Missing svix headers', { status: 400 })
         }

         // Get body
         let payload
         try {
           payload = await req.json()
         } catch (err) {
           console.error('ClerkWebhook: Error parsing payload', err)
           return new Response('Error parsing payload', { status: 400 })
         }

         // Verify webhook
         const webhook = new Webhook(WEBHOOK_SECRET)
         let evt
         try {
           evt = webhook.verify(JSON.stringify(payload), {
             'svix-id': svix_id,
             'svix-timestamp': svix_timestamp,
             'svix-signature': svix_signature,
           })
         } catch (err) {
           console.error('ClerkWebhook: Error verifying webhook', err)
           return new Response('Error verifying webhook', { status: 400 })
         }

         // Handle user.deleted event
         if (evt.type === 'user.deleted' && evt.data.id) {
           const userId = evt.data.id
           console.log('ClerkWebhook: Processing user.deleted', { userId })

           try {
             // Delete user document and subcollections
             const userRef = doc(db, `users/${userId}`)
             await deleteDoc(userRef)

             // Delete hospitalMembership subcollection
             const membershipQuery = query(collection(db, `users/${userId}/hospitalMembership`))
             const membershipDocs = await getDocs(membershipQuery)
             for (const doc of membershipDocs.docs) {
               await deleteDoc(doc.ref)
             }

             console.log('ClerkWebhook: Deleted Firestore data', { userId })
             return new Response('User data deleted', { status: 200 })
           } catch (err) {
             console.error('ClerkWebhook: Error deleting Firestore data', err)
             return new Response('Error deleting Firestore data', { status: 500 })
           }
         }

         return new Response('Event not handled', { status: 200 })
       }