// Application State
const state = {
    balance: 10000,
    positions: [],
    closedTrades: [],
    currentPrice: 4085.50,
    candles: [],
    currentTimeframe: '15M',
    positionCounter: 1,
    priceHistory: [],
    alerts: [],
    coach: {
        trend: 'CALCULANDO',
        strength: '-',
        volatility: '-',
        ma20: 0,
        ma50: 0,
        rsi: 50
    },
    mainChart: null,
    rsiChart: null,
    modifyPositionId: null
};

const config = {
    lotValue: 100000,
    pipValue: 0.01,
    marginRequirement: 0.01,
    minLot: 0.01,
    maxLot: 10,
    updateInterval: 500
};

// Initialize App
function init() {
    generateInitialCandles();
    initCharts();
    updateUI();
    startPriceSimulation();
    setupEventListeners();
}

// Generate Initial Candles
function generateInitialCandles() {
    let price = state.currentPrice;
    for (let i = 0; i < 50; i++) {
        const open = price;
        const change = (Math.random() - 0.5) * 8;
        const close = Math.max(3900, Math.min(4300, open + change));
        const high = Math.max(open, close) + Math.random() * 4;
        const low = Math.min(open, close) - Math.random() * 4;
        
        state.candles.push({
            time: Date.now() - (50 - i) * 15 * 60 * 1000,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2))
        });
        price = close;
    }
    state.currentPrice = state.candles[state.candles.length - 1].close;
    state.priceHistory = state.candles.map(c => c.close);
}

// Calculate SMA
function calculateSMA(data, period) {
    const result = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            result.push(null);
        } else {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].close;
            }
            result.push(sum / period);
        }
    }
    return result;
}

// Calculate RSI
function calculateRSI(data, period = 14) {
    const result = [];
    if (data.length < period + 1) {
        return data.map(() => 50);
    }
    
    for (let i = 0; i < data.length; i++) {
        if (i < period) {
            result.push(50);
        } else {
            let gains = 0, losses = 0;
            for (let j = 1; j <= period; j++) {
                const change = data[i - j + 1].close - data[i - j].close;
                if (change > 0) gains += change;
                else losses += Math.abs(change);
            }
            const avgGain = gains / period;
            const avgLoss = losses / period;
            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            result.push(100 - (100 / (1 + rs)));
        }
    }
    return result;
}

