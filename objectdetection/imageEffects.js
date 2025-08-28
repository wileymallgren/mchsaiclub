(function() {
    // ---------- tilt + entrance code (unchanged) ----------
    const cards = Array.from(document.querySelectorAll('.photo-card'));
    if (!cards.length) return;

    const maxTilt = 8; // degrees
    const maxOffset = 12; // px

    function apply(card, x, y) {
        const rect = card.getBoundingClientRect();
        const nx = ((x - rect.left) / rect.width - 0.5) * 2;
        const ny = ((y - rect.top) / rect.height - 0.5) * 2;

        const rotateY = nx * maxTilt;
        const rotateX = -ny * maxTilt;

        const wrap = card.querySelector('.card-wrap');
        const img = card.querySelector('.photo');
        const rim = card.querySelector('.rim');
        const glass = card.querySelector('.glass');
        const grain = card.querySelector('.grain');

        wrap.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;

        const tx = -nx * maxOffset * 0.5;
        const ty = -ny * maxOffset * 0.5;
        img.style.transform = `translate3d(${tx}px, ${ty}px, 6px) scale(1.02)`;
        rim.style.transform = `translate3d(${tx * 0.6}px, ${ty * 0.6}px, 2px)`;
        glass.style.transform = `translate3d(${tx * 0.3}px, ${ty * 0.3}px, 24px)`;
        grain.style.transform = `translate3d(${tx * 0.2}px, ${ty * 0.2}px, 10px)`;
    }

    function reset(card) {
        const wrap = card.querySelector('.card-wrap');
        if (wrap) wrap.style.transform = '';
        ['photo', 'rim', 'glass', 'grain'].forEach(c => {
            const el = card.querySelector('.' + c);
            if (el) el.style.transform = '';
        });
    }

    cards.forEach(card => {
        let rect = null,
            raf = null;

        function onMove(e) {
            if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const isTouch = e.type.startsWith('touch');
            const cx = isTouch ? (e.touches && e.touches[0] && e.touches[0].clientX) || 0 : e.clientX;
            const cy = isTouch ? (e.touches && e.touches[0] && e.touches[0].clientY) || 0 : e.clientY;
            rect = rect || card.getBoundingClientRect();
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => apply(card, cx, cy));
        }

        function onLeave() {
            cancelAnimationFrame(raf);
            reset(card);
            rect = null;
        }

        card.addEventListener('mousemove', onMove, {
            passive: true
        });
        card.addEventListener('mouseleave', onLeave);
        card.addEventListener('touchstart', (e) => {
            rect = card.getBoundingClientRect();
            onMove(e);
        }, {
            passive: true
        });
        card.addEventListener('touchmove', onMove, {
            passive: true
        });
        card.addEventListener('touchend', onLeave, {
            passive: true
        });

        card.addEventListener('focusin', () => {
            card.querySelector('.card-wrap').style.transform = 'translateY(-6px) scale(1.008)';
        });
        card.addEventListener('focusout', () => reset(card));
    });

    const imgs = Array.from(document.querySelectorAll('.photo'));
    let done = 0;
    imgs.forEach(img => {
        if (img.complete) done++;
        else {
            img.addEventListener('load', () => {
                done++;
                if (done === imgs.length) sync();
            }, {
                once: true
            });
            img.addEventListener('error', () => {
                done++;
                if (done === imgs.length) sync();
            }, {
                once: true
            });
        }
    });
    if (done === imgs.length) sync();

    function sync() {
        const wraps = document.querySelectorAll('.card-wrap');
        wraps.forEach(w => {
            w.style.animation = 'none';
        });
        void document.body.offsetWidth;
        wraps.forEach(w => {
            w.style.animation = '';
            w.style.animationDelay = '0ms';
        });
    }

    // ---------- LIGHTBOX INTERACTIONS (hide thumbnail + caption/effects + #back) ----------
    const lightbox = document.getElementById('photo-lightbox');
    const lbImg = lightbox.querySelector('.lb-img');
    const lbTitle = lightbox.querySelector('.lb-title');
    const lbSub = lightbox.querySelector('.lb-sub');
    const lbClose = lightbox.querySelector('.lb-close');
    const lbPrev = lightbox.querySelector('.lb-prev');
    const lbNext = lightbox.querySelector('.lb-next');
    const focusableElements = [lbClose, lbPrev, lbNext];

    // Build an array of data from the cards so we can prev/next
    const gallery = cards.map(card => {
        const img = card.querySelector('.photo');
        const title = card.querySelector('.glass .label')?.textContent || '';
        const sub = card.querySelector('.glass .sub')?.textContent || '';
        return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            title,
            sub,
            cardEl: card
        };
    });

    let currentIndex = -1;
    let lastOriginState = null; // will store array of { el, prevStyles }
    let prevBackDisplay = null; // to remember original display of #back

    function saveAndHide(el, opts = {}) {
        if (!el) return null;
        const prev = {
            el,
            inline: {
                visibility: el.style.visibility ?? '',
                opacity: el.style.opacity ?? '',
                pointerEvents: el.style.pointerEvents ?? '',
                transition: el.style.transition ?? '',
                display: el.style.display ?? '',
                zIndex: el.style.zIndex ?? ''
            }
        };
        // apply hide behaviour: keep layout stable for img => use visibility:hidden
        if (opts.visibilityHidden) {
            el.style.visibility = 'hidden';
            el.style.zIndex = '1'; // Keep it below the lightbox
        } else {
            // fade out
            el.style.transition = (el.style.transition ? el.style.transition + ', ' : '') + 'opacity 180ms ease';
            el.style.opacity = '0';
            el.style.zIndex = '1'; // Keep it below the lightbox
        }
        // turn off pointer events
        el.style.pointerEvents = 'none';
        return prev;
    }

    function restore(prev) {
        if (!prev || !prev.el) return;
        const el = prev.el;
        const s = prev.inline;
        el.style.visibility = s.visibility;
        el.style.opacity = s.opacity;
        el.style.pointerEvents = s.pointerEvents;
        el.style.transition = s.transition;
        el.style.display = s.display;
        el.style.zIndex = s.zIndex;
    }

    function openAt(index) {
        if (index < 0 || index >= gallery.length) return;

        // if something was hidden previously, restore it first (keeps state sane when quickly switching)
        if (Array.isArray(lastOriginState) && lastOriginState.length) {
            lastOriginState.forEach(restore);
            lastOriginState = null;
        }

        currentIndex = index;
        const item = gallery[index];
        lbImg.src = item.src;
        lbImg.alt = item.alt || item.title || '';
        lbTitle.textContent = item.title;
        lbSub.textContent = item.sub;
        lightbox.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('lb-open');
        document.body.classList.add('lb-open');

        // hide thumbnail image and other decorative parts but avoid layout shift:
        const originImg = item.cardEl.querySelector('.photo');
        const originGlass = item.cardEl.querySelector('.glass');
        const originRim = item.cardEl.querySelector('.rim');
        const originGrain = item.cardEl.querySelector('.grain');

        lastOriginState = [];
        // hide the actual image using visibility so the grid doesn't reflow
        if (originImg) lastOriginState.push(saveAndHide(originImg, {
            visibilityHidden: true
        }));
        // fade out caption and effects (keep layout)
        if (originGlass) lastOriginState.push(saveAndHide(originGlass, {
            visibilityHidden: false
        }));
        if (originRim) lastOriginState.push(saveAndHide(originRim, {
            visibilityHidden: false
        }));
        if (originGrain) lastOriginState.push(saveAndHide(originGrain, {
            visibilityHidden: false
        }));

        // hide div#back if present, preserving its prior display value
        try {
            const backEl = document.getElementById('back');
            if (backEl) {
                if (prevBackDisplay === null) prevBackDisplay = backEl.style.display || '';
                backEl.style.display = 'none';
            }
        } catch (e) {
            /* ignore */ }

        // focus close button
        lbClose.focus({
            preventScroll: true
        });

        // Set source card to lower z-index to prevent overlapping
        gallery.forEach(g => g.cardEl.querySelector('.card-wrap').style.zIndex = 1);
        gallery[index].cardEl.querySelector('.card-wrap').style.zIndex = 1;
    }

    function closeLightbox() {
        lightbox.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('lb-open');
        document.body.classList.remove('lb-open');

        // restore hidden thumbnail elements (if any)
        try {
            if (Array.isArray(lastOriginState)) {
                lastOriginState.forEach(restore);
                lastOriginState = null;
            }
        } catch (e) {
            /* ignore */ }

        // restore #back display if we modified it
        try {
            const backEl = document.getElementById('back');
            if (backEl) {
                if (prevBackDisplay === null) backEl.style.display = '';
                else backEl.style.display = prevBackDisplay;
                prevBackDisplay = null;
            }
        } catch (e) {
            /* ignore */ }

        // restore z-indexes
        gallery.forEach(g => g.cardEl.querySelector('.card-wrap').style.zIndex = '');

        // return focus to origin thumbnail if possible
        if (currentIndex >= 0 && gallery[currentIndex] && gallery[currentIndex].cardEl) {
            gallery[currentIndex].cardEl.focus({
                preventScroll: true
            });
        }
        currentIndex = -1;
    }

    function showPrev() {
        if (currentIndex <= 0) return;
        openAt(currentIndex - 1);
    }

    function showNext() {
        if (currentIndex === -1) return;
        openAt((currentIndex + 1) % gallery.length);
    }

    // open when clicking a card or pressing Enter/Space when focused
    cards.forEach((card, i) => {
        card.addEventListener('click', (e) => {
            openAt(i);
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openAt(i);
            }
        });
    });

    // close / nav buttons
    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', showPrev);
    lbNext.addEventListener('click', showNext);

    // close when clicking backdrop (but not when clicking the stage)
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    // keyboard handling: Esc close, Left/Right nav
    window.addEventListener('keydown', (e) => {
        if (lightbox.getAttribute('aria-hidden') === 'false') {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeLightbox();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                showPrev();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                showNext();
            }
        }
    });

    // trap focus minimally: keep focus within the visible controls
    lightbox.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        const visibleControls = focusableElements.filter(el => el.offsetParent !== null);
        if (visibleControls.length === 0) return;

        const first = visibleControls[0];
        const last = visibleControls[visibleControls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });

    // touch: swipe left/right to navigate (simple)
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipe = 50;
    lightbox.addEventListener('touchstart', e => {
        if (e.touches && e.touches[0]) touchStartX = e.touches[0].clientX;
    }, {
        passive: true
    });
    lightbox.addEventListener('touchmove', e => {
        if (e.touches && e.touches[0]) touchEndX = e.touches[0].clientX;
    }, {
        passive: true
    });
    lightbox.addEventListener('touchend', () => {
        const dx = touchEndX - touchStartX;
        if (Math.abs(dx) > minSwipe) {
            if (dx > 0) showPrev();
            else showNext();
        }
        touchStartX = touchEndX = 0;
    });

    // preload neighboring images for smoother nav
    function preload(src) {
        const i = new Image();
        i.src = src;
    }
    lightbox.addEventListener('transitionend', () => {
        if (currentIndex >= 0) {
            const prev = gallery[(currentIndex - 1 + gallery.length) % gallery.length];
            const next = gallery[(currentIndex + 1) % gallery.length];
            if (prev) preload(prev.src);
            if (next) preload(next.src);
        }
    });

    // ensure images with long load still show; set a small onerror placeholder
    lbImg.addEventListener('error', () => {
        lbImg.src = '';
        lbImg.alt = 'Image failed to load';
    });

})();