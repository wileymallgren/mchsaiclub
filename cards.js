(function () {
    const wrappers = Array.from(document.querySelectorAll('.flip-card-wrapper'));
    if (!wrappers.length) return;

    // With a mouse only one card stays open at a time; on touch each card is independent.
    const canHover = window.matchMedia('(hover: hover)').matches;

    function setFlipped(wrapper, flipped) {
        wrapper.classList.toggle('flipped', flipped);
        wrapper.querySelector('.flip-card-inner').classList.toggle('flipped', flipped);
        wrapper.setAttribute('aria-pressed', String(flipped));
    }

    function toggle(wrapper) {
        const flipped = !wrapper.classList.contains('flipped');
        setFlipped(wrapper, flipped);
        if (flipped && canHover) {
            wrappers.forEach((other) => {
                if (other !== wrapper) setFlipped(other, false);
            });
        }
    }

    wrappers.forEach((wrapper) => {
        wrapper.addEventListener('click', () => toggle(wrapper));
        wrapper.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggle(wrapper);
            } else if (event.key === 'Escape') {
                wrappers.forEach((w) => setFlipped(w, false));
            }
        });
    });

    if (canHover) {
        document.addEventListener('click', (event) => {
            if (wrappers.some((w) => w.contains(event.target))) return;
            wrappers.forEach((w) => setFlipped(w, false));
        });
    }
})();
