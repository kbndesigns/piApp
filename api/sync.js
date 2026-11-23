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
  const secret = req.query.secret || (req.body && req.body.secret);
  if (secret !== process.env.SYNC_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const gasUrl = process.env.GAS_URL;
    const gasSecret = process.env.GAS_SECRET;
    if (!gasUrl || !gasSecret) {
      return res.status(500).json({ success: false, message: 'GAS not configured' });
    }

    const r = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getSnapshot', args: [], secret: gasSecret })
    });
    const snap = await r.json();
    if (!snap || snap.success === false) {
      return res.status(200).json({ success: false, message: snap && snap.message || 'GAS snapshot failed' });
    }

    await db.collection('piapp_snap').doc('latest').set(snap);
    await db.collection('piapp_meta').doc('sync').set({
      lastSync: new Date().toISOString(),
      piCount: (snap.pis || []).length,
      paymentCount: (snap.payments || []).length
    });

    return res.status(200).json({ success: true, synced: true });
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message });
  }
};
