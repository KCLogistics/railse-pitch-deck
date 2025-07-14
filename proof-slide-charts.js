        // 1. Data Preparation (July 2024 to June 2025)
        const labels = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const revenueData = [13450, 41864, 69819, 466733, 224163, 206735, 158599, 162127, 312758, 273509, 317935, 359021];
        const profitData = [1345, 19610, 10377, 84888, 86283, 74735, 50222, 56712, 94242, 103974, 119929, 146997];
        const orderData = [3, 5, 20, 69, 27, 26, 27, 29, 45, 70, 65, 94];

        // 2. Custom Plugin for Direct Labels
        const directLabelsPlugin = {
            id: 'directLabels',
            afterDraw: (chart) => {
                const { ctx, data } = chart;
                ctx.save();
                
                chart.getSortedVisibleDatasetMetas().forEach(meta => {
                    const dataset = data.datasets[meta.index];
                    const lastPoint = meta.data[meta.data.length - 1];
                    const xPos = lastPoint.x;
                    const yPos = lastPoint.y;

                    const text = dataset.label;
                    const color = dataset.borderColor;
                    
                    ctx.font = 'bold 11px Inter';
                    ctx.fillStyle = color;
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    
                    const padding = 6;
                    const textMetrics = ctx.measureText(text);
                    const boxWidth = textMetrics.width + 2 * padding;
                    const boxHeight = 11 + 2 * padding;

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fillRect(xPos + 5, yPos - boxHeight / 2, boxWidth, boxHeight);
                    
                    ctx.fillStyle = color;
                    ctx.fillText(text, xPos + 5 + padding, yPos);
                });
                ctx.restore();
            }
        };

        // 3. Financials Chart (Top)
        const financialsCtx = document.getElementById('financialsChart').getContext('2d');
        new Chart(financialsCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Revenue', data: revenueData, borderColor: 'rgba(59, 130, 246, 1)', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 },
                    { label: 'Gross Profit', data: profitData, borderColor: 'rgba(34, 197, 94, 1)', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.4 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                layout: {
                    padding: {
                        right: 80 
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        title: { display: true, text: 'Amount (₹)' },
                        ticks: { callback: function(value) { if (value === 0) return '₹0'; return '₹' + (value / 100000).toFixed(1) + 'L'; } }
                    }
                },
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }
            },
            plugins: [directLabelsPlugin]
        });

        // 4. Orders Chart (Bottom)
        const ordersCtx = document.getElementById('ordersChart').getContext('2d');
        new Chart(ordersCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Orders', data: orderData, borderColor: 'rgba(99, 102, 241, 1)', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, tension: 0.4 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                layout: {
                    padding: {
                        right: 80
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        title: { display: true, text: 'Orders Count' },
                        beginAtZero: true
                    }
                },
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }
            },
            plugins: [directLabelsPlugin]
        });
