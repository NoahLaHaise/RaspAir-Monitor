var THRESHOLDS = {
  voc:  [{ limit: 100, color: '#4ade80' }, { limit: 200, color: '#facc15' }, { limit: Infinity, color: '#ef4444' }],
  co2:  [{ limit: 800, color: '#4ade80' }, { limit: 1200, color: '#facc15' }, { limit: Infinity, color: '#ef4444' }],
  temp: [{ limit: 18, color: '#60a5fa' }, { limit: 20, color: '#4ade80' }, { limit: 24, color: '#4ade80' }, { limit: 27, color: '#facc15' }, { limit: Infinity, color: '#ef4444' }],
  hum:  [{ limit: 20, color: '#ef4444' }, { limit: 30, color: '#facc15' }, { limit: 50, color: '#4ade80' }, { limit: 60, color: '#facc15' }, { limit: Infinity, color: '#ef4444' }],
  pm25: [{ limit: 12, color: '#4ade80' }, { limit: 35, color: '#facc15' }, { limit: Infinity, color: '#ef4444' }],
  pm10: [{ limit: 54, color: '#4ade80' }, { limit: 154, color: '#facc15' }, { limit: Infinity, color: '#ef4444' }],
  pm1:  [{ limit: 10, color: '#4ade80' }, { limit: 25, color: '#facc15' }, { limit: Infinity, color: '#ef4444' }],
  pm4:  [{ limit: 25, color: '#4ade80' }, { limit: 50, color: '#facc15' }, { limit: Infinity, color: '#ef4444' }],
  nox:  [{ limit: 20, color: '#4ade80' }, { limit: 150, color: '#facc15' }, { limit: Infinity, color: '#ef4444' }]
};

// Store chart data for tooltip lookups
var chartData = {};

function getColor(value, thresholds) {
  for (var i = 0; i < thresholds.length; i++) {
    if (value < thresholds[i].limit) return thresholds[i].color;
  }
  return thresholds[thresholds.length - 1].color;
}

function drawChart(canvasId, dataPoints, timestamps, thresholds, minFloor) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  var w = rect.width, h = rect.height;
  var pad = { top: 8, right: 8, bottom: 20, left: 40 };
  var plotW = w - pad.left - pad.right;
  var plotH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  if (!dataPoints || dataPoints.length === 0) {
    ctx.fillStyle = '#3d5068';
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NO DATA', w / 2, h / 2);
    return;
  }

  var minV = Math.min.apply(null, dataPoints);
  var maxV = Math.max.apply(null, dataPoints);
  if (minV === maxV) { minV -= 1; maxV += 1; }
  var rangeV = maxV - minV;
  var marginV = rangeV * 0.1;
  minV -= marginV;
  maxV += marginV;
  if (minFloor != null && minV < minFloor) minV = minFloor;
  rangeV = maxV - minV;

  // Grid lines
  ctx.lineWidth = 1;
  ctx.font = '9px "Share Tech Mono", monospace';
  ctx.textAlign = 'right';
  for (var i = 0; i < 4; i++) {
    var frac = i / 3;
    var y = pad.top + plotH - frac * plotH;
    var val = minV + frac * rangeV;
    ctx.strokeStyle = '#1a2436';
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();
    ctx.fillStyle = '#3d5068';
    ctx.fillText(val.toFixed(1), pad.left - 4, y + 3);
  }

  // X-axis time labels
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3d5068';
  ctx.font = '9px "Share Tech Mono", monospace';
  var labelCount = Math.min(3, timestamps.length);
  for (var i = 0; i < labelCount; i++) {
    var idx;
    if (labelCount === 1) { idx = 0; }
    else { idx = Math.round(i * (timestamps.length - 1) / (labelCount - 1)); }
    var x = pad.left + (idx / (dataPoints.length - 1)) * plotW;
    var ts = timestamps[idx];
    var parts = ts.split(' ');
    var timePart = parts.length > 1 ? parts[1] : ts;
    var hm = timePart.substring(0, 5);
    ctx.fillText(hm, x, h - 3);
  }

  // Area fill under the line with gradient
  for (var i = 1; i < dataPoints.length; i++) {
    var x0 = pad.left + ((i - 1) / (dataPoints.length - 1)) * plotW;
    var y0 = pad.top + plotH - ((dataPoints[i - 1] - minV) / rangeV) * plotH;
    var x1 = pad.left + (i / (dataPoints.length - 1)) * plotW;
    var y1 = pad.top + plotH - ((dataPoints[i] - minV) / rangeV) * plotH;
    var avgVal = (dataPoints[i - 1] + dataPoints[i]) / 2;
    var segColor = getColor(avgVal, thresholds);

    // Subtle fill
    var r = parseInt(segColor.slice(1, 3), 16);
    var g = parseInt(segColor.slice(3, 5), 16);
    var b = parseInt(segColor.slice(5, 7), 16);
    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ', 0.06)';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1, pad.top + plotH);
    ctx.lineTo(x0, pad.top + plotH);
    ctx.closePath();
    ctx.fill();

    // Line
    ctx.strokeStyle = segColor;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  // Glow dot on last point
  if (dataPoints.length > 0) {
    var lastX = pad.left + plotW;
    var lastY = pad.top + plotH - ((dataPoints[dataPoints.length - 1] - minV) / rangeV) * plotH;
    var lastColor = getColor(dataPoints[dataPoints.length - 1], thresholds);
    var r2 = parseInt(lastColor.slice(1, 3), 16);
    var g2 = parseInt(lastColor.slice(3, 5), 16);
    var b2 = parseInt(lastColor.slice(5, 7), 16);

    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = lastColor;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + r2 + ',' + g2 + ',' + b2 + ', 0.2)';
    ctx.fill();
  }

  // Store data for tooltip
  chartData[canvasId] = {
    points: dataPoints,
    timestamps: timestamps,
    thresholds: thresholds,
    pad: pad,
    plotW: plotW,
    plotH: plotH,
    minV: minV,
    rangeV: rangeV
  };
}

