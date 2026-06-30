/* ===========================================================
   Fourstream Solutions — contact form submission
   Sends the form to the Apps Script Web App, which appends a
   row to the private Google Sheet.

   Config (set on contact.html):
       window.FS_CONTACT_ENDPOINT   — Apps Script /exec URL
       window.FS_CONTACT_TOKEN      — shared token (must match Code.gs)
       window.FS_RECAPTCHA_SITE_KEY — reCAPTCHA v3 site key (optional)
   =========================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const endpoint = window.FS_CONTACT_ENDPOINT || '';
    const siteKey = window.FS_RECAPTCHA_SITE_KEY || '';
    const recaptchaOn = siteKey && siteKey.indexOf('PASTE_') !== 0;

    const submitBtn = document.getElementById('contactSubmit');
    const statusBox = document.getElementById('contactStatus');
    const defaultBtnText = submitBtn ? submitBtn.textContent : 'Send message';

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Load the reCAPTCHA v3 library only when a real site key is configured.
    if (recaptchaOn) {
        const s = document.createElement('script');
        s.src = 'https://www.google.com/recaptcha/api.js?render=' + encodeURIComponent(siteKey);
        s.async = true;
        s.defer = true;
        document.head.appendChild(s);
    }

    function showStatus(type, message) {
        if (!statusBox) return;
        // type: 'success' | 'danger' | 'info'
        statusBox.className = 'alert alert-' + type + ' mb-0';
        statusBox.textContent = message;
    }

    function setLoading(isLoading) {
        if (!submitBtn) return;
        submitBtn.disabled = isLoading;
        submitBtn.textContent = isLoading ? 'Sending…' : defaultBtnText;
    }

    function val(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    // Resolve a reCAPTCHA token (or '' if reCAPTCHA isn't enabled / not ready).
    function getRecaptchaToken() {
        return new Promise(function (resolve) {
            if (!recaptchaOn || typeof grecaptcha === 'undefined') {
                resolve('');
                return;
            }
            grecaptcha.ready(function () {
                grecaptcha.execute(siteKey, { action: 'contact' })
                    .then(function (token) { resolve(token || ''); })
                    .catch(function () { resolve(''); });
            });
        });
    }

    function send(payload) {
        // text/plain avoids a CORS preflight, which Apps Script can't answer.
        return fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        })
            .then(function (res) { return res.json().catch(function () { return { ok: res.ok }; }); })
            .then(function (data) {
                if (data && data.ok) {
                    form.reset();
                    showStatus('success', 'Thanks! Your message has been sent — we’ll be in touch soon.');
                } else if (data && data.error === 'recaptcha') {
                    showStatus('danger', 'We couldn’t verify you weren’t a bot. Please try again, or email us at contact@fourstream.in.');
                } else {
                    throw new Error((data && data.error) || 'Unknown error');
                }
            })
            .catch(function () {
                showStatus('danger', 'Sorry, something went wrong sending your message. Please email us at contact@fourstream.in.');
            })
            .finally(function () {
                setLoading(false);
            });
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const payload = {
            name: val('name'),
            email: val('email'),
            company: val('company'),
            subject: val('subject'),
            message: val('message'),
            website: val('website'), // honeypot
            token: window.FS_CONTACT_TOKEN || '' // shared-token filter
        };

        // --- Basic client-side validation ---
        if (!payload.name || !payload.email || !payload.message) {
            showStatus('danger', 'Please fill in your name, email and message.');
            return;
        }
        if (!EMAIL_RE.test(payload.email)) {
            showStatus('danger', 'Please enter a valid email address.');
            return;
        }
        if (!endpoint || endpoint.indexOf('PASTE_') === 0) {
            showStatus('danger', 'The form isn’t connected yet. Please email us at contact@fourstream.in.');
            return;
        }

        setLoading(true);
        showStatus('info', 'Sending your message…');

        getRecaptchaToken().then(function (recaptchaToken) {
            payload.recaptchaToken = recaptchaToken;
            send(payload);
        });
    });
});
