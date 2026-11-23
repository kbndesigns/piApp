const crypto = require('crypto');
let _db = null;

function db() {
  if (_db) return _db;
  const admin = require('firebase-admin');
  if (!admin.apps.length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
  return (_db = admin.firestore());
}

const TTL = { getInitialData: 60, getStaffLogs: 60, getAuditLogs: 120 };

async function cached(fn, args, fetcher) {
  const key = fn + ':' + crypto.createHash('md5').update(JSON.stringify(args)).digest('hex').slice(0, 12);
  const ref = db().collection('pi_cache').doc(key);
  const doc = await ref.get();
  if (doc.exists && doc.data().exp > Date.now()) {
    return doc.data().val;
  }
  const val = await fetcher();
  const ttl = (TTL[fn] || 60) * 1000;
  await ref.set({ val, exp: Date.now() + ttl });
  return val;
}

module.exports = { cached };
