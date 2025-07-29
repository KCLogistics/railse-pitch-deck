
import { TitleSlideAnimation } from './title-slide-wave-animation.js';

const slideContainer = document.querySelector('.slide-container');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const slideCounter = document.getElementById('slide-counter');

let currentSlide = 0;
// UPDATED: Added new slide to the order
const slideOrder = [
    "slide-title.html",
    "slide-the-problem.html",
    "slide-the-solution.html",
    "slide-forest-ecosystem.html",
    "slide-the-intelligence-engine.html",
    "slide-the-moat.html",
    "slide-our-operating-system.html",
    "slide-competition.html",
    "slide-the-market-opportunity.html",
    "slide-business-model.html",
    "slide-the-team.html",
    "slide-the-vision.html",
    "slide-the-ask.html",
    "slide-the-proof.html",
    "slide-our-dna.html"
];
const totalSlides = slideOrder.length;
let chartRendered = false;
let ecosystemRendered = false;

async function showSlide(index) {
    // ADDED: Stop the forest animation when changing slides
    if (typeof stopForestAnimation === 'function') {
        stopForestAnimation();
    }
    if (typeof stopMoatAnimation === 'function') {
        stopMoatAnimation();
    }
    // (You might have other stop functions here for other animations, leave them as is)

    const slideName = slideOrder[index];
    const response = await fetch(`slides/${slideName}`);
    const slideHTML = await response.text();
    slideContainer.innerHTML = slideHTML;

    const newSlide = slideContainer.querySelector('.slide');
    newSlide.classList.add('active');

    slideCounter.textContent = `${index + 1} / ${totalSlides}`;
    prevButton.disabled = index === 0;
    nextButton.disabled = index === totalSlides - 1;

    if (slideName === "slide-title.html") {
        TitleSlideAnimation.start();
    } else {
        TitleSlideAnimation.stop();
    }

    if (slideName === "slide-the-intelligence-engine.html") {
        setTimeout(() => {
            createEcosystem('ecosystem', ecosystemData);
        }, 50);
    }

    if (slideName === "slide-our-operating-system.html") {
        // Add a small delay to ensure the slide container is rendered before starting the animation
        setTimeout(() => {
            initMoatAnimation();
        }, 50); // 50 milliseconds is usually enough time
    }
    // ADDED: Trigger for the new forest animation
    if (slideName === "slide-forest-ecosystem.html") {
        setTimeout(() => {
            if (typeof initForestAnimation === 'function') {
                initForestAnimation();
            }
        }, 50);
    }
    
    

    if (slideName === "slide-the-proof.html") {
        renderProofCharts();
    }
}

nextButton.addEventListener('click', () => {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        showSlide(currentSlide);
    }
});

prevButton.addEventListener('click', () => {
    if (currentSlide > 0) {
        currentSlide--;
        showSlide(currentSlide);
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') nextButton.click();
    else if (event.key === 'ArrowLeft') prevButton.click();
});

window.addEventListener('resize', () => {
    if (slideOrder[currentSlide] === "slide-the-intelligence-engine.html") {
            createEcosystem('ecosystem', ecosystemData);
    }
});

// Initial setup
showSlide(currentSlide);
