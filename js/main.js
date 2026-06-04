const REGISTRY_URL = 'https://www.myregistry.com/baby-registry/erika-de-vega-and-koi-gevana-bacoor-cavite/5448978/giftlist';
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwnml7G6X4RbHeowVwhOFNQan1hW1GXOBsPEqnVpzuR7Duxn5wYoX5yILOIGqmLUBxA/exec';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const ref = new URLSearchParams(window.location.search).get('ref');

  showOverlay('checking');

  if (!ref) {
    await sleep(600);
    showOverlay('invalid');
    return;
  }

  let result;
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'lookup', reference: ref })
    });
    result = await res.json();
  } catch (err) {
    showOverlay('invalid');
    return;
  }

  if (!result.valid) {
    showOverlay('invalid');
    return;
  }

  window.INVITE_REF = ref;
  window.INVITE_PREFILL = result;

  prefillForm(result);
  setupPage({ prefersReduced, hasGsap });
  showOverlay('valid');
}

function setupPage({ prefersReduced, hasGsap }) {
  if (hasGsap && !prefersReduced) {
    gsap.registerPlugin(ScrollTrigger);
    runEntranceAnimations();
  } else {
    document.querySelectorAll('.invitation-card, .rsvp-form-container').forEach((el) => {
      el.style.opacity = '1';
    });
  }

  setupEnvelope();
  setupSmoothScroll(prefersReduced);
  setupHeroCard();
  setupRsvpNextHint();
  setupForm();
  setupRegistry();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showOverlay(state) {
  const overlay = document.querySelector('#gate-overlay');
  const card = overlay?.querySelector('.gate-card');
  if (!overlay || !card) return;

  overlay.classList.remove('state-checking', 'state-invalid', 'state-valid');
  overlay.classList.add(`state-${state}`);

  if (state === 'invalid' && typeof gsap !== 'undefined') {
    gsap.fromTo(card, { x: 0 }, { x: -8, duration: 0.08, yoyo: true, repeat: 5, ease: 'sine.inOut', clearProps: 'x' });
  }

  if (state !== 'valid') return;

  const hideOverlay = () => {
    overlay.style.display = 'none';
    overlay.removeEventListener('transitionend', onTransitionEnd);
    revealMainContent();
  };
  const onTransitionEnd = (event) => {
    if (event.target !== overlay) return;
    hideOverlay();
  };

  overlay.addEventListener('transitionend', onTransitionEnd);
}

function revealMainContent() {
  const main = document.querySelector('main');
  if (!main) return;

  if (typeof gsap !== 'undefined') {
    gsap.to(main, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
  } else {
    main.style.opacity = '1';
    main.style.transform = 'translateY(0)';
  }
}

function prefillForm(result) {
  const nameInput = document.querySelector('input[name="name"]');
  const guestInput = document.querySelector('input[name="guests"]');
  const messageInput = document.querySelector('textarea[name="message"]');
  const rsvpNextHint = document.querySelector('.rsvp-next-hint');
  const tapLabel = document.querySelector('.tap-label');
  const letterFor = document.querySelector('.letter-for');
  const editBanner = document.querySelector('.edit-banner');
  const response = normalizeResponse(result.response || (result.responded ? 'attending' : 'waiting'));

  if (nameInput) nameInput.value = response === 'waiting' ? '' : (result.name || '');
  if (guestInput) guestInput.value = result.guests || 1;
  if (messageInput) messageInput.value = response !== 'waiting' ? (result.message || '') : '';

  if (letterFor) {
    letterFor.textContent = result.name || '07 / 25 / 2026';
    letterFor.title = result.name || '07 / 25 / 2026';
  }

  setResponse(response);

  if (response === 'waiting') return;

  if (editBanner) editBanner.hidden = false;
  setSubmitButtonLabel(true);
  if (tapLabel) {
    const status = response === 'attending' ? 'attending' : 'not attending';
    tapLabel.innerHTML = `You have responded <strong>${status}</strong>.<br><span>Tap to open and edit.</span>`;
  }
  if (rsvpNextHint) rsvpNextHint.hidden = false;
}

function normalizeResponse(value) {
  const response = String(value || '').trim().toLowerCase();
  if (response === 'attending' || response === 'accepted' || response === 'yes' || response === 'true') return 'attending';
  if (response === 'declined' || response === 'no') return 'declined';
  return 'waiting';
}

function runEntranceAnimations() {
  gsap.fromTo(
    '.invitation-card',
    { opacity: 0, y: 40, scale: 0.94 },
    { opacity: 1, y: 0, scale: 1, duration: 1.2, delay: 0.4, ease: 'power3.out' }
  );

  gsap.from('.rsvp-heading, .envelope-wrapper', {
    scrollTrigger: {
      trigger: '.rsvp-section',
      start: 'top 70%'
    },
    opacity: 0,
    y: 50,
    stagger: 0.2,
    duration: 0.7,
    ease: 'back.out(1.4)'
  });

  gsap.from('.gift-heading, .gift-nook .gift-box, .gift-nook .mini-balloon, .gift-nook .decor, .registry-btn', {
    scrollTrigger: {
      trigger: '.gift-section',
      start: 'top 70%'
    },
    opacity: 0,
    scale: 0.8,
    y: 30,
    stagger: 0.12,
    duration: 0.55,
    ease: 'back.out(1.7)'
  });
}

function setupSmoothScroll(prefersReduced) {
  if (prefersReduced || window.matchMedia('(pointer: coarse)').matches) return;
  if (typeof Lenis === 'undefined') return;

  const lenis = new Lenis({
    duration: 1.08,
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.86,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  });

  window.siteLenis = lenis;

  if (typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
  }

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}

function setupHeroCard() {
  const card = document.querySelector('.invitation-card');
  const target = document.querySelector('.rsvp-section');
  if (!card || !target) return;

  const scrollToRsvp = () => {
    if (window.siteLenis) {
      window.siteLenis.scrollTo(target, { offset: -(window.innerHeight - target.offsetHeight) / 2 });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  card.addEventListener('click', scrollToRsvp);
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    scrollToRsvp();
  });
}

function scrollToSection(target) {
  if (!target) return;

  if (window.siteLenis) {
    window.siteLenis.scrollTo(target, { offset: -(window.innerHeight - target.offsetHeight) / 2 });
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function setupRsvpNextHint() {
  const hint = document.querySelector('.rsvp-next-hint');
  const target = document.querySelector('.gift-section');
  if (!hint || !target) return;

  hint.addEventListener('click', () => scrollToSection(target));
}

function setupEnvelope() {
  const button = document.querySelector('.envelope-button');
  const scene = document.querySelector('.envelope-scene');
  const wrapper = document.querySelector('.envelope-wrapper');
  const hint = document.querySelector('.tap-label');
  const formContainer = document.querySelector('.rsvp-form-container');
  const backButton = document.querySelector('.close-btn');
  if (!button || !scene || !formContainer) return;
  let isAnimating = false;

  const openEnvelope = () => {
    if (isAnimating || scene.classList.contains('letter-out')) return;
    isAnimating = true;
    scene.classList.add('seal-lifted');
    button.setAttribute('aria-expanded', 'true');
    button.disabled = true;

    window.setTimeout(() => scene.classList.add('flap-open'), 260);
    window.setTimeout(() => scene.classList.add('letter-out'), 650);

    window.setTimeout(() => {
      if (typeof gsap !== 'undefined') {
        gsap.to(wrapper, {
          scale: 0.7,
          opacity: 0,
          y: -22,
          duration: 0.5,
          ease: 'power2.inOut',
          onComplete: () => {
            wrapper.style.visibility = 'hidden';
            button.disabled = false;
            isAnimating = false;
          }
        });
        gsap.to(hint, { opacity: 0, duration: 0.25 });
        gsap.to(formContainer, {
          autoAlpha: 1,
          scale: 1,
          duration: 0.5,
          ease: 'power2.out'
        });
      } else {
        wrapper.style.display = 'none';
        formContainer.style.opacity = '1';
        formContainer.style.visibility = 'visible';
        formContainer.style.transform = 'scale(1)';
        button.disabled = false;
        isAnimating = false;
      }
    }, 1250);
  };

  const closeEnvelope = () => {
    if (isAnimating) return;
    isAnimating = true;
    formContainer.classList.remove('has-confirmation');
    const finishClose = () => {
      window.setTimeout(() => scene.classList.remove('letter-out'), 140);
      window.setTimeout(() => scene.classList.remove('flap-open'), 780);
      window.setTimeout(() => {
        scene.classList.remove('seal-lifted');
        button.setAttribute('aria-expanded', 'false');
        button.disabled = false;
        isAnimating = false;
      }, 1180);
    };

    if (typeof gsap !== 'undefined') {
      gsap.to(formContainer, {
        autoAlpha: 0,
        scale: 0.9,
        duration: 0.28,
        ease: 'power2.in',
        onComplete: () => {
          wrapper.style.visibility = 'visible';
          scene.classList.add('seal-lifted', 'flap-open', 'letter-out');
          gsap.set(wrapper, { scale: 0.9, opacity: 0, y: 12 });
          gsap.to(wrapper, {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.45,
            ease: 'back.out(1.4)',
            onComplete: finishClose
          });
          gsap.to(hint, { opacity: 1, delay: 1.05, duration: 0.25 });
        }
      });
    } else {
      formContainer.style.opacity = '0';
      formContainer.style.visibility = 'hidden';
      wrapper.style.display = '';
      wrapper.style.visibility = 'visible';
      scene.classList.add('seal-lifted', 'flap-open', 'letter-out');
      finishClose();
    }
  };

  window.closeRsvpEnvelope = closeEnvelope;
  button.addEventListener('click', openEnvelope);
  backButton?.addEventListener('click', closeEnvelope);
}

function setupForm() {
  const form = document.querySelector('#rsvp-form');
  if (!form) return;
  const nameInput = form.querySelector('input[name="name"]');

  setupResponseChoices();

  nameInput?.addEventListener('input', () => {
    if (nameInput.value.trim()) nameInput.setCustomValidity('');
    updateSubmitState();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = Object.fromEntries(new FormData(form).entries());
    const trimmedName = String(formData.name || '').trim();

    if (!trimmedName) {
      nameInput?.setCustomValidity('Please enter your name.');
      nameInput?.reportValidity();
      return;
    }

    nameInput?.setCustomValidity('');
    formData.name = trimmedName;
    submitRSVP(formData);
  });
}

function setupResponseChoices() {
  document.querySelectorAll('.choice-pill').forEach((button) => {
    button.addEventListener('click', () => setResponse(button.dataset.response));
  });

  const currentResponse = document.querySelector('input[name="response"]')?.value;
  setResponse(currentResponse || 'waiting');
}

function setResponse(responseValue) {
  const response = normalizeResponse(responseValue);
  const responseInput = document.querySelector('input[name="response"]');
  const submitButton = document.querySelector('.submit-btn');
  const guestField = document.querySelector('.guest-field');
  const guestInput = document.querySelector('input[name="guests"]');

  document.querySelectorAll('.choice-pill').forEach((button) => {
    const isSelected = button.dataset.response === response && response !== 'waiting';
    button.classList.toggle('is-selected', isSelected);
    button.classList.toggle('prompt-pulse', button.dataset.response === 'attending' && response === 'waiting');
    button.setAttribute('aria-checked', String(isSelected));
  });

  if (responseInput) responseInput.value = response === 'waiting' ? '' : response;
  if (submitButton) updateSubmitState();

  if (!guestField || !guestInput) return;
  const showGuests = response !== 'declined';
  toggleGuestField(guestField, guestInput, showGuests);
}

function updateSubmitState() {
  const submitButton = document.querySelector('.submit-btn');
  const responseInput = document.querySelector('input[name="response"]');
  const nameInput = document.querySelector('input[name="name"]');
  if (!submitButton || !responseInput || !nameInput) return;

  submitButton.disabled = !responseInput.value || !nameInput.value.trim();
}

function toggleGuestField(guestField, guestInput, shouldShow) {
  const isHidden = guestField.classList.contains('is-hidden');
  if (shouldShow && !guestInput.value) guestInput.value = '1';
  guestInput.disabled = !shouldShow;

  if (shouldShow && !isHidden) return;
  if (!shouldShow && isHidden) return;

  if (typeof gsap !== 'undefined') {
    gsap.killTweensOf(guestField);
    if (shouldShow) {
      guestField.classList.remove('is-hidden');
      gsap.fromTo(
        guestField,
        { height: 0, opacity: 0, y: -6 },
        { height: 'auto', opacity: 1, y: 0, duration: 0.34, ease: 'power2.out', clearProps: 'height,transform' }
      );
    } else {
      gsap.to(guestField, {
        height: 0,
        opacity: 0,
        y: -6,
        duration: 0.26,
        ease: 'power2.inOut',
        onComplete: () => guestField.classList.add('is-hidden')
      });
    }
    return;
  }

  if (shouldShow) {
    guestField.classList.remove('is-hidden');
    guestField.style.height = '0px';
    requestAnimationFrame(() => {
      guestField.style.height = `${guestField.scrollHeight}px`;
      guestField.style.opacity = '1';
      guestField.addEventListener('transitionend', function clearHeight(event) {
        if (event.propertyName !== 'height') return;
        guestField.style.height = '';
        guestField.removeEventListener('transitionend', clearHeight);
      });
    });
  } else {
    guestField.style.height = `${guestField.scrollHeight}px`;
    requestAnimationFrame(() => {
      guestField.classList.add('is-hidden');
      guestField.style.height = '0px';
    });
  }
}

async function submitRSVP(formData) {
  const btn = document.querySelector('.submit-btn');
  if (!formData.response) return;
  btn.textContent = 'Sending... 💌';
  btn.disabled = true;
  btn.classList.add('is-sending');

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'rsvp',
        reference: window.INVITE_REF,
        name: String(formData.name || '').trim(),
        guests: formData.guests,
        message: formData.message,
        response: formData.response
      })
    });
    showConfirmation(formData.response);
  } catch (err) {
    btn.textContent = 'Try again 💔';
    btn.disabled = false;
    btn.classList.remove('is-sending');
  }
}

