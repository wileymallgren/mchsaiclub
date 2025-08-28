(function() {
    const wrappers = Array.from(document.querySelectorAll('.flip-card-wrapper'));
    if (!wrappers.length) return;

    // Entrance animation: IntersectionObserver on the wrappers
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.18
    });
    wrappers.forEach(w => observer.observe(w));

    // Utilities
    function setAriaPressed(wrapper, pressed) {
        wrapper.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    }

    function unflipAll(exceptWrapper) {
        wrappers.forEach(w => {
            const inner = w.querySelector('.flip-card-inner');
            if (!inner) return;
            if (w !== exceptWrapper) {
                inner.classList.remove('flipped');
                w.classList.remove('flipped');
                setAriaPressed(w, false);
            }
        });
    }

    // Detect touch-only devices
    const isTouchOnly = (window.matchMedia && window.matchMedia('(hover: none)').matches) || ('ontouchstart' in window);

    if (isTouchOnly) {
        // Mobile: each card toggles independently on tap (no unflipping of other cards).
        wrappers.forEach(wrapper => {
            let startX = 0,
                startY = 0,
                startT = 0,
                moved = false;

            wrapper.addEventListener('touchstart', (ev) => {
                const t = ev.touches[0];
                startX = t.clientX;
                startY = t.clientY;
                startT = Date.now();
                moved = false;
            }, {
                passive: true
            });

            wrapper.addEventListener('touchmove', (ev) => {
                if (!startX) return;
                const t = ev.touches[0];
                const dx = Math.abs(t.clientX - startX);
                const dy = Math.abs(t.clientY - startY);
                if (dx > 10 || dy > 10) moved = true;
            }, {
                passive: true
            });

            wrapper.addEventListener('touchend', (ev) => {
                const elapsed = Date.now() - startT;
                // treat as a tap only if minimal movement and relatively quick
                if (!moved && elapsed < 500) {
                    const inner = wrapper.querySelector('.flip-card-inner');
                    if (!inner) return;
                    const nowFlipped = inner.classList.toggle('flipped');
                    wrapper.classList.toggle('flipped', nowFlipped);
                    setAriaPressed(wrapper, nowFlipped);

                    // do NOT unflip other cards on mobile — each card is independent.
                    ev.preventDefault(); // prevent simulated mouse events
                }
                startX = startY = 0;
            }, {
                passive: false
            });
        });

        // do NOT close flipped cards when tapping outside on mobile (user requested independent control)
    } else {
        // Pointer devices: keep hover flip, but also allow click/keyboard toggles.
        wrappers.forEach(wrapper => {
            wrapper.addEventListener('click', (ev) => {
                const inner = wrapper.querySelector('.flip-card-inner');
                if (!inner) return;
                const nowFlipped = inner.classList.toggle('flipped');
                wrapper.classList.toggle('flipped', nowFlipped);
                setAriaPressed(wrapper, nowFlipped);

                // Optionally keep pointer behavior to only allow one open at a time:
                // If you prefer independent clicks on desktop remove the next block.
                if (nowFlipped) {
                    // unflip others (keep desktop tidy)
                    wrappers.forEach(w => {
                        if (w === wrapper) return;
                        const i = w.querySelector('.flip-card-inner');
                        if (!i) return;
                        i.classList.remove('flipped');
                        w.classList.remove('flipped');
                        setAriaPressed(w, false);
                    });
                }
            });

            wrapper.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    const inner = wrapper.querySelector('.flip-card-inner');
                    if (!inner) return;
                    const nowFlipped = inner.classList.toggle('flipped');
                    wrapper.classList.toggle('flipped', nowFlipped);
                    setAriaPressed(wrapper, nowFlipped);

                    if (nowFlipped) {
                        wrappers.forEach(w => {
                            if (w === wrapper) return;
                            const i = w.querySelector('.flip-card-inner');
                            if (!i) return;
                            i.classList.remove('flipped');
                            w.classList.remove('flipped');
                            setAriaPressed(w, false);
                        });
                    }
                }
                if (ev.key === 'Escape') {
                    // close all on escape
                    wrappers.forEach(w => {
                        const i = w.querySelector('.flip-card-inner');
                        if (!i) return;
                        i.classList.remove('flipped');
                        w.classList.remove('flipped');
                        setAriaPressed(w, false);
                    });
                }
            });
        });

        // Close on outside click for pointer devices
        document.addEventListener('click', (ev) => {
            const target = ev.target;
            if (wrappers.some(w => w.contains(target))) return;
            wrappers.forEach(w => {
                const inner = w.querySelector('.flip-card-inner');
                if (!inner) return;
                inner.classList.remove('flipped');
                w.classList.remove('flipped');
                setAriaPressed(w, false);
            });
        });
    }

    // ---- Make the back face clickable/tappable to explicitly flip the card back ----
    // This handler works for both pointer and touch devices. It stops propagation so wrapper handlers don't toggle twice.
    const backs = Array.from(document.querySelectorAll('.flip-card-back'));
    backs.forEach(back => {
        // pointer/click handler
        back.addEventListener('click', (e) => {
            e.stopPropagation();
            const wrapper = back.closest('.flip-card-wrapper');
            if (!wrapper) return;
            const inner = wrapper.querySelector('.flip-card-inner');
            if (!inner) return;
            // If it's flipped, unflip it. If not flipped, flip it (toggle behavior).
            const nowFlipped = inner.classList.contains('flipped');
            if (nowFlipped) {
                inner.classList.remove('flipped');
                wrapper.classList.remove('flipped');
                setAriaPressed(wrapper, false);
            } else {
                inner.classList.add('flipped');
                wrapper.classList.add('flipped');
                setAriaPressed(wrapper, true);
                // If on pointer devices we keep the "one open at a time" rule, unflip others:
                if (!isTouchOnly) {
                    wrappers.forEach(w => {
                        if (w === wrapper) return;
                        const i = w.querySelector('.flip-card-inner');
                        if (!i) return;
                        i.classList.remove('flipped');
                        w.classList.remove('flipped');
                        setAriaPressed(w, false);
                    });
                }
            }
        });

        // touch handler (stop propagation so wrapper doesn't also toggle)
        back.addEventListener('touchend', (e) => {
            e.stopPropagation();
            // For touch, respect the same toggle behavior
            const wrapper = back.closest('.flip-card-wrapper');
            if (!wrapper) return;
            const inner = wrapper.querySelector('.flip-card-inner');
            if (!inner) return;
            const nowFlipped = inner.classList.contains('flipped');
            if (nowFlipped) {
                inner.classList.remove('flipped');
                wrapper.classList.remove('flipped');
                setAriaPressed(wrapper, false);
            } else {
                inner.classList.add('flipped');
                wrapper.classList.add('flipped');
                setAriaPressed(wrapper, true);
                // on touch we do NOT unflip others (mobile independent behavior)
            }
            // Prevent simulated mouse events from firing after touch
            e.preventDefault();
        }, {
            passive: false
        });
    });
})();