async function sendExpoPush(tokens, { title, body, data }) {
    const validTokens = (tokens || []).filter(t => typeof t === 'string' && t.startsWith('ExponentPushToken'));
    if (!validTokens.length) return;

    const messages = validTokens.map(to => ({
        to,
        sound: 'default',
        title,
        body,
        data: data || {},
    }));

    // Node 18+ has global fetch. If not, use axios.
    const resp = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
    });

    const json = await resp.json().catch(() => null);
    return json;
}

module.exports = { sendExpoPush };  