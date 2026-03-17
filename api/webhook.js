module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(200).json({ ok: true });

    // Get bot_id from query param: /api/webhook?bot=quiz
    const bot_id = req.query.bot;
    if (!bot_id) return res.status(200).json({ ok: true });

    // Parse bot tokens
    let tokens = {};
    try { tokens = JSON.parse(process.env.BOT_TOKENS || '{}'); } catch(e) {
        return res.status(200).json({ ok: true });
    }

    const token = tokens[bot_id];
    if (!token) return res.status(200).json({ ok: true });

    const update = req.body;

    // ===== Pre-checkout: approve within 10 seconds =====
    if (update.pre_checkout_query) {
        await tgApi(token, 'answerPreCheckoutQuery', {
            pre_checkout_query_id: update.pre_checkout_query.id,
            ok: true
        });
        return res.status(200).json({ ok: true });
    }

    // ===== Successful payment: deliver content =====
    if (update.message?.successful_payment) {
        const userId = update.message.from.id;
        const payment = update.message.successful_payment;
        let payload = {};
        try { payload = JSON.parse(payment.invoice_payload); } catch(e) {}

        const content = getContent(payload.product);
        await tgApi(token, 'sendMessage', {
            chat_id: userId,
            text: content,
            parse_mode: 'HTML'
        });
        return res.status(200).json({ ok: true });
    }

    // ===== Commands =====
    if (update.message?.text) {
        const text = update.message.text;
        const chatId = update.message.chat.id;

        if (text === '/start') {
            await tgApi(token, 'sendMessage', {
                chat_id: chatId,
                text: '👋 Привет! Нажми кнопку меню внизу, чтобы открыть приложение.',
                parse_mode: 'HTML'
            });
        }
        if (text === '/paysupport') {
            await tgApi(token, 'sendMessage', {
                chat_id: chatId,
                text: '🛟 По вопросам оплаты напишите @sympoon',
                parse_mode: 'HTML'
            });
        }
    }

    return res.status(200).json({ ok: true });
};

// ===== Telegram API helper =====
async function tgApi(token, method, body) {
    try {
        await fetch(`https://api.telegram.org/bot${token}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    } catch(e) {}
}

// =====================================================
// CONTENT REGISTRY — добавляй сюда контент для новых аппов
// Ключ = product из payload при оплате
// =====================================================
function getContent(product) {
    const contents = {

        // ---- QUIZ BOT ----
        'quiz_soviet_detailed': 
            `⭐ <b>Подробный разбор твоего характера</b>\n\n` +
            `🧠 <b>Сильные стороны:</b>\n` +
            `Ты обладаешь природной интуицией и эмпатией. Люди тянутся к тебе, потому что чувствуют искренность.\n\n` +
            `💡 <b>Рекомендации:</b>\n` +
            `• Не бойся проявлять инициативу — твоя природная мудрость поможет\n` +
            `• Найди баланс между заботой о других и о себе\n` +
            `• Твоя креативность — твой главный ресурс\n\n` +
            `🎯 <b>Совместимость:</b>\n` +
            `Лучше всего ладишь с Чебурашками (верные друзья) и Крокодилами Генами (надёжная опора).\n\n` +
            `Спасибо за покупку! 🎬`,

        // ---- CALC BOT ----
        'calc_coffee_tips':
            `⭐ <b>Персональный план экономии на кофе</b>\n\n` +
            `📋 <b>Неделя 1-2: Подготовка</b>\n` +
            `• Купи термокружку (~1500₽) — окупится за неделю\n` +
            `• Попробуй 3 сорта зернового кофе и выбери любимый\n\n` +
            `📋 <b>Неделя 3-4: Переход</b>\n` +
            `• Правило 1-1: одна чашка в кофейне, одна дома\n` +
            `• Подключи программы лояльности (Старбакс, Даблби)\n\n` +
            `📋 <b>Месяц 2+: Экономия</b>\n` +
            `• Рассмотри кофемашину с капучинатором (~25-35к₽)\n` +
            `• Привычка: кофе дома утром, в кофейне — только по пятницам\n\n` +
            `💰 Прогноз экономии: 40-60 тыс ₽ в год!\n\n` +
            `Спасибо за покупку! ☕`,

        // ---- Шаблон для новых продуктов ----
        // 'quiz_hogwarts_detailed':
        //     `⭐ <b>Твой факультет подробно</b>\n\n...`,
        //
        // 'calc_rent_report':
        //     `⭐ <b>Отчёт по аренде</b>\n\n...`,
    };

    return contents[product] || '⭐ Спасибо за покупку! Контент доставлен.';
}
