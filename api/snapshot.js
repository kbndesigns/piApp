// GET /api/snapshot  → returns latest data from Firebase (fast reads)
// Requires env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
// Collection: pi_snapshots / latest

const admin = require('firebase-admin');

if (!admin.apps.length) {
  const key = process.env.FIREBASE_PRIVATE_KEY || '';
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: key.replace(/\\n/g, '\n')
    })
  });
}
const db = admin.firestore();

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'GET only' });

  try {
    const doc = await db.collection('pi_snapshots').doc('latest').get();
    if (!doc.exists) {
      return res.status(200).json({ success: false, message: 'No snapshot yet. Trigger a write or manual sync.' });
    }
    const data = doc.data() || {};
    return res.status(200).json({ success: true, ...data });
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message || 'Firebase error' });
  }
};