function showConfirmation(response) {
  const form = document.querySelector('#rsvp-form');
  const confirm = document.querySelector('.confirm-message');
  const container = document.querySelector('.rsvp-form-container');
  if (!form || !confirm || !container) return;

  const isAccepted = normalizeResponse(response) === 'attending';
  container.classList.add('has-confirmation');
  confirm.hidden = false;
  confirm.innerHTML = `
    <svg class="icon" viewBox="0 0 64 58" aria-hidden="true">
      <defs>
        <linearGradient id="confirmationHeartGradient" x1="10" y1="6" x2="55" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#F4A7BB"></stop>
          <stop offset="0.58" stop-color="#E8789A"></stop>
          <stop offset="1" stop-color="#D4537E"></stop>
        </linearGradient>
      </defs>
      <path class="heart-fill" d="M32 55C22 45 6 36 6 20C6 10.5 12.5 4 21.5 4C27 4 30.5 7.2 32 11.2C33.5 7.2 37 4 42.5 4C51.5 4 58 10.5 58 20C58 36 42 45 32 55Z"></path>
      <path class="heart-shine" d="M13.5 16C15.5 11 21 10 24 13"></path>
    </svg>
    <h3>${isAccepted ? 'See you there!' : "We'll miss you!"}</h3>
    <p>Your response has been saved.</p>
    <button class="confirm-back-btn" type="button">Back to envelope</button>
  `;
  confirm.querySelector('.confirm-back-btn')?.addEventListener('click', () => {
    updateRespondedPrompt(response);
    restoreRsvpForm();
    window.closeRsvpEnvelope?.();
  });
  createConfetti(confirm);

  if (typeof gsap !== 'undefined') {
    gsap.to(form, {
      opacity: 0,
      scale: 0.94,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => {
        form.hidden = true;
        gsap.fromTo(confirm, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)' });
        animateConfetti(confirm);
      }
    });
  } else {
    form.hidden = true;
  }
}

