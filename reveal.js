(function () {
    if (!('IntersectionObserver' in window)) return;

    // style.css only hides items once this class exists, so content stays visible if JS fails.
    document.documentElement.classList.add('reveal-ready');

    function reveal(selector, threshold, show) {
        const items = Array.from(document.querySelectorAll(selector));
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                observer.unobserve(entry.target);
                show(entry.target, items.indexOf(entry.target));
            });
        }, { threshold });
        items.forEach((item) => observer.observe(item));
    }

    reveal('.team-card', 0.2, (card, index) => {
        card.style.transitionDelay = `${index * 0.2}s`;
        card.addEventListener('transitionend', () => {
            card.style.transitionDelay = '';
            card.classList.add('settled');
        }, { once: true });
        card.classList.add('visible');
    });

    reveal('.flip-card-wrapper', 0.18, (card) => card.classList.add('visible'));

    reveal('.timeline-item', 0.2, (item) => {
        setTimeout(() => item.classList.add('visible'), parseInt(item.dataset.delay, 10) || 0);
    });
})();
