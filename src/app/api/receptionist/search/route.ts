import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    console.log('API: /api/receptionist/search called');
    const { query } = await request.json();
    console.log('API: Search query', query);

    if (!query || query.length < 3) {
      return NextResponse.json({ success: false, error: 'Query too short' }, { status: 400 });
    }

    const db = adminDb;
    // Search by phone
    let snap = await db.collection('patients')
      .where('phone', '==', query)
      .limit(1)
      .get();

    if (snap.empty) {
      // Search by national ID
      snap = await db.collection('patients')
        .where('nationalId', '==', query)
        .limit(1)
        .get();
    }

    if (snap.empty) {
      console.log('API: No patient found');
      return NextResponse.json({ success: true, data: null });
    }

    const doc = snap.docs[0];
    const data = { uid: doc.id, ...doc.data() };
    console.log('API: Patient found', data.name);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API: Search error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}