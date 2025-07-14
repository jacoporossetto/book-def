document.addEventListener('DOMContentLoaded', () => {

    /**
     * Gestione del menu di navigazione mobile.
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
     */
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (question && answer) {
            question.addEventListener('click', () => {
                const isExpanded = question.getAttribute('aria-expanded') === 'true';

                // Chiudi tutti gli altri item
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                        otherItem.querySelector('.faq-answer').style.maxHeight = null;
                    }
                });

                // Apri/Chiudi l'item cliccato
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
     * Animazioni di fade-in allo scorrimento.
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

    fadeInElements.forEach(el => observer.observe(el));

    /**
     * Gestione dell'invio del form per i partner con Formspree.
     */
    const partnerForm = document.getElementById('partner-form');
    if (partnerForm) {
        const formButton = partnerForm.querySelector('button[type="submit"]');
        const formFeedback = partnerForm.querySelector('.form-feedback');

        partnerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(partnerForm);
            
            // Mostra il loader e nascondi il testo del pulsante
            formButton.classList.add('loading');
            formButton.disabled = true;
            formFeedback.textContent = '';

            try {
                const response = await fetch(partnerForm.action, {
                    method: partnerForm.method,
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    partnerForm.reset();
                    formFeedback.textContent = "Grazie! La tua candidatura è stata inviata con successo. Ti contatteremo presto.";
                    formFeedback.classList.add('success');
                    formFeedback.classList.remove('error');
                } else {
                    throw new Error('Network response was not ok.');
                }

            } catch (error) {
                formFeedback.textContent = "Oops! C'è stato un problema nell'invio del modulo. Riprova più tardi.";
                formFeedback.classList.add('error');
                formFeedback.classList.remove('success');
            } finally {
                // Nascondi il loader e ripristina il pulsante
                formButton.classList.remove('loading');
                formButton.disabled = false;
            }
        });
    }
});