// GET /api/sync?bump=1&secret=...
// Called by GAS after any write. Pulls getSnapshot from GAS and saves to Firebase.
// Env: GAS_URL, GAS_SECRET, SYNC_SECRET, FIREBASE_*

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
  const secret = req.query.secret || (req.body && req.body.secret);
  if (secret !== process.env.SYNC_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    // Call GAS getSnapshot (system)
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
      return res.status(200).json({ success: false, message: (snap && snap.message) || 'getSnapshot failed' });
    }

    const now = Date.now();
    await db.collection('piapp_snap').doc('latest').set({
      ...snap,
      savedAt: now
    });
    await db.collection('piapp_meta').doc('sync').set({
      lastSyncAt: now,
      builtAt: snap.builtAt || null,
      piCount: (snap.pis || []).length,
      paymentCount: (snap.payments || []).length
    }, { merge: true });

    return res.status(200).json({
      success: true,
      saved: true,
      piCount: (snap.pis || []).length,
      paymentCount: (snap.payments || []).length
    });
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message || 'Sync failed' });
  }
};
