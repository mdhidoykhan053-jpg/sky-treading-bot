module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  res.status(200).send(`
(function () {
  const ID = 'BD-traders-root';

  if (document.getElementById(ID)) return;

  const root = document.createElement('div');
  root.id = ID;

  root.style.cssText =
    'position:fixed;top:65px;right:8px;width:min(350px,94vw);z-index:2147483647;';

  const box = document.createElement('div');

  box.style.cssText =
    'background:#101827;color:white;padding:16px;border:1px solid #43536a;border-radius:14px;font-family:Arial;box-shadow:0 5px 25px #000;max-height:85vh;overflow:auto;';

  box.innerHTML = \`
    <div style="display:flex;justify-content:space-between">
      <b style="color:#39e6ad;font-size:18px">BD TRADING PRO</b>
      <button id="bdclose">✕</button>
    </div>

    <p>QUOTEX MARKET ANALYZER</p>

    <label>Enter 35+ closing prices (oldest first)</label>

    <textarea id="bdprices"
      placeholder="1.0820,1.0825,1.0830,..."
      style="width:100%;height:100px;background:#07111e;color:white;padding:8px;box-sizing:border-box;margin-top:8px">
    </textarea>

    <button id="bdanalyze"
      style="width:100%;padding:12px;background:#08a879;color:white;border:0;border-radius:8px;margin-top:10px">
      ANALYZE MARKET
    </button>

    <div id="bdresult"
      style="background:#07111e;padding:12px;margin-top:12px;border-radius:8px">
      Waiting for market data...
    </div>

    <p style="font-size:11px;color:#aaa">
      Educational analysis only. No guaranteed profit.
    </p>
  \`;

  root.appendChild(box);
  document.documentElement.appendChild(root);

  window.__BD_trading_Pro_Activated__ = true;

  box.querySelector('#bdclose').onclick = () => {
    root.remove();
    window.__BD_trading_Pro_Activated__ = false;
  };

  box.querySelector('#bdanalyze').onclick = () => {
    const prices = box.querySelector('#bdprices')
      .value.split(',')
      .map(Number);

    const result = box.querySelector('#bdresult');

    if (
      prices.length < 35 ||
      prices.some(x => !Number.isFinite(x) || x <= 0)
    ) {
      result.textContent = 'Please enter at least 35 valid prices.';
      return;
    }

    function ema(data, period) {
      const k = 2 / (period + 1);
      let value = data[0];

      for (let i = 1; i < data.length; i++) {
        value = data[i] * k + value * (1 - k);
      }

      return value;
    }

    let gain = 0;
    let loss = 0;

    for (let i = prices.length - 14; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];

      if (change > 0) gain += change;
      else loss -= change;
    }

    const avgGain = gain / 14;
    const avgLoss = loss / 14;

    const rsi = avgLoss === 0
      ? 100
      : 100 - 100 / (1 + avgGain / avgLoss);

    const macdValues = [];

    for (let i = 25; i < prices.length; i++) {
      const data = prices.slice(0, i + 1);

      macdValues.push(
        ema(data, 12) - ema(data, 26)
      );
    }

    const macd = macdValues[macdValues.length - 1];
    const signal = ema(macdValues, 9);

    const bullish = ema(prices, 12) > ema(prices, 26);
    const bearish = ema(prices, 12) < ema(prices, 26);

    const buy = rsi > 55 && bullish && macd > signal;
    const sell = rsi < 45 && bearish && macd < signal;

    const decision = buy ? 'BUY' : sell ? 'SELL' : 'NEUTRAL';

    const recent = prices.slice(-20);
    const support = Math.min(...recent);
    const resistance = Math.max(...recent);

    let score = 0;
    if (bullish && buy) score = 75;
    if (bearish && sell) score = 75;
    if (decision === 'NEUTRAL') score = 50;

    result.innerHTML = \`
      <h2 style="color:\${buy ? '#39e6ad' : sell ? '#ff7070' : '#ffd166'}">
        \${decision}
      </h2>

      RSI (14): \${rsi.toFixed(2)}<br>
      MACD: \${macd.toFixed(6)}<br>
      Signal Line: \${signal.toFixed(6)}<br>
      Trend: \${bullish ? 'Bullish' : bearish ? 'Bearish' : 'Sideways'}<br>
      Support: \${support}<br>
      Resistance: \${resistance}<br>
      Analysis Score: \${score}/100
    \`;
  };
})();
  `);
};
