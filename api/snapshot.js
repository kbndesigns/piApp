const admin = require('firebase-admin');

if (!admin.apps.length) {
  let cred;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    cred = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  } else {
    cred = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    });
  }
  admin.initializeApp({ credential: cred });
}
const db = admin.firestore();

module.exports = async (req, res) => {
res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
  if (req.method !== 'GET') return res.status(405).json({ success: false });

  try {
    const doc = await db.collection('piapp_snap').doc('latest').get();
    if (!doc.exists) return res.status(200).json({ success: false, message: 'No snapshot' });
    
    const data = doc.data() || {};
    // Trim for speed — only essential fields
    if (data.pis && data.pis.length > 200) {
      data.pis = data.pis.slice(0, 200);
    }
    return res.status(200).json({ success: true, ...data });
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message });
  }
};
