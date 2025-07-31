// --- Global variables to control the animation ---
let animationFrameId = null;
let labelInfos = []; // Array to store label positions and velocities

// --- Data and Styling ---
const competitorsData = [
    { name: 'Railse', descriptor: 'AI Operating System', tags: ['Asset-Light', 'Open Market'], x: 8, y: 9, isHero: true },
    { name: 'Rivigo', descriptor: 'Tech-Led Carrier', tags: ['Asset-Heavy', 'Closed Market'], x: 6, y: 9, pivot: 'top-right' },
    { name: 'Vahak', descriptor: 'Discovery Platform', tags: ['Asset-Light', 'Open Market'], x: 7, y: -8, labelOffset: { x: 10, y: 10 }, pivot: 'bottom-right' },
    { name: 'Delhivery', descriptor: 'E-commerce Logistics', tags: ['Asset-Heavy', 'Closed Market'], x: -7, y: 8 },
    { name: 'LetsTransport', descriptor: 'Enterprise Logistics', tags: ['Asset-Light', 'Open Market'], x: -8, y: 6, pivot: 'top-right' },
    { name: 'BlackBuck', descriptor: 'Trucking Marketplace', tags: ['Asset-Light', 'Open Market'], x: -2, y: 3, pivot: 'top-right' },
    { name: 'Porter', descriptor: 'City Logistics', tags: ['Asset-Light', 'Open Market'], x: -8, y: -7, pivot: 'bottom-left' },
    { name: 'Shiprocket', descriptor: 'Shipping Aggregator', tags: ['Asset-Light', 'Open Market'], x: -9, y: -6, pivot: 'bottom-right' },
    { name: 'Blue Dart', descriptor: 'Premium Courier', tags: ['Asset-Heavy', 'Closed Market'], x: -9, y: -9, labelOffset: { y: 0 }, pivot: 'bottom-right' },
    { name: 'Gati', descriptor: 'Legacy Distribution', tags: ['Asset-Heavy', 'Closed Market'], x: -7, y: -10, labelOffset: { y: 60 }, pivot: 'middle-left' },
    { name: 'VRL Logistics', descriptor: 'Legacy Distribution', tags: ['Asset-Heavy', 'Closed Market'], x: -7, y: -10, labelOffset: { y: 120 }, pivot: 'middle-right' }
];

const tagColors = {
    'Asset-Light': '#22c55e', // Green
    'Asset-Heavy': '#3b82f6', // Blue
    'Open Market': '#6b7280', // Gray
    'Closed Market': '#f97316', // Orange
};

function mapCoordinates(x, y) {
    const left = ((x + 10) / 20) * 90 + 5;
    const top = ((-y + 10) / 20) * 90 + 5;
    return { left: `${left}%`, top: `${top}%` };
}

// Sets up the initial DOM elements for dots and labels
function setupCompetitors() {
    const competitorsContainer = document.getElementById('competitors-container');
    if (!competitorsContainer) return;
    
    competitorsContainer.innerHTML = '';
    labelInfos = [];

    competitorsData.forEach((comp, index) => {
        const { left, top } = mapCoordinates(comp.x, comp.y);

        // Create the dot element
        const dot = document.createElement('div');
        dot.id = `dot-${index}`;
        dot.className = `absolute rounded-full transition-transform duration-300 z-20 ${comp.isHero ? 'w-5 h-5 bg-blue-500 hero-dot-pulse' : 'w-3 h-3 bg-gray-700'}`;
        dot.style.left = left;
        dot.style.top = top;
        dot.style.transform = 'translate(-50%, -50%)';

        // Create the label card element
        const labelCard = document.createElement('div');
        labelCard.id = `label-${index}`;
        labelCard.className = `absolute p-2 rounded-md shadow-md bg-white/90 backdrop-blur-sm border border-gray-200 z-10 ${comp.isHero ? 'border-2 border-blue-500' : ''}`;
        
        const dotsHTML = comp.tags.map(tag => 
            `<div class="w-1.5 h-1.5 rounded-full border border-white" style="background-color: ${tagColors[tag] || '#000'}"></div>`
        ).join('');

        labelCard.innerHTML = comp.isHero
            ? `<div class="flex items-center gap-1.5"><h3 class="font-extrabold text-blue-700 text-base">${comp.name}</h3>${dotsHTML}</div><p class="text-[10px] text-blue-600 font-semibold mt-0.5">${comp.descriptor}</p>`
            : `<div class="flex items-center gap-1.5"><h3 class="font-bold text-gray-900 text-sm">${comp.name}</h3>${dotsHTML}</div><p class="text-[10px] text-gray-600 mt-0.5">${comp.descriptor}</p>`;
        
        competitorsContainer.appendChild(dot);
        competitorsContainer.appendChild(labelCard);

        // Store info for the physics animation loop
        labelInfos.push({
            element: labelCard,
            dotElement: dot,
            x: comp.labelOffset?.x ?? (comp.x > 0 ? 20 : -20),
            y: comp.labelOffset?.y ?? (comp.y > 0 ? -20 : 20),
            vx: 0,
            vy: 0,
            isHero: comp.isHero
        });
    });
}

// The main animation loop that runs on every frame
function animateChart() {
    const repulsionStrength = 0.5;
    const springStrength = 0.01;
    const damping = 0.9;

    // 1. Calculate physics forces (this part is correct)
    labelInfos.forEach(info => {
        let forceX = 0, forceY = 0;
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
        forceX += -info.x * springStrength;
        forceY += -info.y * springStrength;
        info.vx = (info.vx + forceX) * damping;
        info.vy = (info.vy + forceY) * damping;
        info.x += info.vx;
        info.y += info.vy;
    });

    // 2. Apply new positions to the DOM
    labelInfos.forEach((info, index) => {
        const compData = competitorsData[index]; // Get corresponding data

        // Set the base position of the label to match its dot
        info.element.style.left = info.dotElement.style.left;
        info.element.style.top = info.dotElement.style.top;
        
        let transformStyle = `translate(${info.x}px, ${info.y}px)`;

        // Check for the custom pivot property
        if (compData.pivot === 'top-right') {
            transformStyle = `translateX(-100%) ` + transformStyle;
        } else if (compData.pivot === 'bottom-right') {
            transformStyle = `translateX(-100%) translateY(-100%) ` + transformStyle;
        } else if (compData.pivot === 'bottom-left') {
            transformStyle = `translateY(-100%) ` + transformStyle;
        } else if (compData.pivot === 'middle-right') {
            transformStyle = `translateX(-100%) translateY(-50%) ` + transformStyle;
        } else if (compData.pivot === 'middle-left') {
            transformStyle = `translateY(-50%) ` + transformStyle;
        }

        info.element.style.transform = transformStyle;
    });

    animationFrameId = requestAnimationFrame(animateChart);
}

// --- Public Control Functions ---
export const ChartAnimation = {
    start: () => {
        if (animationFrameId) return;
        
        const competitorsContainer = document.getElementById('competitors-container');
        if (!competitorsContainer) {
            console.error('Chart container not found!');
            return;
        }

        // Delay setup and animation to ensure the browser has calculated layout
        setTimeout(() => {
            setupCompetitors();
            animateChart();
        }, 50); 

        window.addEventListener('resize', setupCompetitors);
    },
    stop: () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        window.removeEventListener('resize', setupCompetitors);

        // Clear the containers when the slide is hidden
        const competitorsContainer = document.getElementById('competitors-container');
        if (competitorsContainer) competitorsContainer.innerHTML = '';
        
        labelInfos = []; // Clear the animation state
    }
};

window.ChartAnimation = ChartAnimation;