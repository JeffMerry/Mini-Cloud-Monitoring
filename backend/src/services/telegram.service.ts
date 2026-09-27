export async function sendTelegramMessage(
    message: string
): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId){
        throw new Error(
            "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing"
        );
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: message,
        }),
    });

    if(!response.ok) {
        const errorBody = await response.text();

        throw new Error(
             `Telegram API error: ${response.status} ${errorBody}`
        );
    }
}