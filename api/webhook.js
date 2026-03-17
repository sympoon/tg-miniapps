module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).json({ ok: true });

    const BOT_TOKEN = process.env.BOT_TOKEN;
    if (!BOT_TOKEN) return res.status(200).json({ ok: true });

    const update = req.body;

    // Step 1: Approve pre-checkout (MUST respond within 10 seconds)
    if (update.pre_checkout_query) {
        await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pre_checkout_query_id: update.pre_checkout_query.id,
                    ok: true
                })
            }
        );
        return res.status(200).json({ ok: true });
    }

    // Step 2: Handle successful payment — send content to user
    if (update.message?.successful_payment) {
        const userId = update.message.from.id;
        const payment = update.message.successful_payment;
        let payload = {};
        try { payload = JSON.parse(payment.invoice_payload); } catch(e) {}

        // Send detailed analysis or premium content
        const content = getContent(payload.product);

        await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: userId,
                    text: content,
                    parse_mode: 'HTML'
                })
            }
        );
        return res.status(200).json({ ok: true });
    }

    // Handle /start and /paysupport
    if (update.message?.text) {
        const text = update.message.text;
        const chatId = update.message.chat.id;

        if (text === '/start') {
            await sendMsg(BOT_TOKEN, chatId, '👋 Привет! Нажми кнопку меню внизу, чтобы открыть приложение.');
        }
        if (text === '/paysupport') {
            await sendMsg(BOT_TOKEN, chatId, '🛟 По вопросам оплаты пишите сюда.');
        }
    }

    return res.status(200).json({ ok: true });
}

function getContent(product) {
    // Add content for each mini-app product here
    const contents = {
        'quiz_detailed': `⭐ <b>Подробный разбор твоего характера</b>\n\n` +
            `🧠 <b>Сильные стороны:</b>\n` +
            `Ты обладаешь природной интуицией и эмпатией. Люди тянутся к тебе, потому что чувствуют искренность.\n\n` +
            `💡 <b>Рекомендации:</b>\n` +
            `• Не бойся проявлять инициативу — твоя природная мудрость поможет принимать верные решения\n` +
            `• Найди баланс между заботой о других и о себе\n` +
            `• Твоя креативность — твой главный ресурс, развивай её\n\n` +
            `🎯 <b>Совместимость:</b>\n` +
            `Лучше всего ладишь с Чебурашками (верные друзья) и Крокодилами Генами (надёжная опора).\n\n` +
            `Спасибо за покупку! 🎬`,

        'coffee_tips': `⭐ <b>Персональный план экономии на кофе</b>\n\n` +
            `📋 <b>Неделя 1-2: Подготовка</b>\n` +
            `• Купи термокружку (~1500₽) — окупится за неделю\n` +
            `• Попробуй 3 сорта зернового кофе дома и выбери любимый\n\n` +
            `📋 <b>Неделя 3-4: Переход</b>\n` +
            `• Правило 1-1: одна чашка в кофейне, одна дома\n` +
            `• Используй программы лояльности (Старбакс, Даблби)\n\n` +
            `📋 <b>Месяц 2+: Экономия</b>\n` +
            `• Рассмотри кофемашину с капучинатором (~25-35к₽)\n` +
            `• Заведи привычку: кофе дома утром, в кофейне — только по пятницам\n\n` +
            `💰 Прогноз экономии: 40-60 тыс ₽ в год!\n\n` +
            `Спасибо за покупку! ☕`
    };

    return contents[product] || '⭐ Спасибо за покупку! Контент будет доставлен.';
}

async function sendMsg(token, chatId, text) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
}
