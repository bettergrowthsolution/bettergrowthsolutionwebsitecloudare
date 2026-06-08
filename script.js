    // Mobile menu
    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');

    menuToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => mobileNav.classList.remove('open'));
    });

    // ── Populate tracking fields ──
    document.getElementById('user_agent').value = navigator.userAgent;
    document.getElementById('page_url').value   = window.location.href;

    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        document.getElementById('ip_address').value = d.ip      || '';
        document.getElementById('city').value        = d.city    || '';
        document.getElementById('region').value      = d.region  || '';
        document.getElementById('country').value     = d.country_name || '';
      })
      .catch(() => {});

    // Adviser routes
    const adviserRoutes = {
      "credit-score":    { label: "Credit score checking", adviser: "CreditScoreIQ",     url: "advisers/creditscoreiq.html" },
      "credit-repair":   { label: "Credit repair support", adviser: "YourScoreAndMore",  url: "advisers/yourscoreandmore.html" },
      "debt-settlement": { label: "Debt settlement help",  adviser: "DebtPath Relief",   url: "advisers/debtpath-relief.html" },
      "home-services":   { label: "Home service support",  adviser: "HomeCare Connect",  url: "advisers/homecare-connect.html" }
    };

    const form          = document.getElementById('credit-check');
    const statusEl      = document.getElementById('formStatus');
    const serviceSelect = document.getElementById('serviceNeed');

    // Success overlay elements
    const successOverlay = document.getElementById('successOverlay');
    const successMsg     = document.getElementById('successMsg');
    const successMeta    = document.getElementById('successMeta');
    const successClose   = document.getElementById('successClose');

    function showSuccess(firstName, route, range, zip) {
      successMsg.textContent = `Thank you, ${firstName}! Your request was submitted successfully. We'll connect you with ${route.adviser} shortly.`;
      successMeta.innerHTML = `
        <span><strong>Adviser:</strong> ${route.adviser}</span>
        <span><strong>Focus:</strong> ${route.label}</span>
        <span><strong>Credit range:</strong> ${range}</span>
        <span><strong>ZIP code:</strong> ${zip}</span>
      `;
      successOverlay.classList.add('show');
      successClose.focus();
    }

    successClose.addEventListener('click', () => {
      successOverlay.classList.remove('show');
      form.reset();
      statusEl.textContent = '';
    });

    successOverlay.addEventListener('click', e => {
      if (e.target === successOverlay) successOverlay.classList.remove('show');
    });

    function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
    function cleanPhone(v)   { return v.replace(/\D/g, ''); }

    function showError(msg, field) {
      statusEl.textContent = msg;
      statusEl.className = 'form-status';
      if (field) { field.classList.add('error'); field.focus(); }
    }

    form.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', () => {
        el.classList.remove('error');
        statusEl.textContent = '';
      });
    });

    document.querySelectorAll('.select-adviser').forEach(btn => {
      btn.addEventListener('click', () => {
        const service = btn.dataset.service;
        if (service && adviserRoutes[service]) {
          serviceSelect.value = service;
          statusEl.textContent = `${adviserRoutes[service].adviser} selected. Fill the form to continue.`;
          statusEl.className = 'form-status success';
          form.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => document.getElementById('fullName').focus(), 420);
        }
      });
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      statusEl.textContent = '';

      const fd       = new FormData(form);
      const fullName = fd.get('fullName').trim();
      const email    = fd.get('email').trim();
      const phone    = cleanPhone(fd.get('phone'));
      const zip      = fd.get('zip').trim();
      const need     = fd.get('serviceNeed') || 'credit-score';
      const range    = fd.get('scoreRange')  || 'Not selected';
      const route    = adviserRoutes[need] || adviserRoutes['credit-score'];

      if (fullName.length < 2)    return showError('Please enter your full name.', form.elements.fullName);
      if (!isValidEmail(email))   return showError('Please enter a valid email address.', form.elements.email);
      if (phone.length < 10)      return showError('Please enter a valid phone number.', form.elements.phone);
      if (!/^\d{5}$/.test(zip))   return showError('Please enter a 5-digit ZIP code.', form.elements.zip);
      if (!form.elements.consent.checked) return showError('Please accept the consent to continue.', form.elements.consent);

      // Show loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const origText  = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Submitting… <span class="btn-arrow">⏳</span>';
      statusEl.textContent = '';

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: fd
        });
        const result = await response.json();

        if (result.success) {
          showSuccess(fullName.split(' ')[0], route, range, zip);
        } else {
          statusEl.textContent = result.message || 'Something went wrong. Please try again.';
          statusEl.className = 'form-status';
        }
      } catch (err) {
        statusEl.textContent = 'Network error. Please check your connection and try again.';
        statusEl.className = 'form-status';
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    });

    // Scroll reveal
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.service-card, .adviser-card, .support-item, .metric-item').forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = `opacity 0.5s ease ${i * 0.07}s, transform 0.5s ease ${i * 0.07}s`;
      observer.observe(el);
    });
