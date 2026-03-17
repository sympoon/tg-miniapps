export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const BOT_TOKEN = process.env.BOT_TOKEN;
    if (!BOT_TOKEN) return res.status(500).json({ error: 'BOT_TOKEN not configured' });

    const { title, description, amount, payload } = req.body;

    if (!title || !amount) {
        return res.status(400).json({ error: 'title and amount required' });
    }

    try {
        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    description: description || title,
                    payload: payload || JSON.stringify({ product: title, ts: Date.now() }),
                    provider_token: '',
                    currency: 'XTR',
                    prices: [{ label: title, amount: parseInt(amount) }]
                })
            }
        );
        const data = await response.json();

        if (data.ok) {
            return res.status(200).json({ success: true, invoiceUrl: data.result });
        } else {
            return res.status(400).json({ error: data.description });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
