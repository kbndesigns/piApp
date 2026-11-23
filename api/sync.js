const admin = require('firebase-admin');

function getDb() {
  if (admin.apps.length) return admin.firestore();
  let cred;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (raw[0] !== '{') raw = Buffer.from(raw, 'base64').toString();
      const sa = JSON.parse(raw);
      if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      cred = admin.credential.cert(sa);
    } else {
      cred = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
      });
    }
    admin.initializeApp({ credential: cred });
    return admin.firestore();
  } catch (e) {
    throw new Error('Firebase init failed: ' + e.message);
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  
  const secret = req.query.secret || (req.body && req.body.secret);
  if (secret !== process.env.SYNC_SECRET) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const db = getDb();
    const gasUrl = process.env.GAS_URL;
    const gasSecret = process.env.GAS_SECRET || process.env.API_SECRET;
    
    if (!gasUrl || !gasSecret) {
      return res.status(500).json({ success: false, message: 'GAS not configured' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);

    const r = await fetch(gasUrl, {
      method: 'POST',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getSnapshot', args: [], secret: gasSecret })
    });
    clearTimeout(timeout);

    const text = await r.text();
    let snap;
    try { snap = JSON.parse(text); } catch (e) {
      return res.status(200).json({ success: false, message: 'Invalid GAS response' });
    }

    if (!snap || snap.success === false) {
      return res.status(200).json({ success: false, message: (snap && snap.message) || 'GAS failed' });
    }

    await db.collection('piapp_snap').doc('latest').set(snap);
    await db.collection('piapp_meta').doc('sync').set({
      lastSync: new Date().toISOString(),
      piCount: (snap.pis || []).length
    });

    return res.status(200).json({ success: true, synced: true, pis: (snap.pis || []).length });
  } catch (e) {
    return res.status(200).json({ success: false, message: e.message || 'Sync error' });
  }
};