function setCardAccent(cardId, value, thresholds) {
  var card = document.getElementById(cardId);
  if (!card || value == null) return;
  var color = getColor(value, thresholds);
  card.style.setProperty('--accent-color', color);
  card.querySelector('.reading-value').style.color = color;
}

var currentRange = '1hr';

function setRange(range) {
  currentRange = range;
  document.getElementById('btn-1hr').classList.toggle('active', range === '1hr');
  document.getElementById('btn-1day').classList.toggle('active', range === '1day');
  document.getElementById('telemetry-label').textContent =
    range === '1hr' ? 'Telemetry // Last Hour' : 'Telemetry // Last 24 Hours';
  fetchHistory();
}

function fetchHistory() {
  var hours_back = currentRange === '1day' ? 24 : 1;
  return fetch('/air_history?hours_back=' + hours_back)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data || data.length === 0) {
        drawChart('chart-voc', [], [], THRESHOLDS.voc, 0);
        drawChart('chart-co2', [], [], THRESHOLDS.co2, 0);
        drawChart('chart-temp', [], [], THRESHOLDS.temp);
        drawChart('chart-hum', [], [], THRESHOLDS.hum);
        drawChart('chart-pm1', [], [], THRESHOLDS.pm1, 0);
        drawChart('chart-pm25', [], [], THRESHOLDS.pm25, 0);
        drawChart('chart-pm4', [], [], THRESHOLDS.pm4, 0);
        drawChart('chart-pm10', [], [], THRESHOLDS.pm10, 0);
        return;
      }
      var ts = data.map(function(d) { return d.timestamp; });
      drawChart('chart-voc', data.map(function(d) { return d.VOC; }), ts, THRESHOLDS.voc, 0);
      drawChart('chart-co2', data.map(function(d) { return d.CO2; }), ts, THRESHOLDS.co2, 0);
      drawChart('chart-temp', data.map(function(d) { return d.Temp; }), ts, THRESHOLDS.temp);
      drawChart('chart-hum', data.map(function(d) { return d.Humidity; }), ts, THRESHOLDS.hum);
      drawChart('chart-pm1', data.map(function(d) { return d.PM1; }), ts, THRESHOLDS.pm1, 0);
      drawChart('chart-pm25', data.map(function(d) { return d.PM25; }), ts, THRESHOLDS.pm25, 0);
      drawChart('chart-pm4', data.map(function(d) { return d.PM4; }), ts, THRESHOLDS.pm4, 0);
      drawChart('chart-pm10', data.map(function(d) { return d.PM10; }), ts, THRESHOLDS.pm10, 0);

      // Update chart header previews with latest value
      var last = data[data.length - 1];
      if (last) {
        document.getElementById('cv-voc').textContent = parseFloat(last.VOC).toFixed(0);
        document.getElementById('cv-co2').textContent = parseFloat(last.CO2).toFixed(0) + ' ppm';
        document.getElementById('cv-temp').textContent = parseFloat(last.Temp).toFixed(1) + ' \u00B0C';
        document.getElementById('cv-hum').textContent = parseFloat(last.Humidity).toFixed(1) + ' %';
        document.getElementById('cv-pm1').textContent = parseFloat(last.PM1).toFixed(1) + ' \u00B5g/m\u00B3';
        document.getElementById('cv-pm25').textContent = parseFloat(last.PM25).toFixed(1) + ' \u00B5g/m\u00B3';
        document.getElementById('cv-pm4').textContent = parseFloat(last.PM4).toFixed(1) + ' \u00B5g/m\u00B3';
        document.getElementById('cv-pm10').textContent = parseFloat(last.PM10).toFixed(1) + ' \u00B5g/m\u00B3';

        // Color the preview values
        document.getElementById('cv-voc').style.color = getColor(last.VOC, THRESHOLDS.voc);
        document.getElementById('cv-co2').style.color = getColor(last.CO2, THRESHOLDS.co2);
        document.getElementById('cv-temp').style.color = getColor(last.Temp, THRESHOLDS.temp);
        document.getElementById('cv-hum').style.color = getColor(last.Humidity, THRESHOLDS.hum);
        document.getElementById('cv-pm1').style.color = getColor(last.PM1, THRESHOLDS.pm1);
        document.getElementById('cv-pm25').style.color = getColor(last.PM25, THRESHOLDS.pm25);
        document.getElementById('cv-pm4').style.color = getColor(last.PM4, THRESHOLDS.pm4);
        document.getElementById('cv-pm10').style.color = getColor(last.PM10, THRESHOLDS.pm10);
      }
    })
    .catch(function(err) { console.error('History fetch error:', err); });
}

