// Global variables to control the animation
let animationFrameId = null;
let labelInfos = []; // Array to store label positions and velocities

// --- Your data remains the same ---
const competitorsData = [
    { name: 'Railse', descriptor: 'AI Operating System', tags: ['Asset-Light', 'Open Market'], x: 8, y: 9, isHero: true },
    { name: 'Rivigo', descriptor: 'Tech-Led Carrier', tags: ['Asset-Heavy', 'Closed Market'], x: 6, y: 9 },
    // ... rest of your data
];
const tagStyles = { /* ... same as before ... */ };

// Function to set up the initial state of the chart
function setupCompetitors() {
    const competitorsContainer = document.getElementById('competitors-container');
    competitorsContainer.innerHTML = '';
    labelInfos = []; // Clear previous animation data

    competitorsData.forEach((comp, index) => {
        const { left, top } = mapCoordinates(comp.x, comp.y);
        
        // Create dot
        const dot = document.createElement('div');
        dot.id = `dot-${index}`;
        dot.className = `absolute rounded-full transition-transform duration-300 ${comp.isHero ? 'w-5 h-5 bg-blue-500 hero-dot-pulse z-20' : 'w-3 h-3 bg-gray-700'}`;
        dot.style.left = left;
        dot.style.top = top;
        dot.style.transform = 'translate(-50%, -50%)';

        // Create label
        const labelCard = document.createElement('div');
        const tagsHTML = comp.tags.map(tag => `<span class="text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagStyles[tag] || ''}">${tag}</span>`).join(' ');
        labelCard.id = `label-${index}`;
        labelCard.className = `absolute p-3 rounded-lg shadow-md bg-white/90 backdrop-blur-sm border border-gray-200 ${comp.isHero ? 'border-2 border-blue-500' : ''}`;
        labelCard.innerHTML = comp.isHero
            ? `<h3 class="font-extrabold text-blue-700 text-lg">${comp.name}</h3><p class="text-xs text-blue-600 font-semibold mt-1">${comp.descriptor}</p><div class="mt-2 flex gap-1">${tagsHTML}</div>`
            : `<h3 class="font-bold text-gray-900">${comp.name}</h3><p class="text-xs text-gray-600 mt-1">${comp.descriptor}</p><div class="mt-2 flex gap-1">${tagsHTML}</div>`;
        
        // Store info for the animation loop
        labelInfos.push({
            element: labelCard,
            dotElement: dot,
            x: 0, // Initial offset from the dot
            y: 0,
            vx: 0, // Velocity x
            vy: 0, // Velocity y
            isHero: comp.isHero
        });

        competitorsContainer.appendChild(dot);
        competitorsContainer.appendChild(labelCard);
    });
}

function mapCoordinates(x, y) {
    const left = ((x + 10) / 20) * 90 + 5;
    const top = ((-y + 10) / 20) * 90 + 5;
    return { left, top };
}

// The main animation loop
function animateChart() {
    // --- Physics parameters ---
    const repulsionStrength = 0.5; // How strongly labels push each other away
    const springStrength = 0.01;  // How strongly labels are pulled to their dot
    const damping = 0.9;         // Slows down the movement to prevent endless oscillation

    // 1. Calculate forces
    labelInfos.forEach(info => {
        // Reset forces for this frame
        let forceX = 0;
        let forceY = 0;

        // Repulsion force from other labels
        labelInfos.forEach(otherInfo => {
            if (info === otherInfo) return;

            const rectA = info.element.getBoundingClientRect();
            const rectB = otherInfo.element.getBoundingClientRect();

            const overlapX = Math.max(0, Math.min(rectA.right, rectB.right) - Math.max(rectA.left, rectB.left));
            const overlapY = Math.max(0, Math.min(rectA.bottom, rectB.bottom) - Math.max(rectA.top, rectB.top));

            if (overlapX > 0 && overlapY > 0) {
                const dx = rectB.left - rectA.left;
                const dy = rectB.top - rectA.top;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                forceX -= (dx / distance) * repulsionStrength;
                forceY -= (dy / distance) * repulsionStrength;
            }
        });
        
        // Spring force pulling label back to its ideal position (slightly offset from dot)
        forceX += -info.x * springStrength;
        forceY += -info.y * springStrength;

        // 2. Update velocity
        info.vx = (info.vx + forceX) * damping;
        info.vy = (info.vy + forceY) * damping;

        // 3. Update position
        info.x += info.vx;
        info.y += info.vy;
    });

    // 4. Apply new positions and draw lines
    labelInfos.forEach(info => {
        info.element.style.transform = `translate(${info.x}px, ${info.y}px)`;
    });
    drawLeaderLines();

    animationFrameId = requestAnimationFrame(animateChart);
}

function drawLeaderLines() {
    const svgContainer = document.getElementById('leader-lines-svg');
    const chartArea = document.getElementById('chart-area');
    if (!svgContainer || !chartArea) return;

    svgContainer.innerHTML = ''; // Clear previous lines
    const chartRect = chartArea.getBoundingClientRect();

    labelInfos.forEach(info => {
        const dotRect = info.dotElement.getBoundingClientRect();
        const labelRect = info.element.getBoundingClientRect();

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', dotRect.left + dotRect.width / 2 - chartRect.left);
        line.setAttribute('y1', dotRect.top + dotRect.height / 2 - chartRect.top);
        line.setAttribute('x2', labelRect.left + labelRect.width / 2 - chartRect.left);
        line.setAttribute('y2', labelRect.top + labelRect.height / 2 - chartRect.top);
        line.setAttribute('stroke', info.isHero ? '#3b82f6' : '#9ca3af');
        line.setAttribute('stroke-width', info.isHero ? '2' : '1');
        svgContainer.appendChild(line);
    });
}

// --- Public Control Functions ---
export const ChartAnimation = {
    start: () => {
        if (animationFrameId) return; // Prevent multiple loops
        setupCompetitors();
        animateChart();
        window.addEventListener('resize', setupCompetitors);
    },
    stop: () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        window.removeEventListener('resize', setupCompetitors);
        // Clear the containers
        const competitorsContainer = document.getElementById('competitors-container');
        const svgContainer = document.getElementById('leader-lines-svg');
        if (competitorsContainer) competitorsContainer.innerHTML = '';
        if (svgContainer) svgContainer.innerHTML = '';
    }
};

window.ChartAnimation = ChartAnimation;