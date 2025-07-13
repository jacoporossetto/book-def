document.addEventListener('DOMContentLoaded', () => {

    /**
     * Gestione del menu di navigazione mobile.
     * Attiva/disattiva un overlay a schermo intero e blocca lo scroll del corpo.
     */
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    const body = document.body;

    if (mobileNavToggle && mobileNavOverlay) {
        mobileNavToggle.addEventListener('click', () => {
            mobileNavToggle.classList.toggle('active');
            mobileNavOverlay.classList.toggle('active');
            body.classList.toggle('no-scroll');
        });

        // Chiude il menu quando si clicca su un link al suo interno.
        mobileNavOverlay.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNavToggle.classList.remove('active');
                mobileNavOverlay.classList.remove('active');
                body.classList.remove('no-scroll');
            });
        });
    }

    /**
     * Gestione dell'accordion per la sezione FAQ.
     * Permette di aprire una risposta alla volta, chiudendo le altre.
     */
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (question && answer) {
            question.addEventListener('click', () => {
                const isExpanded = question.getAttribute('aria-expanded') === 'true';

                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                        otherItem.querySelector('.faq-answer').style.maxHeight = null;
                    }
                });

                if (!isExpanded) {
                    question.setAttribute('aria-expanded', 'true');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                } else {
                    question.setAttribute('aria-expanded', 'false');
                    answer.style.maxHeight = null;
                }
            });
        }
    });

    /**
     * Animazioni di fade-in allo scorrimento (Intersection Observer API).
     * Aggiunge una classe 'visible' agli elementi con classe 'fade-in'
     * quando entrano nell'area di visualizzazione.
     */
    const fadeInElements = document.querySelectorAll('.fade-in');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeInElements.forEach(el => {
        observer.observe(el);
    });

});
