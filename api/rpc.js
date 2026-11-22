// POST /api/rpc  { fn, args }
// Proxies to GAS doPost with API_SECRET
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'POST only' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const fn = String(body.fn || body.action || '');
    const args = body.args || [];

    if (!fn) {
      return res.status(400).json({ success: false, message: 'fn required' });
    }

    const gasUrl = process.env.GAS_URL;
    const secret = process.env.GAS_SECRET;
    if (!gasUrl || !secret) {
      return res.status(500).json({ success: false, message: 'GAS_URL or GAS_SECRET not configured' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    const r = await fetch(gasUrl, {
      method: 'POST',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: fn, args: args, secret: secret })
    });

    clearTimeout(timeout);

    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    const msg = e.name === 'AbortError' ? 'Request timed out' : (e.message || 'Server error');
    return res.status(200).json({ success: false, message: msg });
  }
};