function updateRespondedPrompt(responseValue) {
  const response = normalizeResponse(responseValue);
  const tapLabel = document.querySelector('.tap-label');
  const editBanner = document.querySelector('.edit-banner');
  const rsvpNextHint = document.querySelector('.rsvp-next-hint');
  if (response === 'waiting') return;

  if (editBanner) editBanner.hidden = false;
  setSubmitButtonLabel(true);
  if (tapLabel) {
    const status = response === 'attending' ? 'attending' : 'not attending';
    tapLabel.innerHTML = `You have responded <strong>${status}</strong>.<br><span>Tap to open and edit.</span>`;
  }
  if (rsvpNextHint) rsvpNextHint.hidden = false;
}

function restoreRsvpForm() {
  const form = document.querySelector('#rsvp-form');
  const confirm = document.querySelector('.confirm-message');
  const submitButton = document.querySelector('.submit-btn');

  if (confirm) {
    confirm.hidden = true;
    confirm.innerHTML = '';
  }

  if (form) {
    form.hidden = false;
    form.style.opacity = '1';
    form.style.transform = 'scale(1)';
  }

  if (submitButton) {
    setSubmitButtonLabel(Boolean(document.querySelector('.edit-banner:not([hidden])')));
    submitButton.classList.remove('is-sending');
  }
  updateSubmitState();
}

function setSubmitButtonLabel(isEditing) {
  const submitButton = document.querySelector('.submit-btn');
  if (submitButton) submitButton.textContent = isEditing ? 'Update RSVP' : 'Send RSVP';
}

function createConfetti(container) {
  const colors = ['#F9C4D2', '#E8789A', '#E8D5F5', '#FFF0C8', '#D4AF6A'];
  for (let i = 0; i < 28; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti';
    piece.style.background = colors[i % colors.length];
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    container.appendChild(piece);
  }
}

function animateConfetti(container) {
  if (typeof gsap === 'undefined') return;
  container.querySelectorAll('.confetti').forEach((piece) => {
    gsap.to(piece, {
      x: gsap.utils.random(-160, 160),
      y: gsap.utils.random(-170, 110),
      rotation: gsap.utils.random(-220, 220),
      opacity: 0,
      duration: 1.2,
      ease: 'power3.out'
    });
  });
}

function setupRegistry() {
  const btn = document.querySelector('.registry-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.open(REGISTRY_URL, '_blank', 'noopener,noreferrer');
  });
}