// Initialize Charts
function initCharts() {
    // Main Chart
    const mainCtx = document.getElementById('mainChart').getContext('2d');
    const sma20 = calculateSMA(state.candles, 20);
    const sma50 = calculateSMA(state.candles, 50);
    
    state.mainChart = new Chart(mainCtx, {
        type: 'line',
        data: {
            labels: state.candles.map((_, i) => i),
            datasets: [
                {
                    label: 'Price',
                    data: state.candles.map(c => c.close),
                    borderColor: '#f5b342',
                    backgroundColor: 'rgba(245, 179, 66, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.1
                },
                {
                    label: 'MA20',
                    data: sma20,
                    borderColor: '#42a5f5',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'MA50',
                    data: sma50,
                    borderColor: '#ff9800',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: {
                    display: true,
                    position: 'right',
                    grid: { color: '#252738' },
                    ticks: { color: '#b0b0b0', font: { size: 10 } }
                }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });
    
    // RSI Chart
    const rsiCtx = document.getElementById('rsiChart').getContext('2d');
    const rsiData = calculateRSI(state.candles);
    
    state.rsiChart = new Chart(rsiCtx, {
        type: 'line',
        data: {
            labels: state.candles.map((_, i) => i),
            datasets: [{
                label: 'RSI',
                data: rsiData,
                borderColor: '#f5b342',
                backgroundColor: 'rgba(245, 179, 66, 0.2)',
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: {
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 100,
                    grid: { color: '#252738' },
                    ticks: { color: '#b0b0b0', font: { size: 9 }, stepSize: 50 }
                }
            }
        }
    });
}

// Update Charts
function updateCharts() {
    const sma20 = calculateSMA(state.candles, 20);
    const sma50 = calculateSMA(state.candles, 50);
    const rsiData = calculateRSI(state.candles);
    
    state.mainChart.data.labels = state.candles.map((_, i) => i);
    state.mainChart.data.datasets[0].data = state.candles.map(c => c.close);
    state.mainChart.data.datasets[1].data = sma20;
    state.mainChart.data.datasets[2].data = sma50;
    state.mainChart.update('none');
    
    state.rsiChart.data.labels = state.candles.map((_, i) => i);
    state.rsiChart.data.datasets[0].data = rsiData;
    state.rsiChart.update('none');
}

// Start Price Simulation
function startPriceSimulation() {
    setInterval(() => {
        updatePrice();
        updatePositions();
        updateUI();
    }, config.updateInterval);
    
    setInterval(() => {
        createNewCandle();
    }, 15000);
}

// Update Price
function updatePrice() {
    const volatility = 0.3;
    const trend = (Math.random() - 0.5) * 0.1;
    const spike = Math.random() < 0.02 ? (Math.random() - 0.5) * 15 : 0;
    const change = (Math.random() - 0.5) * volatility + trend + spike;
    
    state.currentPrice = Math.max(3900, Math.min(4300, state.currentPrice + change));
    state.currentPrice = parseFloat(state.currentPrice.toFixed(2));
    
    if (state.candles.length > 0) {
        const lastCandle = state.candles[state.candles.length - 1];
        lastCandle.close = state.currentPrice;
        lastCandle.high = Math.max(lastCandle.high, state.currentPrice);
        lastCandle.low = Math.min(lastCandle.low, state.currentPrice);
    }
    
    state.priceHistory.push(state.currentPrice);
    if (state.priceHistory.length > 100) state.priceHistory.shift();
}

// Create New Candle
function createNewCandle() {
    state.candles.push({
        time: Date.now(),
        open: state.currentPrice,
        high: state.currentPrice,
        low: state.currentPrice,
        close: state.currentPrice
    });
    if (state.candles.length > 50) state.candles.shift();
    updateCharts();
}

// Update Positions
function updatePositions() {
    state.positions.forEach(pos => {
        pos.currentPrice = state.currentPrice;
        const priceDiff = pos.type === 'BUY' 
            ? pos.currentPrice - pos.entryPrice
            : pos.entryPrice - pos.currentPrice;
        
        pos.pips = parseFloat((priceDiff / config.pipValue).toFixed(2));
        pos.profit = parseFloat((pos.pips * pos.lotSize * 100).toFixed(2));
        pos.profitPercent = parseFloat(((pos.profit / state.balance) * 100).toFixed(2));
        
        // Check SL/TP
        if (pos.type === 'BUY') {
            if (pos.currentPrice <= pos.stopLossPrice) closePosition(pos.id, 'Stop Loss');
            else if (pos.currentPrice >= pos.takeProfitPrice) closePosition(pos.id, 'Take Profit');
        } else {
            if (pos.currentPrice >= pos.stopLossPrice) closePosition(pos.id, 'Stop Loss');
            else if (pos.currentPrice <= pos.takeProfitPrice) closePosition(pos.id, 'Take Profit');
        }
    });
}

// Calculate Account Metrics
function calculateMetrics() {
    let usedMargin = 0;
    let openPL = 0;
    
    state.positions.forEach(pos => {
        usedMargin += pos.lotSize * config.lotValue * config.marginRequirement;
        openPL += pos.profit;
    });
    
    const equity = state.balance + openPL;
    const freeMargin = equity - usedMargin;
    
    return { usedMargin, openPL, equity, freeMargin };
}

// Update UI
function updateUI() {
    // Header
    const metrics = calculateMetrics();
    document.getElementById('headerBalance').textContent = `$${state.balance.toFixed(2)}`;
    document.getElementById('headerEquity').textContent = `$${metrics.equity.toFixed(2)}`;
    document.getElementById('headerMargin').textContent = `$${metrics.freeMargin.toFixed(2)}`;
    
    const plEl = document.getElementById('headerPL');
    plEl.textContent = `$${metrics.openPL.toFixed(2)}`;
    plEl.className = `stat-value ${metrics.openPL >= 0 ? 'positive' : 'negative'}`;
    
    // Price Display
    document.getElementById('currentPrice').textContent = state.currentPrice.toFixed(2);
    const firstPrice = state.priceHistory[0] || state.currentPrice;
    const changePercent = ((state.currentPrice - firstPrice) / firstPrice * 100).toFixed(2);
    const changeEl = document.getElementById('priceChange');
    changeEl.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent}%`;
    changeEl.className = `price-change ${changePercent >= 0 ? 'positive' : 'negative'}`;
    
    // Validation
    updateValidation();
    
    // Positions
    updatePositionsDisplay();
    
    // History
    updateHistoryDisplay();
    
    // Coach
    updateCoach();
}

// Update Validation
function updateValidation() {
    const lotSize = parseFloat(document.getElementById('lotSize').value) || 0;
    const sl = parseFloat(document.getElementById('stopLoss').value) || 0;
    const tp = parseFloat(document.getElementById('takeProfit').value) || 0;
    
    document.getElementById('valPrice').textContent = state.currentPrice.toFixed(2);
    const rr = sl > 0 ? (tp / sl).toFixed(1) : '0';
    document.getElementById('valRR').textContent = `1:${rr}`;
    
    const riskAmount = lotSize * sl * 100;
    const riskPercent = ((riskAmount / state.balance) * 100).toFixed(1);
    document.getElementById('valRisk').textContent = `${riskPercent}%`;
    
    const statusEl = document.getElementById('validationStatus');
    if (sl < 10 || tp / sl < 1 || riskPercent > 5) {
        statusEl.className = 'validation-status bad';
        statusEl.textContent = '❌ Parámetros necesitan ajuste';
    } else if (tp / sl >= 2 && riskPercent <= 2) {
        statusEl.className = 'validation-status good';
        statusEl.textContent = '✅ Parámetros excelentes - Listo para operar';
    } else {
        statusEl.className = 'validation-status warning';
        statusEl.textContent = '⚠️ Parámetros aceptables - Considera ajustar';
    }
}

// Update Positions Display
function updatePositionsDisplay() {
    const container = document.getElementById('positionsList');
    const summary = document.getElementById('positionsSummary');
    
    if (state.positions.length === 0) {
        summary.textContent = 'Sin posiciones abiertas';
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <div class="empty-text">No tienes posiciones abiertas</div>
                <div class="empty-hint">Ve a la pestaña "Operar" para abrir una posición</div>
            </div>
        `;
        return;
    }
    
    const totalPL = state.positions.reduce((sum, p) => sum + p.profit, 0);
    summary.innerHTML = `Tienes <strong>${state.positions.length}</strong> posición(es) abierta(s) | P&amp;L Total: <strong class="${totalPL >= 0 ? 'positive' : 'negative'}">$${totalPL.toFixed(2)}</strong>`;
    
    container.innerHTML = state.positions.map(pos => `
        <div class="position-card">
            <div class="position-header">
                <span class="position-type ${pos.type.toLowerCase()}">${pos.type}</span>
                <span class="position-pl ${pos.profit >= 0 ? 'positive' : 'negative'}">$${pos.profit.toFixed(2)}</span>
            </div>
            <div class="position-details">
                <div class="detail-item">
                    <span class="detail-label">Entrada</span>
                    <span class="detail-value">${pos.entryPrice.toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Actual</span>
                    <span class="detail-value">${pos.currentPrice.toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Lote</span>
                    <span class="detail-value">${pos.lotSize.toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Pips</span>
                    <span class="detail-value ${pos.pips >= 0 ? 'positive' : 'negative'}">${pos.pips.toFixed(1)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Stop Loss</span>
                    <span class="detail-value">${pos.stopLossPrice.toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Take Profit</span>
                    <span class="detail-value">${pos.takeProfitPrice.toFixed(2)}</span>
                </div>
            </div>
            <div class="position-actions">
                <button class="action-btn danger" onclick="closePosition(${pos.id}, 'Manual')">Cerrar</button>
                <button class="action-btn" onclick="openModifyModal(${pos.id})">Modificar</button>
            </div>
        </div>
    `).join('');
}

// Update History Display
function updateHistoryDisplay() {
    const container = document.getElementById('historyList');
    const statsContainer = document.getElementById('historyStats');
    
    if (state.closedTrades.length === 0) {
        statsContainer.style.display = 'none';
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <div class="empty-text">Aún no hay operaciones cerradas</div>
                <div class="empty-hint">Tu historial aparecerá aquí</div>
            </div>
        `;
        return;
    }
    
    const totalTrades = state.closedTrades.length;
    const winningTrades = state.closedTrades.filter(t => t.profit > 0).length;
    const winRate = ((winningTrades / totalTrades) * 100).toFixed(1);
    const totalPL = state.closedTrades.reduce((sum, t) => sum + t.profit, 0);
    
    document.getElementById('statTotalTrades').textContent = totalTrades;
    document.getElementById('statWinRate').textContent = `${winRate}%`;
    document.getElementById('statTotalPL').textContent = `$${totalPL.toFixed(2)}`;
    document.getElementById('statTotalPL').className = `stat-value ${totalPL >= 0 ? 'positive' : 'negative'}`;
    statsContainer.style.display = 'grid';
    
    container.innerHTML = state.closedTrades.slice(-20).reverse().map(trade => `
        <div class="history-card">
            <div class="history-header">
                <span class="position-type ${trade.type.toLowerCase()}">${trade.type}</span>
                <span class="history-result ${trade.profit >= 0 ? 'positive' : 'negative'}">$${trade.profit.toFixed(2)}</span>
            </div>
            <div class="history-details">
                <div class="detail-item">
                    <span class="detail-label">Entrada</span>
                    <span class="detail-value">${trade.entryPrice.toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Salida</span>
                    <span class="detail-value">${trade.exitPrice.toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Lote</span>
                    <span class="detail-value">${trade.lotSize.toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Pips</span>
                    <span class="detail-value">${trade.pips.toFixed(1)}</span>
                </div>
            </div>
            <div class="history-footer">
                <span>${trade.reason}</span>
                <span>${new Date(trade.closeTime).toLocaleTimeString()}</span>
            </div>
        </div>
    `).join('');
}

// Update Coach
function updateCoach() {
    const sma20 = calculateSMA(state.candles, 20);
    const sma50 = calculateSMA(state.candles, 50);
    const rsi = calculateRSI(state.candles);
    
    const idx = state.candles.length - 1;
    state.coach.ma20 = sma20[idx] || 0;
    state.coach.ma50 = sma50[idx] || 0;
    state.coach.rsi = rsi[idx] || 50;
    
    // Determine trend
    if (state.currentPrice > state.coach.ma20 && state.coach.ma20 > state.coach.ma50) {
        state.coach.trend = 'UPTREND';
        state.coach.strength = 'Fuerte';
    } else if (state.currentPrice < state.coach.ma20 && state.coach.ma20 < state.coach.ma50) {
        state.coach.trend = 'DOWNTREND';
        state.coach.strength = 'Fuerte';
    } else {
        state.coach.trend = 'SIDEWAYS';
        state.coach.strength = 'Débil';
    }
    
    // Volatility
    if (state.candles.length >= 10) {
        const recentCandles = state.candles.slice(-10);
        const avgRange = recentCandles.reduce((sum, c) => sum + (c.high - c.low), 0) / 10;
        state.coach.volatility = avgRange < 5 ? 'Baja' : avgRange < 10 ? 'Media' : 'Alta';
    }
    
    document.getElementById('coachTrend').textContent = state.coach.trend;
    document.getElementById('coachTrend').className = `value ${state.coach.trend}`;
    document.getElementById('coachStrength').textContent = state.coach.strength;
    document.getElementById('coachVolatility').textContent = state.coach.volatility;
    
    updateCoachSignals();
    updateCoachGuide();
    updateCoachRisk();
}

// Update Coach Signals
function updateCoachSignals() {
    const signals = [];
    const { ma20, ma50, rsi } = state.coach;
    const price = state.currentPrice;
    
    if (price > ma20 && ma20 > ma50) {
        signals.push({ text: '✅ Señal Alcista Fuerte - Precio sobre todas las MAs', type: 'buy' });
    } else if (price < ma20 && ma20 < ma50) {
        signals.push({ text: '✅ Señal Bajista Fuerte - Precio bajo todas las MAs', type: 'sell' });
    } else {
        signals.push({ text: '⚠️ Señal Mixta - Esperar confirmación', type: 'warning' });
    }
    
    if (rsi > 70) {
        signals.push({ text: `⚠️ SOBRECOMPRA (RSI: ${rsi.toFixed(0)}) - Posible retroceso`, type: 'warning' });
    } else if (rsi < 30) {
        signals.push({ text: `⚠️ SOBREVENTA (RSI: ${rsi.toFixed(0)}) - Posible rebote`, type: 'warning' });
    } else {
        signals.push({ text: `✅ RSI Neutral (${rsi.toFixed(0)}) - Zona saludable`, type: 'buy' });
    }
    
    document.getElementById('coachSignals').innerHTML = signals.map(s => 
        `<div class="signal-item ${s.type}">${s.text}</div>`
    ).join('');
}

// Update Coach Guide
function updateCoachGuide() {
    const { trend, rsi } = state.coach;
    const steps = [];
    
    if (trend === 'UPTREND' && rsi >= 40 && rsi < 70) {
        steps.push({ text: '📊 OPORTUNIDAD DE COMPRA DETECTADA', type: 'action' });
        steps.push({ text: 'Paso 1: ✅ Tendencia alcista confirmada', type: '' });
        steps.push({ text: `Paso 2: ✅ RSI en ${rsi.toFixed(0)} (bueno para entrar)`, type: '' });
        steps.push({ text: 'Paso 3: 👉 Considera posición de COMPRA', type: 'action' });
        steps.push({ text: 'Paso 4: Lote sugerido: 0.05-0.10 | SL: 30 pips | TP: 60 pips', type: '' });
    } else if (trend === 'DOWNTREND' && rsi > 30 && rsi <= 60) {
        steps.push({ text: '📊 OPORTUNIDAD DE VENTA DETECTADA', type: 'action' });
        steps.push({ text: 'Paso 1: ✅ Tendencia bajista confirmada', type: '' });
        steps.push({ text: `Paso 2: ✅ RSI en ${rsi.toFixed(0)} (bueno para entrar)`, type: '' });
        steps.push({ text: 'Paso 3: 👉 Considera posición de VENTA', type: 'action' });
        steps.push({ text: 'Paso 4: Lote sugerido: 0.05-0.10 | SL: 30 pips | TP: 60 pips', type: '' });
    } else if (rsi > 70) {
        steps.push({ text: '⚠️ MERCADO SOBRECOMPRADO', type: 'warning' });
        steps.push({ text: 'Paso 1: Esperar a que RSI baje de 70', type: '' });
        steps.push({ text: 'Paso 2: No abrir posiciones de COMPRA ahora', type: '' });
        steps.push({ text: 'Paso 3: Considera cerrar posiciones largas abiertas', type: '' });
    } else if (rsi < 30) {
        steps.push({ text: '⚠️ MERCADO SOBREVENDIDO', type: 'warning' });
        steps.push({ text: 'Paso 1: Esperar a que RSI suba de 30', type: '' });
        steps.push({ text: 'Paso 2: No abrir posiciones de VENTA ahora', type: '' });
        steps.push({ text: 'Paso 3: Prepárate para posible rebote alcista', type: '' });
    } else {
        steps.push({ text: '📊 MODO OBSERVACIÓN', type: 'warning' });
        steps.push({ text: 'Paso 1: Señales no están alineadas claramente', type: '' });
        steps.push({ text: 'Paso 2: Esperar mejor configuración', type: '' });
        steps.push({ text: 'Paso 3: La paciencia es clave en el trading', type: '' });
    }
    
    document.getElementById('coachGuide').innerHTML = steps.map(s => 
        `<div class="guide-step ${s.type}">${s.text}</div>`
    ).join('');
}

// Update Coach Risk
function updateCoachRisk() {
    const metrics = calculateMetrics();
    const safeLot = ((state.balance * 0.02) / (20 * 100)).toFixed(2);
    const currentRisk = ((metrics.usedMargin / state.balance) * 100).toFixed(1);
    
    document.getElementById('riskMargin').textContent = `$${metrics.freeMargin.toFixed(2)}`;
    document.getElementById('riskSafeLot').textContent = `${safeLot} lotes`;
    document.getElementById('riskCurrent').textContent = `${currentRisk}%`;
}

// Setup Event Listeners
function setupEventListeners() {
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentTimeframe = btn.dataset.tf;
        });
    });
    
    ['lotSize', 'stopLoss', 'takeProfit'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateValidation);
    });
}

// Switch Tab
window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.nav-btn[data-tab="${tabName}"]`).classList.add('active');
};

// Adjust Lot
window.adjustLot = function(delta) {
    const input = document.getElementById('lotSize');
    let value = parseFloat(input.value) || 0;
    value = Math.max(config.minLot, Math.min(config.maxLot, value + delta));
    input.value = value.toFixed(2);
    updateValidation();
};

// Open Trade
window.openTrade = function(type) {
    const lotSize = parseFloat(document.getElementById('lotSize').value);
    const sl = parseFloat(document.getElementById('stopLoss').value);
    const tp = parseFloat(document.getElementById('takeProfit').value);
    
    if (!lotSize || lotSize < config.minLot || lotSize > config.maxLot) {
        showMessage('⚠️ Tamaño de lote inválido', 'error');
        return;
    }
    
    if (!sl || sl < 1) {
        showMessage('⚠️ Stop Loss es obligatorio', 'error');
        return;
    }
    
    if (!tp || tp < 1) {
        showMessage('⚠️ Take Profit es obligatorio', 'error');
        return;
    }
    
    const metrics = calculateMetrics();
    const requiredMargin = lotSize * config.lotValue * config.marginRequirement;
    if (requiredMargin > metrics.freeMargin) {
        showMessage('⚠️ Margen insuficiente', 'error');
        return;
    }
    
    const stopLossPrice = type === 'BUY'
        ? state.currentPrice - (sl * config.pipValue)
        : state.currentPrice + (sl * config.pipValue);
    
    const takeProfitPrice = type === 'BUY'
        ? state.currentPrice + (tp * config.pipValue)
        : state.currentPrice - (tp * config.pipValue);
    
    const position = {
        id: state.positionCounter++,
        type,
        entryPrice: state.currentPrice,
        currentPrice: state.currentPrice,
        lotSize,
        stopLossPrice: parseFloat(stopLossPrice.toFixed(2)),
        takeProfitPrice: parseFloat(takeProfitPrice.toFixed(2)),
        profit: 0,
        pips: 0,
        openTime: Date.now()
    };
    
    state.positions.push(position);
    showMessage(`✅ Orden ${type} abierta! ${lotSize} lote(s) a ${state.currentPrice.toFixed(2)}`, 'success');
    switchTab('positions');
};

// Close Position
window.closePosition = function(id, reason = 'Manual') {
    const index = state.positions.findIndex(p => p.id === id);
    if (index === -1) return;
    
    const position = state.positions[index];
    state.positions.splice(index, 1);
    
    state.balance += position.profit;
    
    state.closedTrades.push({
        ...position,
        exitPrice: position.currentPrice,
        closeTime: Date.now(),
        reason
    });
    
    updateUI();
};

// Close All Positions
window.closeAllPositions = function() {
    if (state.positions.length === 0) {
        showMessage('ℹ️ No hay posiciones abiertas', 'error');
        return;
    }
    
    const count = state.positions.length;
    [...state.positions].forEach(pos => closePosition(pos.id, 'Manual'));
    showMessage(`✅ ${count} posición(es) cerrada(s)`, 'success');
};

// Show Message
function showMessage(text, type) {
    const msgEl = document.getElementById('tradeMessage');
    msgEl.textContent = text;
    msgEl.className = `trade-message ${type}`;
    setTimeout(() => {
        msgEl.className = 'trade-message';
    }, 4000);
}

// Modify Modal
window.openModifyModal = function(id) {
    const position = state.positions.find(p => p.id === id);
    if (!position) return;
    
    state.modifyPositionId = id;
    const currentSL = Math.abs((position.stopLossPrice - position.entryPrice) / config.pipValue);
    const currentTP = Math.abs((position.takeProfitPrice - position.entryPrice) / config.pipValue);
    
    document.getElementById('modifySL').value = currentSL.toFixed(0);
    document.getElementById('modifyTP').value = currentTP.toFixed(0);
    document.getElementById('modifyModal').style.display = 'flex';
};

window.closeModifyModal = function() {
    document.getElementById('modifyModal').style.display = 'none';
    state.modifyPositionId = null;
};

window.confirmModify = function() {
    if (!state.modifyPositionId) return;
    
    const position = state.positions.find(p => p.id === state.modifyPositionId);
    if (!position) return;
    
    const newSL = parseFloat(document.getElementById('modifySL').value);
    const newTP = parseFloat(document.getElementById('modifyTP').value);
    
    if (isNaN(newSL) || newSL <= 0 || isNaN(newTP) || newTP <= 0) {
        showMessage('⚠️ Valores inválidos', 'error');
        return;
    }
    
    if (position.type === 'BUY') {
        position.stopLossPrice = parseFloat((position.entryPrice - (newSL * config.pipValue)).toFixed(2));
        position.takeProfitPrice = parseFloat((position.entryPrice + (newTP * config.pipValue)).toFixed(2));
    } else {
        position.stopLossPrice = parseFloat((position.entryPrice + (newSL * config.pipValue)).toFixed(2));
        position.takeProfitPrice = parseFloat((position.entryPrice - (newTP * config.pipValue)).toFixed(2));
    }
    
    closeModifyModal();
    showMessage('✅ Posición modificada', 'success');
    updateUI();
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}