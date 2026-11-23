const admin = require('firebase-admin');

if (!admin.apps.length) {
  let cred;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    cred = admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
  } else {
    const key = process.env.FIREBASE_PRIVATE_KEY || '';
    cred = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: key.replace(/\\n/g, '\n')
    });
  }
  admin.initializeApp({ credential: cred });
}
const db = admin.firestore();

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ success: false, message: 'GET only' });

  try {
    const doc = await db.collection('piapp_snap').doc('latest').get();
    if (!doc.exists) {
      return res.status(200).json({ success: false, message: 'No snapshot yet' });
    }
    const data = doc.data() || {};
    return res.status(200).json({ success: true, ...data });
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message || 'Firebase error' });
  }
};
