// --- ECOSYSTEM DATA ---
const ecosystemData = {
    track: [
        { id: 'track1', text: "Dynamic & Personalized Pricing", position: { x: 20, y: 57.5 } },
        { id: 'track2', text: "Instant AI Matching", position: { x: 50, y: 57.5 } },
        { id: 'track3', text: "Autonomous Orchestration", position: { x: 80, y: 57.5 } }
    ],
    wins: [
        { text: "Only the Best Partners", color: "blue", position: { x: 5, y: 90 } },
        { text: "Local Expert. National Reach.", color: "green", position: { x: 17, y: 100 } },
        { text: "Good Work, More Business", color: "green", position: { x: 32, y: 90 } },
        { text: "Your Enterprise Toolkit", color: "green", position: { x: 43, y: 105 } },
        { text: "Reputation is Revenue", color: "green", position: { x: 57, y: 90 } },
        { text: "Focus on Your Business", color: "green", position: { x: 70, y: 105 } },
        { text: "No More random Follow-ups", color: "green", position: { x: 80, y: 90 } },
        { text: "More Time to Grow", color: "green", position: { x: 90, y: 105 } },
        { text: "Reliability, Guaranteed", color: "blue", position: { x: 93, y: 80 } },
        { text: "Stop Searching. Start Shipping.", color: "blue", position: { x: 5, y: 25 } },
        { text: "Grow Beyond Your City", color: "green", position: { x: 20, y: 10 } },
        { text: "A Pre-Vetted Network", color: "blue", position: { x: 35, y: 20 } },
        { text: "Logistics, Managed for You", color: "blue", position: { x: 45, y: 5 } },
        { text: "Always on Support", color: "blue", position: { x: 55, y: 15 } },
        { text: "Pro Pricing for All", color: "blue", position: { x: 65, y: 25 } },
        { text: "Trusted Partners, Instantly", color: "blue", position: { x: 75, y: 10 } },
        { text: "Fair Price, Instantly", color: "blue", position: { x: 85, y: 20 } },
        { text: "No More Bargaining", color: "blue", position: { x: 93, y: 30 } },
    ]
};

// --- ECOSYSTEM RENDER FUNCTION ---
function createEcosystem(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    container.innerHTML = '';

    const { track, wins } = data;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('class', 'ecosystem-connector');
    
    container.appendChild(svg);
    
    const capsuleHeight = 50;
    const pipelineCapsule = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const leftCapsulePadding = 125; 
    const rightCapsulePadding = 108;
    const startX_percent = track[0].position.x;
    const endX_percent = track[track.length - 1].position.x;
    
    const capsuleStartX_px = (startX_percent / 100) * containerRect.width - leftCapsulePadding;
    const capsuleWidth_px = ((endX_percent - startX_percent) / 100) * containerRect.width + leftCapsulePadding + rightCapsulePadding;
    const capsuleY_px = (containerRect.height / 2) - (capsuleHeight / 2) + 20;

    pipelineCapsule.setAttribute('x', capsuleStartX_px);
    pipelineCapsule.setAttribute('y', capsuleY_px);
    pipelineCapsule.setAttribute('width', capsuleWidth_px);
    pipelineCapsule.setAttribute('height', capsuleHeight);
    pipelineCapsule.setAttribute('rx', capsuleHeight / 2);
    pipelineCapsule.setAttribute('ry', capsuleHeight / 2);
    pipelineCapsule.setAttribute('fill', '#EFF6FF');
    svg.appendChild(pipelineCapsule);

    track.forEach(node => {
        const trackTag = document.createElement('span');
        trackTag.id = node.id;
        trackTag.className = `ecosystem-node whitespace-nowrap inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-4 py-2 rounded-full`;
        trackTag.textContent = node.text;
        trackTag.style.left = `${node.position.x}%`;
        trackTag.style.top = `${node.position.y}%`;
        container.appendChild(trackTag);
    });
    
    wins.forEach((win, index) => {
        const colorClass = win.color === 'green' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
        const winTag = document.createElement('span');
        winTag.id = `win-tag-${index}`;
        winTag.className = `ecosystem-node whitespace-nowrap ${colorClass} text-[10px] font-medium px-1 py-0.5 rounded-full`;
        winTag.textContent = win.text;
        winTag.style.left = `${win.position.x}%`;
        winTag.style.top = `${win.position.y}%`;
        container.appendChild(winTag);

        const winPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const pathId = `win-path-${index}`;
        winPath.setAttribute('id', pathId);
        winPath.setAttribute('class', 'animated-line');

        const pipelineStartXPercent = track[0].position.x;
        const pipelineEndXPercent = track[track.length - 1].position.x;
        
        const closestX_percent = Math.max(pipelineStartXPercent, Math.min(win.position.x, pipelineEndXPercent));

        const startX_px = (win.position.x / 100) * containerRect.width;
        const startY_px = (win.position.y / 100) * containerRect.height;
        const endX_px = (closestX_percent / 100) * containerRect.width;
        const endY_px = containerRect.height / 2;
        
        const d = `M ${endX_px} ${endY_px} L ${startX_px} ${startY_px}`;
        winPath.setAttribute('d', d);
        
        winPath.setAttribute('stroke', '#CBD5E1');
        winPath.setAttribute('stroke-width', '1.5');
        winPath.setAttribute('fill', 'none');
        
        svg.insertBefore(winPath, pipelineCapsule);

        const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dot.setAttribute('r', '1.5');
        dot.setAttribute('visibility', 'hidden');
        
        const dotColor = win.color === 'green' ? '#22C55E' : '#3B82F6';
        dot.setAttribute('fill', dotColor);

        const animateMotion = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
        const duration = 2.5;
        const begin = Math.random() * duration;
        animateMotion.setAttribute('dur', `${duration}s`);
        animateMotion.setAttribute('begin', `${begin}s`);
        animateMotion.setAttribute('repeatCount', 'indefinite');
        
        const animateVisibility = document.createElementNS("http://www.w3.org/2000/svg", "animate");
        animateVisibility.setAttribute('attributeName', 'visibility');
        animateVisibility.setAttribute('from', 'hidden');
        animateVisibility.setAttribute('to', 'visible');
        animateVisibility.setAttribute('dur', '0.1s');
        animateVisibility.setAttribute('begin', `${begin}s`);
        animateVisibility.setAttribute('fill', 'freeze');
        
        animateMotion.addEventListener('repeatEvent', () => {
            const tagToLightUp = document.getElementById(`win-tag-${index}`);
            const animationClass = win.color === 'green' ? 'light-up-green-animate' : 'light-up-blue-animate';
            
            tagToLightUp.classList.add(animationClass);
            
            setTimeout(() => {
                tagToLightUp.classList.remove(animationClass);
            }, 600);
        });

        const mpath = document.createElementNS("http://www.w3.org/2000/svg", "mpath");
        mpath.setAttributeNS("http://www.w3.org/1999/xlink", "href", `#${pathId}`);
        
        animateMotion.appendChild(mpath);
        dot.appendChild(animateMotion);
        dot.appendChild(animateVisibility);
        svg.appendChild(dot);
    });
}