function fetchLatest() {
  return fetch('/air_data')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (!data) return;
      var fields = [
        ['v-pm1', 'PM1'], ['v-pm25', 'PM25'], ['v-pm4', 'PM4'], ['v-pm10', 'PM10'],
        ['v-co2', 'CO2'], ['v-voc', 'VOC'], ['v-nox', 'NOx'],
        ['v-temp', 'Temp'], ['v-hum', 'Humidity']
      ];
      for (var i = 0; i < fields.length; i++) {
        var el = document.getElementById(fields[i][0]);
        var val = data[fields[i][1]];
        if (el && val != null) el.textContent = parseFloat(val).toFixed(1);
      }

      // Set accent colors on reading cards
      setCardAccent('card-pm1', data.PM1, THRESHOLDS.pm1);
      setCardAccent('card-pm25', data.PM25, THRESHOLDS.pm25);
      setCardAccent('card-pm4', data.PM4, THRESHOLDS.pm4);
      setCardAccent('card-pm10', data.PM10, THRESHOLDS.pm10);
      setCardAccent('card-co2', data.CO2, THRESHOLDS.co2);
      setCardAccent('card-voc', data.VOC, THRESHOLDS.voc);
      setCardAccent('card-nox', data.NOx, THRESHOLDS.nox);
      setCardAccent('card-temp', data.Temp, THRESHOLDS.temp);
      setCardAccent('card-hum', data.Humidity, THRESHOLDS.hum);

      var tsEl = document.getElementById('timestamp');
      if (tsEl && data.timestamp) tsEl.textContent = 'LAST UPDATE // ' + data.timestamp;

      document.getElementById('conn-status').textContent = 'LIVE';
    })
    .catch(function(err) {
      console.error('Latest fetch error:', err);
      document.getElementById('conn-status').textContent = 'OFFLINE';
    });
}

function refresh() {
  Promise.all([fetchHistory(), fetchLatest()]);
}

refresh();
setInterval(refresh, 30000);

// --- Chart tooltip handlers ---
['chart-voc', 'chart-co2', 'chart-temp', 'chart-hum', 'chart-pm1', 'chart-pm25', 'chart-pm4', 'chart-pm10'].forEach(function(canvasId) {
  var canvas = document.getElementById(canvasId);
  var tooltip = document.getElementById('tt-' + canvasId);
  if (!canvas || !tooltip) return;

  canvas.addEventListener('mousemove', function(e) {
    var cd = chartData[canvasId];
    if (!cd || !cd.points || cd.points.length === 0) return;

    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    // Check if mouse is within the plot area
    if (mx < cd.pad.left || mx > cd.pad.left + cd.plotW ||
        my < cd.pad.top || my > cd.pad.top + cd.plotH) {
      tooltip.classList.remove('visible');
      return;
    }

    // Find nearest data point index
    var frac = (mx - cd.pad.left) / cd.plotW;
    var idx = Math.round(frac * (cd.points.length - 1));
    idx = Math.max(0, Math.min(cd.points.length - 1, idx));

    var val = cd.points[idx];
    var ts = cd.timestamps[idx];
    var parts = ts.split(' ');
    var timePart = parts.length > 1 ? parts[1] : ts;
    var hm = timePart.substring(0, 8);

    var color = getColor(val, cd.thresholds);
    tooltip.querySelector('.tt-time').textContent = hm;
    tooltip.querySelector('.tt-value').textContent = val.toFixed(1);
    tooltip.querySelector('.tt-value').style.color = color;

    // Position tooltip relative to chart-card
    var cardRect = canvas.parentElement.getBoundingClientRect();
    var tx = e.clientX - cardRect.left + 12;
    var ty = e.clientY - cardRect.top - 30;

    // Keep tooltip within the card bounds
    if (tx + 90 > cardRect.width) tx = e.clientX - cardRect.left - 90;
    if (ty < 0) ty = e.clientY - cardRect.top + 12;

    tooltip.style.left = tx + 'px';
    tooltip.style.top = ty + 'px';
    tooltip.classList.add('visible');
  });

  canvas.addEventListener('mouseleave', function() {
    tooltip.classList.remove('visible');
  });
});
