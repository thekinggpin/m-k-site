// KBC Functionality
document.querySelectorAll('.kbc-option').forEach(button => {
    button.addEventListener('click', function() {
        const result = document.getElementById('kbcResult');
        
        // Remove selection from all buttons
        document.querySelectorAll('.kbc-option').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Add selection to clicked button
        this.classList.add('selected');
        
        // Show result
        result.classList.add('show');
        
        // Trigger confetti
        triggerConfetti();
        
        // Scroll to result
        setTimeout(() => {
            result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    });
});

// Confetti Animation
function triggerConfetti() {
    const colors = ['#003366', '#ffd700', '#ffc700', '#1a4d7a', '#ffffff'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = '0s';
            
            document.body.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                confetti.remove();
            }, 3000);
        }, i * 30);
    }
}

// Scroll Animation Intersection Observer
const observerOptions = {
    threshold: 0.3,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.animation = entry.target.style.animation;
        }
    });
}, observerOptions);

// Observe elements for fade-in animations
document.querySelectorAll('.love-card, .dream-item, .color-item').forEach(el => {
    observer.observe(el);
});

// Parallax effect on scroll
window.addEventListener('scroll', function() {
    const scrollPosition = window.pageYOffset;
    
    // Hero section parallax
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${scrollPosition * 0.5}px)`;
    }
    
    // Appreciation section pulse
    const appreciationBox = document.querySelector('.appreciation-box');
    if (appreciationBox) {
        const rotation = scrollPosition * 0.3;
        appreciationBox.style.transform = `rotate(${rotation}deg)`;
    }
});

// Add scroll reveal animation for elements
const revealElements = () => {
    const reveals = document.querySelectorAll('.about-text, .appreciation-box');
    
    reveals.forEach(reveal => {
        const windowHeight = window.innerHeight;
        const elementTop = reveal.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            reveal.style.opacity = '1';
            reveal.style.animation = 'slideUp 0.6s ease-out forwards';
        }
    });
};

window.addEventListener('scroll', revealElements);
window.addEventListener('load', revealElements);

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Animate flowers on page load
const animateFloatingFlowers = () => {
    const flowers = document.querySelectorAll('.flower');
    flowers.forEach((flower, index) => {
        flower.style.animation = `floatDown 3s ease-in forwards ${index * 0.3}s`;
    });
};

window.addEventListener('load', () => {
    // Re-trigger flower animation on page load
    setTimeout(animateFloatingFlowers, 500);
    // Keep animation going
    setInterval(animateFloatingFlowers, 10000);
});

// Enhanced scroll tracking for coming closer effect
let lastScrollPosition = 0;
window.addEventListener('scroll', function() {
    const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    
    // Change opacity of elements based on scroll progress
    const loveCards = document.querySelectorAll('.love-card');
    loveCards.forEach((card, index) => {
        const cardPosition = card.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (cardPosition < windowHeight * 0.75) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }
    });
});

// Add some interactions
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to all interactive elements
    const interactiveElements = document.querySelectorAll('.love-card, .color-item, .dream-item, .kbc-option');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
});

// Responsive design adjustments
const handleResize = () => {
    if (window.innerWidth < 768) {
        // Adjust animations for mobile
        document.querySelectorAll('.hero h1').forEach(el => {
            el.style.fontSize = '2.5rem';
        });
    }
};

window.addEventListener('resize', handleResize);
handleResize();

// Page load animation
window.addEventListener('load', function() {
    document.body.style.opacity = '1';
    document.body.style.animation = 'fadeIn 0.5s ease-out';
});

// Prevent multiple confetti overlaps
let confettiActive = false;
const originalTrigger = triggerConfetti;
const throttledConfetti = () => {
    if (!confettiActive) {
        confettiActive = true;
        originalTrigger();
        setTimeout(() => {
            confettiActive = false;
        }, 3000);
    }
};

// Re-assign the throttled version to KBC buttons
document.querySelectorAll('.kbc-option').forEach(button => {
    const clickHandler = button.onclick;
    button.onclick = null;
    button.addEventListener('click', function() {
        const result = document.getElementById('kbcResult');
        
        // Remove selection from all buttons
        document.querySelectorAll('.kbc-option').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        // Add selection to clicked button
        this.classList.add('selected');
        
        // Show result
        result.classList.add('show');
        
        // Trigger confetti with throttle
        throttledConfetti();
        
        // Scroll to result
        setTimeout(() => {
            result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    }, { once: false });
});

// Add subtle mouse follow effect to certain elements
document.addEventListener('mousemove', function(e) {
    const appreciationBox = document.querySelector('.appreciation-box');
    if (appreciationBox && appreciationBox.getBoundingClientRect().top < window.innerHeight) {
        const rect = appreciationBox.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const distance = 20;
        
        appreciationBox.style.setProperty('--mouse-x', `${Math.cos(angle) * distance}px`);
        appreciationBox.style.setProperty('--mouse-y', `${Math.sin(angle) * distance}px`);
    }
});
