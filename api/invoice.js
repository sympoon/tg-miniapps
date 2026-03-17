module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Parse bot tokens from env
    let tokens = {};
    try { tokens = JSON.parse(process.env.BOT_TOKENS || '{}'); } catch(e) {
        return res.status(500).json({ error: 'BOT_TOKENS config error' });
    }

    const { bot_id, title, description, amount, payload } = req.body;

    // Find token by bot_id
    const token = tokens[bot_id];
    if (!token) return res.status(400).json({ error: 'Unknown bot_id: ' + bot_id });
    if (!title || !amount) return res.status(400).json({ error: 'title and amount required' });

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${token}/createInvoiceLink`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description: description || title,
                    payload: payload || JSON.stringify({ product: title, ts: Date.now() }),
                    provider_token: '',
                    currency: 'XTR',
                    prices: [{ label: title, amount: parseInt(amount) }]
                })
            }
        );
        const data = await response.json();
        if (data.ok) return res.status(200).json({ success: true, invoiceUrl: data.result });
        return res.status(400).json({ error: data.description });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
