const Binance = require('node-binance-api');
const binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET,
});

const symbol = process.env.SYMBOL;
const leverage = parseFloat(process.env.LEVERAGE);
const capital = parseFloat(process.env.CAPITAL);
let tradeAmount = 0;

async function startBot() {
    try {
        // إعداد الرافعة المالية
        await binance.futuresLeverage(symbol, leverage);

        // حساب كمية التداول بناءً على رأس المال
        const prices = await binance.futuresPrices();
        const currentPrice = parseFloat(prices[symbol]);
        tradeAmount = (capital * leverage) / currentPrice;

        // الحصول على بيانات الشموع
        const candles = await binance.futuresCandlesticks(symbol, '3m', { limit: 30 });
        const closePrices = candles.map(c => parseFloat(c[4])); // أسعار الإغلاق

        // حساب مؤشر EMA
        const emaPeriod = 20;
        const ema = closePrices.slice(-emaPeriod).reduce((acc, val, idx) => {
            const multiplier = 2 / (emaPeriod + 1);
            return idx === 0 ? val : (val - acc) * multiplier + acc;
        }, 0);

        // إشارات التداول
        const lastClose = closePrices[closePrices.length - 1];
        if (lastClose > ema) {
            console.log('فتح صفقة شراء');
            await binance.futuresMarketBuy(symbol, tradeAmount);
        } else if (lastClose < ema) {
            console.log('فتح صفقة بيع');
            await binance.futuresMarketSell(symbol, tradeAmount);
        } else {
            console.log('لا توجد إشارة تداول.');
        }
    } catch (error) {
        console.error('Error running trading bot:', error);
    }
}

// بدء البوت
startBot();

