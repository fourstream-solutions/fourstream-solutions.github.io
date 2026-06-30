/* ===========================================================
   Fourstream Solutions — contact form submission
   Sends the form to the Apps Script Web App, which appends a
   row to the private Google Sheet.

   The endpoint URL is set on contact.html via:
       window.FS_CONTACT_ENDPOINT = 'https://script.google.com/.../exec';
   =========================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const endpoint = window.FS_CONTACT_ENDPOINT || '';
    const submitBtn = document.getElementById('contactSubmit');
    const statusBox = document.getElementById('contactStatus');
    const defaultBtnText = submitBtn ? submitBtn.textContent : 'Send message';

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const payload = {
            name: val('name'),
            email: val('email'),
            company: val('company'),
            subject: val('subject'),
            message: val('message'),
            website: val('website') // honeypot
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

        // text/plain avoids a CORS preflight, which Apps Script can't answer.
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        })
            .then(function (res) { return res.json().catch(function () { return { ok: res.ok }; }); })
            .then(function (data) {
                if (data && data.ok) {
                    form.reset();
                    showStatus('success', 'Thanks! Your message has been sent — we’ll be in touch soon.');
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
    });
});
