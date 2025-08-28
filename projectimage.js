(function() {
    const card = document.querySelector('#projects .photo-card');
    if (!card) return;

    const wrap = card.querySelector('.card-wrap');
    const img = card.querySelector('.photo');
    const rim = card.querySelector('.rim');
    const glass = card.querySelector('.glass');
    const grain = card.querySelector('.grain');

    const maxTilt = 8;
    const maxOffset = 12;
    let raf = null;

    function apply(x, y) {
        const rect = card.getBoundingClientRect();
        const nx = ((x - rect.left) / rect.width - 0.5) * 2;
        const ny = ((y - rect.top) / rect.height - 0.5) * 2;
        const rotateY = nx * maxTilt;
        const rotateX = -ny * maxTilt;
        wrap.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
        const tx = -nx * maxOffset * 0.5;
        const ty = -ny * maxOffset * 0.5;
        img.style.transform = `translate3d(${tx}px, ${ty}px, 6px) scale(1.02)`;
        rim.style.transform = `translate3d(${tx * 0.6}px, ${ty * 0.6}px, 2px)`;
        glass.style.transform = `translate3d(${tx * 0.3}px, ${ty * 0.3}px, 24px)`;
        grain.style.transform = `translate3d(${tx * 0.2}px, ${ty * 0.2}px, 10px)`;
    }

    function onMove(e) {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const isTouch = e.type.startsWith('touch');
        const cx = isTouch ? (e.touches && e.touches[0] && e.touches[0].clientX) || 0 : e.clientX;
        const cy = isTouch ? (e.touches && e.touches[0] && e.touches[0].clientY) || 0 : e.clientY;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => apply(cx, cy));
    }

    function reset() {
        cancelAnimationFrame(raf);
        wrap.style.transform = '';
        [img, rim, glass, grain].forEach(el => el && (el.style.transform = ''));
    }

    card.addEventListener('mousemove', onMove, {
        passive: true
    });
    card.addEventListener('mouseleave', reset);
    card.addEventListener('touchstart', (e) => onMove(e), {
        passive: true
    });
    card.addEventListener('touchmove', onMove, {
        passive: true
    });
    card.addEventListener('touchend', reset, {
        passive: true
    });

    // sync entrance when image loads
    const image = card.querySelector('.photo');

    function syncEntrance() {
        const w = card.querySelector('.card-wrap');
        w.style.animation = 'none';
        void w.offsetWidth;
        w.style.animation = '';
        w.style.animationDelay = '0ms';
    }
    if (image.complete) syncEntrance();
    else image.addEventListener('load', syncEntrance, {
        once: true
    });
    image.addEventListener('error', syncEntrance, {
        once: true
    });
})();