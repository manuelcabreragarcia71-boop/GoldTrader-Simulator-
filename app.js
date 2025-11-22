// Trading Application State
const state = {
    balance: 10000,
    positions: [],
    closedTrades: [],
    currentPrice: 4085.50,
    candles: [],
    currentTimeframe: '15M',
    chart: null,
    positionCounter: 1,
    lastCandle: null,
    priceHistory: [4085.50],
    alerts: [],
    lastAlertConditions: {},
    coachAnalysis: {
        trend: 'CALCULANDO',
        strength: '-',
        volatility: '-',
        rsi: 50,
        ma20: 0,
        ma50: 0
    }
};

const config = {
    marginRequirement: 0.01,
    lotValue: 100000,
    pipValue: 0.01,
    minLot: 0.01,
    maxLot: 10,
    priceRangeLow: 3900,
    priceRangeHigh: 4300
};

const educationalTips = [
    "Siempre usa un stop loss para proteger tu cuenta de grandes pérdidas.",
    "¡La gestión de riesgo es clave! Nunca arriesgues más del 2% de tu cuenta por operación.",
    "Las medias móviles ayudan a identificar tendencias. Precio sobre MA50 = señal alcista.",
    "RSI sobre 70 = sobrecompra (posible venta). RSI bajo 30 = sobreventa (posible compra).",
    "El oro (XAU/USD) tiende a subir con incertidumbre económica. Los eventos de riesgo impulsan el oro.",
    "¡Empieza pequeño! Usa lotes de 0.01-0.1 cuando aprendas para practicar la gestión de riesgo.",
    "En una tendencia fuerte, las mejores operaciones son en la dirección de la tendencia!",
    "RSI > 70 no siempre significa vender - espera confirmación del precio!",
    "Cuando las medias móviles se cruzan, suelen seguir grandes reversiones. ¡Presta atención!",
    "La paciencia es una virtud en el trading. Esperar la configuración perfecta ahorra dinero!",
    "Cuando no sepas qué hacer, la mejor acción es ESPERAR."
];

// Initialize the application
function init() {
    generateInitialCandles();
    initChart();
    updateAccountInfo();
    setupEventListeners();
    startPriceSimulation();
    showRandomTip();
    setInterval(showRandomTip, 45000);
}

// Generate initial candlestick data
function generateInitialCandles() {
    let price = state.currentPrice;
    const numCandles = 100;
    
    for (let i = 0; i < numCandles; i++) {
        const open = price;
        const change = (Math.random() - 0.5) * 10;
        const close = Math.max(config.priceRangeLow, Math.min(config.priceRangeHigh, open + change));
        const high = Math.max(open, close) + Math.random() * 5;
        const low = Math.min(open, close) - Math.random() * 5;
        
        state.candles.push({
            time: Date.now() - (numCandles - i) * 15 * 60 * 1000,
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(close.toFixed(2))
        });
        
        price = close;
    }
    
    state.currentPrice = state.candles[state.candles.length - 1].close;
    state.lastCandle = state.candles[state.candles.length - 1];
}

// Calculate Simple Moving Average
function calculateSMA(data, period) {
    const sma = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(null);
        } else {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].close;
            }
            sma.push(sum / period);
        }
    }
    return sma;
}

// Calculate RSI
function calculateRSI(data, period = 14) {
    const rsi = [];
    if (data.length < period + 1) {
        return data.map(() => 50);
    }
    
    for (let i = 0; i < data.length; i++) {
        if (i < period) {
            rsi.push(50);
        } else {
            let gains = 0;
            let losses = 0;
            
            for (let j = 1; j <= period; j++) {
                const change = data[i - j + 1].close - data[i - j].close;
                if (change > 0) {
                    gains += change;
                } else {
                    losses += Math.abs(change);
                }
            }
            
            const avgGain = gains / period;
            const avgLoss = losses / period;
            
            if (avgLoss === 0) {
                rsi.push(100);
            } else {
                const rs = avgGain / avgLoss;
                rsi.push(100 - (100 / (1 + rs)));
            }
        }
    }
    return rsi;
}

