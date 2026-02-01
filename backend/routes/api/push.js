const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate'); // you use this in /api/user
const User = require('../../models/User');

// POST /api/push/register  { token: "ExponentPushToken[...]" }
router.post('/register', authenticate, async (req, res) => {
    try {
        const { token } = req.body;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ message: 'token required' });
        }

        const user = await User.findById(req.user.id).select('push settings');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Always store token (even if they disabled notifications) so enabling later works fast
        user.push = user.push || {};
        user.push.expoTokens = Array.isArray(user.push.expoTokens) ? user.push.expoTokens : [];
        if (!user.push.expoTokens.includes(token)) user.push.expoTokens.push(token);

        await user.save();
        res.json({ ok: true, notificationsEnabled: !!user.settings?.notifications });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// DELETE /api/push/unregister  { token: "ExponentPushToken[...]" }
router.delete('/unregister', authenticate, async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ message: 'token required' });

        const user = await User.findById(req.user.id).select('push');
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.push = user.push || {};
        user.push.expoTokens = (user.push.expoTokens || []).filter(t => t !== token);

        await user.save();
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

module.exports = router;