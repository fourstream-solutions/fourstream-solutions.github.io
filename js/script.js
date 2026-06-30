/* ===========================================================
   Fourstream Solutions — shared navbar + footer + page chrome
   Each page has empty <div id="navbar"></div> and
   <div id="footer"></div>; we inject the markup here so the
   header/footer live in one place.
   =========================================================== */

document.addEventListener('DOMContentLoaded', function () {
    const COMPANY = 'Fourstream Solutions';
    const EMAIL = 'contact@fourstream.in';
    const year = new Date().getFullYear();

    // Figure out the current page so we can mark the active nav link.
    let page = window.location.pathname.split('/').pop() || 'index.html';
    if (page === '') page = 'index.html';

    const links = [
        { href: 'index.html', label: 'Home' },
        { href: 'about.html', label: 'About' },
        { href: 'services.html', label: 'Services' },
        { href: 'contact.html', label: 'Contact' }
    ];

    const navItems = links.map(function (l) {
        const active = l.href === page ? ' active' : '';
        const current = l.href === page ? ' aria-current="page"' : '';
        return `
                <li class="nav-item">
                    <a class="nav-link${active}"${current} href="${l.href}">${l.label}</a>
                </li>`;
    }).join('');

    /* ---------- Navbar ---------- */
    const navbarHTML = `
    <nav class="navbar navbar-expand-lg fixed-top">
        <div class="container">
            <a class="navbar-brand" href="index.html">
                <img src="assets/imgs/logo.png" alt="${COMPANY}" style="max-height: 40px; width: auto;" />
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse justify-content-end" id="navbarNav">
                <ul class="navbar-nav align-items-lg-center">${navItems}
                    <li class="nav-item ms-lg-3 mt-2 mt-lg-0">
                        <a class="btn btn-fs" href="contact.html">Get in touch</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>`;

    const navMount = document.getElementById('navbar');
    if (navMount) navMount.innerHTML = navbarHTML;

    /* ---------- Footer ---------- */
    const footerHTML = `
    <footer class="site-footer">
        <div class="container">
            <div class="row gy-4">
                <div class="col-lg-4 col-md-6 footer-brand">
                    <img src="assets/imgs/logo.png" alt="${COMPANY}" style="max-height: 44px; width: auto;" />
                    <p class="mb-0" style="max-width: 320px;">Software, AI, automation and data solutions that help businesses work smarter — from custom tools and dashboards to AI integrations and automated Google Sheets &amp; Apps Script pipelines.</p>
                </div>
                <div class="col-lg-2 col-md-3 col-6">
                    <h5>Company</h5>
                    <ul class="footer-list">
                        <li><a href="index.html">Home</a></li>
                        <li><a href="about.html">About</a></li>
                        <li><a href="services.html">Services</a></li>
                        <li><a href="contact.html">Contact</a></li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-3 col-6">
                    <h5>Services</h5>
                    <ul class="footer-list">
                        <li><a href="services.html">AI Integration &amp; Automation</a></li>
                        <li><a href="services.html">Software Development</a></li>
                        <li><a href="services.html">Websites &amp; Web Apps</a></li>
                        <li><a href="services.html">Dashboards &amp; Analytics</a></li>
                        <li><a href="services.html">Automation Pipelines</a></li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-6">
                    <h5>Get in touch</h5>
                    <ul class="footer-list">
                        <li><a href="mailto:${EMAIL}">${EMAIL}</a></li>
                        <li><a href="contact.html">Contact form</a></li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom d-flex flex-column flex-md-row justify-content-between gap-2">
                <span>&copy; ${year} ${COMPANY}. All rights reserved.</span>
                <span>Built with care · Hosted on GitHub Pages</span>
            </div>
        </div>
    </footer>`;

    const footMount = document.getElementById('footer');
    if (footMount) footMount.innerHTML = footerHTML;

    /* ---------- Page title ---------- */
    // Each page sets a short title via <body data-title="...">.
    const pageTitle = document.body.getAttribute('data-title');
    document.title = pageTitle ? `${COMPANY} — ${pageTitle}` : COMPANY;
});