// Initialize Chart
function initChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    const labels = state.candles.map(c => new Date(c.time).toLocaleTimeString());
    const sma20 = calculateSMA(state.candles, 20);
    const sma50 = calculateSMA(state.candles, 50);
    const rsi = calculateRSI(state.candles, 14);
    
    state.chart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'XAUUSD',
                    data: state.candles.map(c => ({
                        x: c.time,
                        o: c.open,
                        h: c.high,
                        l: c.low,
                        c: c.close
                    }))
                },
                {
                    label: 'SMA 20',
                    data: sma20,
                    type: 'line',
                    borderColor: '#42a5f5',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1
                },
                {
                    label: 'SMA 50',
                    data: sma50,
                    type: 'line',
                    borderColor: '#ff9800',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#e1e3e6',
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return new Date(tooltipItems[0].parsed.x).toLocaleString();
                        },
                        label: function(context) {
                            const dataPoint = state.candles[context.dataIndex];
                            if (dataPoint) {
                                return [
                                    `Open: ${dataPoint.open.toFixed(2)}`,
                                    `High: ${dataPoint.high.toFixed(2)}`,
                                    `Low: ${dataPoint.low.toFixed(2)}`,
                                    `Close: ${dataPoint.close.toFixed(2)}`
                                ];
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: '#2d3139'
                    },
                    ticks: {
                        color: '#8b8d91'
                    }
                },
                y: {
                    display: true,
                    position: 'right',
                    grid: {
                        color: '#2d3139'
                    },
                    ticks: {
                        color: '#8b8d91',
                        callback: function(value) {
                            return value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Custom candlestick chart controller (simplified)
Chart.register({
    id: 'candlestick',
    beforeInit: function(chart) {
        if (chart.config.type === 'candlestick') {
            chart.config.type = 'bar';
        }
    }
});

// Update chart with new data
function updateChart() {
    if (!state.chart) return;
    
    const labels = state.candles.map(c => new Date(c.time).toLocaleTimeString());
    const sma20 = calculateSMA(state.candles, 20);
    const sma50 = calculateSMA(state.candles, 50);
    
    state.chart.data.labels = labels;
    state.chart.data.datasets[0].data = state.candles.map(c => ({
        x: c.time,
        o: c.open,
        h: c.high,
        l: c.low,
        c: c.close
    }));
    state.chart.data.datasets[1].data = sma20;
    state.chart.data.datasets[2].data = sma50;
    
    state.chart.update('none');
}

// Start price simulation
function startPriceSimulation() {
    setInterval(() => {
        updatePrice();
        updatePositions();
        updateAccountInfo();
        updatePositionsDisplay();
        updateCoachPanel();
    }, 500);
    
    setInterval(() => {
        createNewCandle();
    }, 15000);
}

// Update current price
function updatePrice() {
    const volatility = 0.3;
    const trend = (Math.random() - 0.5) * 0.1;
    const spike = Math.random() < 0.02 ? (Math.random() - 0.5) * 20 : 0;
    
    const change = (Math.random() - 0.5) * volatility + trend + spike;
    state.currentPrice = Math.max(
        config.priceRangeLow,
        Math.min(config.priceRangeHigh, state.currentPrice + change)
    );
    
    state.currentPrice = parseFloat(state.currentPrice.toFixed(2));
    
    if (state.lastCandle) {
        state.lastCandle.close = state.currentPrice;
        state.lastCandle.high = Math.max(state.lastCandle.high, state.currentPrice);
        state.lastCandle.low = Math.min(state.lastCandle.low, state.currentPrice);
    }
    
    updatePriceDisplay();
}

// Create new candle
function createNewCandle() {
    const newCandle = {
        time: Date.now(),
        open: state.currentPrice,
        high: state.currentPrice,
        low: state.currentPrice,
        close: state.currentPrice
    };
    
    state.candles.push(newCandle);
    if (state.candles.length > 100) {
        state.candles.shift();
    }
    
    state.lastCandle = newCandle;
    updateChart();
}

// Update price display
function updatePriceDisplay() {
    const priceEl = document.getElementById('currentPrice');
    const changeEl = document.getElementById('priceChange');
    
    priceEl.textContent = state.currentPrice.toFixed(2);
    
    state.priceHistory.push(state.currentPrice);
    if (state.priceHistory.length > 100) {
        state.priceHistory.shift();
    }
    
    const firstPrice = state.priceHistory[0];
    const changePercent = ((state.currentPrice - firstPrice) / firstPrice * 100).toFixed(2);
    changeEl.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent}%`;
    changeEl.className = changePercent >= 0 ? 'price-change positive' : 'price-change negative';
    
    priceEl.className = changePercent >= 0 ? 'current-price' : 'current-price';
    priceEl.style.color = changePercent >= 0 ? '#26a69a' : '#ef5350';
}

// Update positions with current price
function updatePositions() {
    state.positions.forEach(position => {
        position.currentPrice = state.currentPrice;
        
        const priceDiff = position.type === 'BUY' 
            ? position.currentPrice - position.entryPrice
            : position.entryPrice - position.currentPrice;
        
        const pips = priceDiff / config.pipValue;
        position.pips = parseFloat(pips.toFixed(2));
        position.profit = parseFloat((pips * position.lotSize * 100).toFixed(2));
        position.profitPercent = parseFloat(((position.profit / state.balance) * 100).toFixed(2));
        
        checkStopLossAndTakeProfit(position);
    });
}

// Check if stop loss or take profit is hit
function checkStopLossAndTakeProfit(position) {
    if (position.type === 'BUY') {
        if (position.currentPrice <= position.stopLossPrice) {
            closePosition(position, 'Stop Loss');
        } else if (position.currentPrice >= position.takeProfitPrice) {
            closePosition(position, 'Take Profit');
        }
    } else {
        if (position.currentPrice >= position.stopLossPrice) {
            closePosition(position, 'Stop Loss');
        } else if (position.currentPrice <= position.takeProfitPrice) {
            closePosition(position, 'Take Profit');
        }
    }
}

// Calculate account metrics
function calculateAccountMetrics() {
    let usedMargin = 0;
    let openPL = 0;
    
    state.positions.forEach(position => {
        usedMargin += position.lotSize * config.lotValue * config.marginRequirement;
        openPL += position.profit;
    });
    
    const equity = state.balance + openPL;
    const freeMargin = equity - usedMargin;
    
    return { usedMargin, openPL, equity, freeMargin };
}

// Update account info display
function updateAccountInfo() {
    const metrics = calculateAccountMetrics();
    
    document.getElementById('balance').textContent = `$${state.balance.toFixed(2)}`;
    document.getElementById('equity').textContent = `$${metrics.equity.toFixed(2)}`;
    document.getElementById('usedMargin').textContent = `$${metrics.usedMargin.toFixed(2)}`;
    document.getElementById('freeMargin').textContent = `$${metrics.freeMargin.toFixed(2)}`;
    
    const openPLEl = document.getElementById('openPL');
    openPLEl.textContent = `$${metrics.openPL.toFixed(2)}`;
    openPLEl.className = metrics.openPL >= 0 ? 'info-value positive' : 'info-value negative';
    
    const statusEl = document.getElementById('accountStatus');
    if (metrics.equity >= state.balance) {
        statusEl.textContent = 'Operativo';
        statusEl.className = 'info-value positive';
    } else {
        statusEl.textContent = 'En Pérdida';
        statusEl.className = 'info-value negative';
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('buyBtn').addEventListener('click', () => openPosition('BUY'));
    document.getElementById('sellBtn').addEventListener('click', () => openPosition('SELL'));
    document.getElementById('closeAllBtn').addEventListener('click', closeAllPositions);
    
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentTimeframe = e.target.dataset.timeframe;
        });
    });
    
    document.getElementById('cancelModifyBtn').addEventListener('click', () => {
        document.getElementById('modifyModal').style.display = 'none';
    });
    
    // Add listeners for entry validation
    document.getElementById('lotSize').addEventListener('input', validateEntryInputs);
    document.getElementById('stopLoss').addEventListener('input', validateEntryInputs);
    document.getElementById('takeProfit').addEventListener('input', validateEntryInputs);
}

// Validate trade inputs
function validateTradeInputs() {
    const lotSize = parseFloat(document.getElementById('lotSize').value);
    const stopLoss = parseFloat(document.getElementById('stopLoss').value);
    const takeProfit = parseFloat(document.getElementById('takeProfit').value);
    
    if (isNaN(lotSize) || lotSize <= 0) {
        return { valid: false, message: '⚠️ Tamaño del lote inválido. Debe ser un número positivo.', type: 'error' };
    }
    
    if (lotSize < config.minLot) {
        return { valid: false, message: `⚠️ Tamaño del lote muy pequeño! Mínimo es ${config.minLot} lotes. Cada lote representa $100,000 en valor nocional.`, type: 'error' };
    }
    
    if (lotSize > config.maxLot) {
        return { valid: false, message: `⚠️ Tamaño del lote muy grande! Máximo es ${config.maxLot} lotes.`, type: 'error' };
    }
    
    if (isNaN(stopLoss) || stopLoss <= 0) {
        return { valid: false, message: '⚠️ Stop loss requerido para gestión de riesgo! Siempre protege tu operación.', type: 'error' };
    }
    
    if (isNaN(takeProfit) || takeProfit <= 0) {
        return { valid: false, message: '⚠️ Take profit recomendado! Define tu objetivo de ganancias.', type: 'warning' };
    }
    
    const requiredMargin = lotSize * config.lotValue * config.marginRequirement;
    const metrics = calculateAccountMetrics();
    
    if (requiredMargin > metrics.freeMargin) {
        return { valid: false, message: `⚠️ Margen insuficiente! Reduce el tamaño del lote o cierra posiciones existentes. Tienes $${metrics.freeMargin.toFixed(2)} disponible.`, type: 'error' };
    }
    
    return { valid: true, lotSize, stopLoss, takeProfit };
}

// Open a new position
function openPosition(type) {
    const validation = validateTradeInputs();
    
    if (!validation.valid) {
        showMessage(validation.message, validation.type);
        return;
    }
    
    const { lotSize, stopLoss, takeProfit } = validation;
    
    const stopLossPips = stopLoss;
    const takeProfitPips = takeProfit;
    
    const stopLossPrice = type === 'BUY'
        ? state.currentPrice - (stopLossPips * config.pipValue)
        : state.currentPrice + (stopLossPips * config.pipValue);
    
    const takeProfitPrice = type === 'BUY'
        ? state.currentPrice + (takeProfitPips * config.pipValue)
        : state.currentPrice - (takeProfitPips * config.pipValue);
    
    const position = {
        id: state.positionCounter++,
        type,
        entryPrice: state.currentPrice,
        currentPrice: state.currentPrice,
        lotSize,
        stopLossPrice: parseFloat(stopLossPrice.toFixed(2)),
        takeProfitPrice: parseFloat(takeProfitPrice.toFixed(2)),
        profit: 0,
        profitPercent: 0,
        pips: 0,
        openTime: Date.now()
    };
    
    state.positions.push(position);
    updatePositionsDisplay();
    updateAccountInfo();
    
    showMessage(`✅ Orden ${type} abierta! ${lotSize} lote${lotSize > 1 ? 's' : ''} a ${state.currentPrice.toFixed(2)} con SL a ${stopLossPrice.toFixed(2)}`, 'success');
}

// Close a position
function closePosition(position, reason = 'Manual Close') {
    const index = state.positions.findIndex(p => p.id === position.id);
    if (index === -1) return;
    
    state.positions.splice(index, 1);
    
    state.balance += position.profit;
    
    const duration = Math.floor((Date.now() - position.openTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    state.closedTrades.push({
        ...position,
        exitPrice: position.currentPrice,
        closeTime: Date.now(),
        duration: `${minutes}m ${seconds}s`,
        reason
    });
    
    updatePositionsDisplay();
    updateHistoryDisplay();
    updateAccountInfo();
    
    const profitText = position.profit >= 0 ? `ganancia de $${position.profit.toFixed(2)}` : `pérdida de $${Math.abs(position.profit).toFixed(2)}`;
    showMessage(`Posición cerrada: ${reason}. ${profitText}`, position.profit >= 0 ? 'success' : 'info');
}

// Close all positions
function closeAllPositions() {
    if (state.positions.length === 0) {
        showMessage('ℹ️ No hay posiciones abiertas para cerrar.', 'info');
        return;
    }
    
    const positionsToClose = [...state.positions];
    positionsToClose.forEach(position => {
        closePosition(position, 'Manual Close');
    });
}

// Update positions display
function updatePositionsDisplay() {
    const container = document.getElementById('positionsContainer');
    
    if (state.positions.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay posiciones abiertas</div>';
        return;
    }
    
    const tableHTML = `
        <table class="positions-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Tipo</th>
                    <th>Entrada</th>
                    <th>Actual</th>
                    <th>Lotes</th>
                    <th>Pips</th>
                    <th>P&amp;L</th>
                    <th>SL</th>
                    <th>TP</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${state.positions.map(pos => `
                    <tr>
                        <td>${pos.id}</td>
                        <td><span class="type-badge ${pos.type.toLowerCase()}">${pos.type}</span></td>
                        <td>${pos.entryPrice.toFixed(2)}</td>
                        <td>${pos.currentPrice.toFixed(2)}</td>
                        <td>${pos.lotSize.toFixed(2)}</td>
                        <td class="${pos.pips >= 0 ? 'profit-positive' : 'profit-negative'}">${pos.pips.toFixed(2)}</td>
                        <td class="${pos.profit >= 0 ? 'profit-positive' : 'profit-negative'}">$${pos.profit.toFixed(2)} (${pos.profitPercent.toFixed(2)}%)</td>
                        <td>${pos.stopLossPrice.toFixed(2)}</td>
                        <td>${pos.takeProfitPrice.toFixed(2)}</td>
                        <td>
                            <button class="action-btn danger" onclick="closePositionById(${pos.id})">Cerrar</button>
                            <button class="action-btn" onclick="modifyPosition(${pos.id})">Modificar</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

// Update history display
function updateHistoryDisplay() {
    const container = document.getElementById('historyContainer');
    const statsContainer = document.getElementById('statsContainer');
    
    if (state.closedTrades.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay operaciones cerradas</div>';
        statsContainer.style.display = 'none';
        return;
    }
    
    const tableHTML = `
        <table class="history-table">
            <thead>
                <tr>
                    <th>Tipo</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Lotes</th>
                    <th>Resultado</th>
                    <th>Duración</th>
                    <th>Razón</th>
                </tr>
            </thead>
            <tbody>
                ${state.closedTrades.slice(-10).reverse().map(trade => `
                    <tr>
                        <td><span class="type-badge ${trade.type.toLowerCase()}">${trade.type}</span></td>
                        <td>${trade.entryPrice.toFixed(2)}</td>
                        <td>${trade.exitPrice.toFixed(2)}</td>
                        <td>${trade.lotSize.toFixed(2)}</td>
                        <td class="${trade.profit >= 0 ? 'profit-positive' : 'profit-negative'}">$${trade.profit.toFixed(2)} (${trade.profitPercent.toFixed(2)}%)</td>
                        <td>${trade.duration}</td>
                        <td>${trade.reason}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
    
    const totalTrades = state.closedTrades.length;
    const winningTrades = state.closedTrades.filter(t => t.profit > 0).length;
    const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;
    const totalPL = state.closedTrades.reduce((sum, t) => sum + t.profit, 0);
    
    document.getElementById('totalTrades').textContent = totalTrades;
    document.getElementById('winRate').textContent = `${winRate}%`;
    document.getElementById('totalPL').textContent = `$${totalPL.toFixed(2)}`;
    document.getElementById('totalPL').className = totalPL >= 0 ? 'stat-value profit-positive' : 'stat-value profit-negative';
    
    statsContainer.style.display = 'flex';
}

// Close position by ID (global function for onclick)
window.closePositionById = function(id) {
    const position = state.positions.find(p => p.id === id);
    if (position) {
        closePosition(position, 'Manual Close');
    }
};

// Modify position (global function for onclick)
let currentModifyPosition = null;

window.modifyPosition = function(id) {
    const position = state.positions.find(p => p.id === id);
    if (!position) return;
    
    currentModifyPosition = position;
    
    const currentSLPips = Math.abs((position.stopLossPrice - position.entryPrice) / config.pipValue);
    const currentTPPips = Math.abs((position.takeProfitPrice - position.entryPrice) / config.pipValue);
    
    document.getElementById('modifyStopLoss').value = currentSLPips.toFixed(0);
    document.getElementById('modifyTakeProfit').value = currentTPPips.toFixed(0);
    document.getElementById('modifyModal').style.display = 'flex';
};

document.getElementById('confirmModifyBtn').addEventListener('click', () => {
    if (!currentModifyPosition) return;
    
    const newSL = parseFloat(document.getElementById('modifyStopLoss').value);
    const newTP = parseFloat(document.getElementById('modifyTakeProfit').value);
    
    if (isNaN(newSL) || newSL <= 0 || isNaN(newTP) || newTP <= 0) {
        showMessage('⚠️ Valores inválidos para SL o TP', 'error');
        return;
    }
    
    if (currentModifyPosition.type === 'BUY') {
        currentModifyPosition.stopLossPrice = parseFloat((currentModifyPosition.entryPrice - (newSL * config.pipValue)).toFixed(2));
        currentModifyPosition.takeProfitPrice = parseFloat((currentModifyPosition.entryPrice + (newTP * config.pipValue)).toFixed(2));
    } else {
        currentModifyPosition.stopLossPrice = parseFloat((currentModifyPosition.entryPrice + (newSL * config.pipValue)).toFixed(2));
        currentModifyPosition.takeProfitPrice = parseFloat((currentModifyPosition.entryPrice - (newTP * config.pipValue)).toFixed(2));
    }
    
    updatePositionsDisplay();
    document.getElementById('modifyModal').style.display = 'none';
    showMessage('✅ Posición modificada exitosamente', 'success');
});

// Show message to user
function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    
    container.innerHTML = '';
    container.appendChild(messageEl);
    
    setTimeout(() => {
        if (container.contains(messageEl)) {
            container.removeChild(messageEl);
        }
    }, 5000);
}

// Show random educational tip
function showRandomTip() {
    const tip = educationalTips[Math.floor(Math.random() * educationalTips.length)];
    document.getElementById('educationalTip').textContent = `💡 ${tip}`;
}

// Coach System Functions
function updateCoachPanel() {
    analyzeMarket();
    updateMarketAnalysis();
    updateTechnicalSignals();
    updateStepByStepGuide();
    updateRiskManagement();
    checkForAlerts();
}

function analyzeMarket() {
    const sma20 = calculateSMA(state.candles, 20);
    const sma50 = calculateSMA(state.candles, 50);
    const rsi = calculateRSI(state.candles, 14);
    
    const currentIndex = state.candles.length - 1;
    state.coachAnalysis.ma20 = sma20[currentIndex] || 0;
    state.coachAnalysis.ma50 = sma50[currentIndex] || 0;
    state.coachAnalysis.rsi = rsi[currentIndex] || 50;
    
    // Determine trend
    if (state.currentPrice > state.coachAnalysis.ma20 && state.coachAnalysis.ma20 > state.coachAnalysis.ma50) {
        state.coachAnalysis.trend = 'UPTREND';
        state.coachAnalysis.strength = 'Fuerte';
    } else if (state.currentPrice < state.coachAnalysis.ma20 && state.coachAnalysis.ma20 < state.coachAnalysis.ma50) {
        state.coachAnalysis.trend = 'DOWNTREND';
        state.coachAnalysis.strength = 'Fuerte';
    } else if (Math.abs(state.coachAnalysis.ma20 - state.coachAnalysis.ma50) < 5) {
        state.coachAnalysis.trend = 'SIDEWAYS';
        state.coachAnalysis.strength = 'Débil';
    } else {
        state.coachAnalysis.trend = state.currentPrice > state.coachAnalysis.ma50 ? 'UPTREND' : 'DOWNTREND';
        state.coachAnalysis.strength = 'Moderada';
    }
    
    // Calculate volatility
    if (state.candles.length >= 10) {
        const recentCandles = state.candles.slice(-10);
        const avgRange = recentCandles.reduce((sum, c) => sum + (c.high - c.low), 0) / 10;
        
        if (avgRange < 5) {
            state.coachAnalysis.volatility = 'Baja';
        } else if (avgRange < 10) {
            state.coachAnalysis.volatility = 'Media';
        } else {
            state.coachAnalysis.volatility = 'Alta';
        }
    }
}

function updateMarketAnalysis() {
    const trendEl = document.getElementById('trendStatus');
    const strengthEl = document.getElementById('trendStrength');
    const volatilityEl = document.getElementById('volatilityLevel');
    
    trendEl.textContent = state.coachAnalysis.trend;
    trendEl.className = 'analysis-value ' + state.coachAnalysis.trend.toLowerCase();
    
    strengthEl.textContent = state.coachAnalysis.strength;
    volatilityEl.textContent = state.coachAnalysis.volatility;
}

function updateTechnicalSignals() {
    const container = document.getElementById('technicalSignals');
    const signals = [];
    
    const { ma20, ma50, rsi } = state.coachAnalysis;
    const price = state.currentPrice;
    
    // MA Analysis
    if (price > ma20 && ma20 > ma50) {
        signals.push({ text: '✅ Señal de Compra Fuerte - Todas las medias móviles alineadas hacia arriba', type: 'buy' });
    } else if (price < ma20 && ma20 < ma50) {
        signals.push({ text: '✅ Señal de Venta Fuerte - Todas las medias móviles alineadas hacia abajo', type: 'sell' });
    } else if (price > ma50 && price < ma20) {
        signals.push({ text: '⚠️ Señal Mixta - Tendencia alcista débil, espera confirmación', type: 'warning' });
    } else if (price < ma50 && price > ma20) {
        signals.push({ text: '⚠️ Señal Mixta - Tendencia bajista débil, espera confirmación', type: 'warning' });
    }
    
    // RSI Analysis
    if (rsi > 70) {
        signals.push({ text: `⚠️ SOBRECOMPRA (RSI: ${rsi.toFixed(1)}) - El precio puede retroceder pronto. Considera vender o esperar`, type: 'warning' });
    } else if (rsi < 30) {
        signals.push({ text: `⚠️ SOBREVENTA (RSI: ${rsi.toFixed(1)}) - Posible rebote próximo. Considera comprar o esperar`, type: 'warning' });
    } else if (rsi >= 30 && rsi <= 70) {
        signals.push({ text: `✅ NEUTRAL (RSI: ${rsi.toFixed(1)}) - Precio en rango saludable. Bueno para nuevas entradas`, type: 'buy' });
    }
    
    if (rsi >= 60 && rsi < 70) {
        signals.push({ text: '⚠️ Aproximándose a sobrecompra - Ten cuidado con órdenes de COMPRA', type: 'warning' });
    } else if (rsi > 30 && rsi <= 40) {
        signals.push({ text: '⚠️ Aproximándose a sobreventa - Ten cuidado con órdenes de VENTA', type: 'warning' });
    }
    
    container.innerHTML = signals.map(s => 
        `<div class="signal-item ${s.type}">${s.text}</div>`
    ).join('');
}

function updateStepByStepGuide() {
    const container = document.getElementById('stepByStepGuide');
    const { trend, ma20, ma50, rsi } = state.coachAnalysis;
    const price = state.currentPrice;
    const steps = [];
    
    // Strong Uptrend Setup
    if (price > ma20 && ma20 > ma50 && rsi >= 40 && rsi < 70) {
        steps.push({ text: '📊 GUÍA PASO A PASO - OPORTUNIDAD DE COMPRA', type: 'action' });
        steps.push({ text: `Paso 1: ✅ Confirmar tendencia - Precio está sobre MA50 (alcista)`, type: 'completed' });
        steps.push({ text: `Paso 2: ✅ Verificar MA20 - Está sobre MA50 (tendencia alcista confirmada)`, type: 'completed' });
        steps.push({ text: `Paso 3: ✅ Verificar RSI - En ${rsi.toFixed(1)} (momento saludable, no sobrecomprado)`, type: 'completed' });
        steps.push({ text: `Paso 4: 👉 ACCIÓN: Considera una posición de COMPRA`, type: 'action' });
        steps.push({ text: `        - Tamaño sugerido: 0.05 lotes (conservador para aprender)`, type: '' });
        steps.push({ text: `        - Stop loss: ${(price - 0.50).toFixed(2)} (50 pips)`, type: '' });
        steps.push({ text: `        - Take profit: ${(price + 1.00).toFixed(2)} (100 pips)`, type: '' });
        steps.push({ text: `Paso 5: 💡 ¿Por qué? Todas las señales están alineadas. Setup de alta probabilidad.`, type: '' });
    }
    // Strong Downtrend Setup
    else if (price < ma20 && ma20 < ma50 && rsi >= 30 && rsi < 60) {
        steps.push({ text: '📊 GUÍA PASO A PASO - OPORTUNIDAD DE VENTA', type: 'action' });
        steps.push({ text: `Paso 1: ✅ Confirmar tendencia - Precio está bajo MA50 (bajista)`, type: 'completed' });
        steps.push({ text: `Paso 2: ✅ Verificar MA20 - Está bajo MA50 (tendencia bajista confirmada)`, type: 'completed' });
        steps.push({ text: `Paso 3: ✅ Verificar RSI - En ${rsi.toFixed(1)} (momento saludable, no sobrevendido)`, type: 'completed' });
        steps.push({ text: `Paso 4: 👉 ACCIÓN: Considera una posición de VENTA`, type: 'action' });
        steps.push({ text: `        - Tamaño sugerido: 0.05 lotes (conservador)`, type: '' });
        steps.push({ text: `        - Stop loss: ${(price + 0.50).toFixed(2)} (50 pips)`, type: '' });
        steps.push({ text: `        - Take profit: ${(price - 1.00).toFixed(2)} (100 pips)`, type: '' });
        steps.push({ text: `Paso 5: 💡 ¿Por qué? Configuración bajista clara y confirmada.`, type: '' });
    }
    // Overbought Condition
    else if (rsi > 70) {
        steps.push({ text: '📊 CONDICIÓN DE MERCADO - ADVERTENCIA DE SOBRECOMPRA', type: 'warning' });
        steps.push({ text: `Paso 1: ⚠️ RSI está en ${rsi.toFixed(1)} (sobre 70 = sobrecomprado)`, type: 'warning' });
        steps.push({ text: `Paso 2: 📍 El precio puede retroceder o revertir pronto`, type: '' });
        steps.push({ text: `Paso 3: 💡 Mejor acción: ESPERAR a que RSI baje de 70`, type: '' });
        steps.push({ text: `           O tomar ganancias si tienes posiciones de compra abiertas`, type: '' });
        steps.push({ text: `Paso 4: ❌ EVITAR: Abrir nuevas posiciones de COMPRA (alto riesgo de retroceso)`, type: 'warning' });
        steps.push({ text: `Paso 5: ✅ CONSIDERAR: Posición de VENTA SI el precio rompe bajo MA20`, type: '' });
    }
    // Oversold Condition
    else if (rsi < 30) {
        steps.push({ text: '📊 CONDICIÓN DE MERCADO - OPORTUNIDAD DE SOBREVENTA', type: 'action' });
        steps.push({ text: `Paso 1: ✅ RSI está en ${rsi.toFixed(1)} (bajo 30 = sobrevendido)`, type: 'completed' });
        steps.push({ text: `Paso 2: 📍 El precio puede rebotar pronto`, type: '' });
        steps.push({ text: `Paso 3: 💡 Mejor acción: ESPERAR confirmación de RSI sobre 30`, type: '' });
        steps.push({ text: `           O entrar en COMPRA cuando precio rompa sobre MA20`, type: '' });
        steps.push({ text: `Paso 4: ❌ EVITAR: Abrir nuevas posiciones de VENTA (alto riesgo de rebote)`, type: 'warning' });
        steps.push({ text: `Paso 5: ✅ CONSIDERAR: Posición de COMPRA con stop loss ajustado`, type: '' });
    }
    // Sideways Market
    else if (Math.abs(ma20 - ma50) < 5 && rsi >= 40 && rsi <= 60) {
        steps.push({ text: '📊 CONDICIÓN DE MERCADO - FASE DE CONSOLIDACIÓN', type: 'warning' });
        steps.push({ text: `Paso 1: 🔄 Precio moviéndose lateralmente (sin tendencia clara)`, type: '' });
        steps.push({ text: `Paso 2: 📊 Medias móviles aplanándose o muy cercanas`, type: '' });
        steps.push({ text: `Paso 3: ⚠️ Setups de baja probabilidad ahora mismo`, type: 'warning' });
        steps.push({ text: `Paso 4: 💡 Mejor acción: ESPERAR una ruptura`, type: '' });
        steps.push({ text: `        - Esperar a que el precio rompa claramente sobre o bajo MA50`, type: '' });
        steps.push({ text: `        - Esperar a que RSI entre claramente en sobrecompra o sobreventa`, type: '' });
        steps.push({ text: `Paso 5: ✅ PACIENCIA: ¡Las mejores operaciones ocurren después de la consolidación!`, type: '' });
    }
    // Mixed signals - wait
    else {
        steps.push({ text: '📊 SEÑALES MIXTAS - MODO DE OBSERVACIÓN', type: 'warning' });
        steps.push({ text: `Paso 1: ⚠️ Las señales técnicas no están alineadas claramente`, type: 'warning' });
        steps.push({ text: `Paso 2: 💡 Mejor acción: ESPERAR mejor configuración`, type: '' });
        steps.push({ text: `Paso 3: 📚 Mientras tanto, observa cómo se desarrolla el mercado`, type: '' });
        steps.push({ text: `Paso 4: ✅ La paciencia es clave - No forzar operaciones`, type: '' });
    }
    
    container.innerHTML = steps.map(s => 
        `<div class="step-item ${s.type}">${s.text}</div>`
    ).join('');
}

function updateRiskManagement() {
    const container = document.getElementById('riskManagement');
    const metrics = calculateAccountMetrics();
    
    const safeLotSize = (state.balance * 0.02) / (20 * 100); // 2% risk with 20 pip SL
    const currentRisk = (metrics.usedMargin / state.balance) * 100;
    
    const html = `
        <div class="risk-item">
            <span class="risk-label">Margen Disponible:</span>
            <span class="risk-value ${metrics.freeMargin > state.balance * 0.5 ? 'safe' : 'warning'}">$${metrics.freeMargin.toFixed(2)}</span>
        </div>
        <div class="risk-item">
            <span class="risk-label">Tamaño Seguro Max:</span>
            <span class="risk-value safe">${safeLotSize.toFixed(2)} lotes</span>
        </div>
        <div class="risk-item">
            <span class="risk-label">Riesgo Actual:</span>
            <span class="risk-value ${currentRisk < 2 ? 'safe' : currentRisk < 5 ? 'warning' : 'danger'}">${currentRisk.toFixed(2)}%</span>
        </div>
        <div class="risk-item">
            <span class="risk-label">Posiciones Abiertas:</span>
            <span class="risk-value">${state.positions.length}</span>
        </div>
        ${currentRisk > 5 ? '<div class="step-item warning" style="margin-top: 8px;">🛑 ¡DETENTE! Estás arriesgando demasiado. Cierra algunas posiciones o reduce el tamaño del lote.</div>' : ''}
        ${currentRisk <= 2 && currentRisk > 0 ? '<div class="step-item completed" style="margin-top: 8px;">✅ Nivel de riesgo bueno. Puedes abrir nuevas posiciones.</div>' : ''}
        ${currentRisk === 0 ? '<div class="step-item" style="margin-top: 8px;">✅ Sin riesgo activo. Listo para nueva operación.</div>' : ''}
    `;
    
    container.innerHTML = html;
}

function checkForAlerts() {
    const { ma20, ma50, rsi } = state.coachAnalysis;
    const price = state.currentPrice;
    
    // MA Crossover alerts
    if (!state.lastAlertConditions.priceAboveMA50 && price > ma50) {
        addAlert('🔔 ALERTA: ¡Precio cruzó sobre MA50! Señal alcista confirmada.', 'bullish');
        state.lastAlertConditions.priceAboveMA50 = true;
    } else if (state.lastAlertConditions.priceAboveMA50 && price < ma50) {
        addAlert('🔔 ALERTA: ¡Precio cruzó bajo MA50! Señal bajista confirmada.', 'bearish');
        state.lastAlertConditions.priceAboveMA50 = false;
    }
    
    // RSI alerts
    if (!state.lastAlertConditions.rsiOverbought && rsi > 70) {
        addAlert('🔔 ALERTA: RSI entró en zona de sobrecompra (>70)! Considera tomar ganancias.', 'warning');
        state.lastAlertConditions.rsiOverbought = true;
    } else if (state.lastAlertConditions.rsiOverbought && rsi <= 70) {
        state.lastAlertConditions.rsiOverbought = false;
    }
    
    if (!state.lastAlertConditions.rsiOversold && rsi < 30) {
        addAlert('🔔 ALERTA: RSI entró en zona de sobreventa (<30)! Posible rebote próximo.', 'warning');
        state.lastAlertConditions.rsiOversold = true;
    } else if (state.lastAlertConditions.rsiOversold && rsi >= 30) {
        state.lastAlertConditions.rsiOversold = false;
    }
    
    // MA crossover imminent
    if (Math.abs(ma20 - ma50) < 2 && Math.abs(ma20 - ma50) > 0.5) {
        if (!state.lastAlertConditions.maCrossoverImminent) {
            addAlert('🔔 ALERTA: ¡MA20 y MA50 están a punto de cruzarse! ¿Cambio de tendencia próximo?', 'warning');
            state.lastAlertConditions.maCrossoverImminent = true;
        }
    } else {
        state.lastAlertConditions.maCrossoverImminent = false;
    }
    
    // Position profit alerts
    state.positions.forEach(pos => {
        if (pos.pips >= 50 && !pos.alerted50Pips) {
            addAlert(`🔔 ALERTA: Tu posición #${pos.id} está ahora +${pos.pips.toFixed(0)} pips! Considera mover stop a breakeven.`, 'bullish');
            pos.alerted50Pips = true;
        }
    });
}

function addAlert(message, type = 'info') {
    const alert = {
        message,
        type,
        time: new Date().toLocaleTimeString()
    };
    
    state.alerts.unshift(alert);
    if (state.alerts.length > 10) {
        state.alerts = state.alerts.slice(0, 10);
    }
    
    updateAlertsDisplay();
}

function updateAlertsDisplay() {
    const container = document.getElementById('alertsContainer');
    
    if (state.alerts.length === 0) {
        container.innerHTML = '<div class="alert-empty">Sin alertas recientes</div>';
        return;
    }
    
    container.innerHTML = state.alerts.map(alert => `
        <div class="alert-item ${alert.type}">
            ${alert.message}
            <div class="alert-time">${alert.time}</div>
        </div>
    `).join('');
}

// Validate entry when inputs change
function validateEntryInputs() {
    const lotSize = parseFloat(document.getElementById('lotSize').value);
    const stopLoss = parseFloat(document.getElementById('stopLoss').value);
    const takeProfit = parseFloat(document.getElementById('takeProfit').value);
    
    if (isNaN(lotSize) || isNaN(stopLoss) || isNaN(takeProfit)) {
        document.getElementById('entryValidationSection').style.display = 'none';
        return;
    }
    
    document.getElementById('entryValidationSection').style.display = 'block';
    
    const riskReward = takeProfit / stopLoss;
    const riskAmount = lotSize * stopLoss * 100;
    const riskPercent = (riskAmount / state.balance) * 100;
    
    let assessmentClass = 'good';
    let assessmentText = [];
    
    // Evaluate stop loss
    if (stopLoss < 10) {
        assessmentClass = 'bad';
        assessmentText.push(`⚠️ Stop Loss muy cercano: Solo ${stopLoss} pips - puede ser eliminado por el ruido del mercado`);
    } else if (stopLoss >= 10 && stopLoss <= 30) {
        assessmentText.push(`✅ Distancia de Stop Loss: Buena (${stopLoss} pips es razonable)`);
    } else {
        assessmentText.push(`⚠️ Stop Loss amplio: ${stopLoss} pips - considera reducir para mejor gestión de riesgo`);
    }
    
    // Evaluate risk/reward
    if (riskReward >= 2) {
        assessmentText.push(`✅ Risk/Reward: Excelente (1:${riskReward.toFixed(1)} es muy bueno)`);
    } else if (riskReward >= 1) {
        assessmentText.push(`✅ Risk/Reward: Aceptable (1:${riskReward.toFixed(1)})`);
    } else {
        assessmentClass = 'bad';
        assessmentText.push(`❌ Risk/Reward pobre: 1:${riskReward.toFixed(1)} - no vale el riesgo`);
    }
    
    // Evaluate position size
    if (riskPercent <= 2) {
        assessmentText.push(`✅ Tamaño de posición: Seguro (usa ${riskPercent.toFixed(2)}% de la cuenta)`);
    } else if (riskPercent <= 5) {
        assessmentText.push(`⚠️ Tamaño de posición: Moderado (usa ${riskPercent.toFixed(2)}% de la cuenta)`);
    } else {
        assessmentClass = 'bad';
        assessmentText.push(`❌ Posición muy grande: Usaría ${riskPercent.toFixed(2)}% de la cuenta`);
    }
    
    // Final recommendation
    if (assessmentClass === 'good') {
        assessmentText.push(`\n👍 ¡Este es un setup de ALTA CALIDAD! Procede con confianza.`);
    } else {
        assessmentText.push(`\n👎 Este setup necesita ajustes. Intenta stops más amplios o lote más pequeño.`);
    }
    
    const html = `
        <div class="validation-item">
            <span>Precio de Entrada:</span>
            <span>${state.currentPrice.toFixed(2)}</span>
        </div>
        <div class="validation-item">
            <span>Stop Loss:</span>
            <span>${stopLoss} pips</span>
        </div>
        <div class="validation-item">
            <span>Take Profit:</span>
            <span>${takeProfit} pips</span>
        </div>
        <div class="validation-item">
            <span>Risk/Reward:</span>
            <span>1:${riskReward.toFixed(1)}</span>
        </div>
        <div class="validation-assessment ${assessmentClass}">
            ${assessmentText.join('<br>')}
        </div>
    `;
    
    document.getElementById('entryValidation').innerHTML = html;
}

// Initialize the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}