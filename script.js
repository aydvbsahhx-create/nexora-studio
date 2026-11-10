document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1. PRELOADER
  if (!document.querySelector("#nexora-loader")) {
    const loader = document.createElement("div");
    loader.id = "nexora-loader";
    loader.innerHTML = `
      <div class="loader-logo">NEXORA<span>.</span></div>
      <div class="loader-line"></div>
      <div class="loader-caption">DIGITAL DEVELOPMENT STUDIO</div>
    `;
    document.body.appendChild(loader);
  }

  const hideLoader = () => {
    const loader = document.querySelector("#nexora-loader");
    if (!loader || loader.classList.contains("loader-hidden")) return;
    loader.classList.add("loader-hidden");
    setTimeout(() => loader.remove(), 800);
  };

  window.addEventListener("load", () => setTimeout(hideLoader, 500));
  setTimeout(hideLoader, 2500);

  // 2. MOBILE MENU
  const menuToggle = document.querySelector("#menuToggle");
  const nav = document.querySelector("#nav");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const active = nav.classList.toggle("active");
      menuToggle.classList.toggle("active", active);
      menuToggle.setAttribute("aria-expanded", String(active));
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("active");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        nav.classList.remove("active");
        menuToggle.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // 3. PREMIUM 3D HERO TILT
  const heroVisual = document.querySelector(".hero-visual");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (heroVisual && finePointer && !reduceMotion) {
    heroVisual.style.transformStyle = "preserve-3d";
    heroVisual.style.willChange = "transform";

    heroVisual.addEventListener("mousemove", event => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;

      heroVisual.style.setProperty("--nexora-rotate-y", `${(x - 0.5) * 18}deg`);
      heroVisual.style.setProperty("--nexora-rotate-x", `${(0.5 - y) * 18}deg`);
      heroVisual.style.setProperty("--mouse-x", `${x * 100}%`);
      heroVisual.style.setProperty("--mouse-y", `${y * 100}%`);
    });

    heroVisual.addEventListener("mouseleave", () => {
      heroVisual.style.setProperty("--nexora-rotate-x", "0deg");
      heroVisual.style.setProperty("--nexora-rotate-y", "0deg");
    });
  }

  // 4. BUILD THE 3D CORE AND PARTICLES
  const visualCenter = document.querySelector(".visual-center");
  const core = document.querySelector(".hero-visual .core");

  if (visualCenter && core && !visualCenter.querySelector(".nexora-particles")) {
    // Preserve the existing N mark while adding sphere layers.
    core.innerHTML = `
      <span class="core-letter">N</span>
      <span class="core-sheen"></span>
      <span class="core-orbit"></span>
      <span class="core-orbit core-orbit-two"></span>
    `;
    core.setAttribute("aria-label", "NEXORA 3D core");

    const particles = document.createElement("div");
    particles.className = "nexora-particles";
    particles.setAttribute("aria-hidden", "true");

    for (let i = 0; i < 24; i++) {
      const particle = document.createElement("span");
      particle.className = "nexora-particle";
      const angle = (Math.PI * 2 * i) / 24;
      const radius = 24 + (i % 5) * 6;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius * 0.72;

      particle.style.setProperty("--px", `${x}%`);
      particle.style.setProperty("--py", `${y}%`);
      particle.style.setProperty("--delay", `${-(i % 8) * 0.45}s`);
      particle.style.setProperty("--duration", `${4 + (i % 5)}s`);
      particle.style.setProperty("--size", `${2 + (i % 3)}px`);
      particles.appendChild(particle);
    }

    visualCenter.prepend(particles);
  }

  // 5. SCROLL PROGRESS
  let progress = document.querySelector(".scroll-progress");

  if (!progress) {
    progress = document.createElement("div");
    progress.className = "scroll-progress";
    document.body.appendChild(progress);
  }

  Object.assign(progress.style, {
    position: "fixed",
    top: "0",
    left: "0",
    height: "3px",
    width: "0%",
    zIndex: "99999",
    background: "linear-gradient(90deg, #8b5cf6, #38bdf8)",
    boxShadow: "0 0 12px rgba(139,92,246,.6)",
    pointerEvents: "none"
  });

  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progress.style.width = `${percentage}%`;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // 6. SCROLL REVEAL
  const revealElements = document.querySelectorAll(
    ".service-card, .project-card, .price-card, .stats div"
  );

  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealElements.forEach((element, index) => {
      element.classList.add("reveal");
      element.style.transitionDelay = `${(index % 4) * 90}ms`;
      observer.observe(element);
    });
  } else {
    revealElements.forEach(element => element.classList.add("visible"));
  }

  // 7. ANIMATED STATISTICS
  const counters = document.querySelectorAll("[data-count]");

  const animateCounter = element => {
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;

    if (reduceMotion) {
      element.textContent = String(target);
      return;
    }

    const duration = 1400;
    const startTime = performance.now();

    const update = currentTime => {
      const value = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - value, 4);
      element.textContent = Math.round(target * eased).toLocaleString("ru-RU");
      if (value < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => counterObserver.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }

  // 8. PROJECT CARD 3D HOVER
  if (!reduceMotion && finePointer) {
    document.querySelectorAll(".project-card").forEach(card => {
      card.addEventListener("mousemove", event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rotateY = (x - 0.5) * 5;
        const rotateX = (0.5 - y) * 5;

        card.style.transform =
          `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  // 9. SMOOTH ANCHOR SCROLL
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });
    });
  });

  // 10. FOOTER YEAR
  document.querySelectorAll("[data-year]").forEach(element => {
    element.textContent = new Date().getFullYear();
  });

  // 11. PREMIUM CURSOR GLOW
  if (finePointer && !reduceMotion) {
    const glow = document.createElement("div");
    glow.className = "cursor-glow";

    Object.assign(glow.style, {
      position: "fixed",
      width: "260px",
      height: "260px",
      borderRadius: "50%",
      pointerEvents: "none",
      zIndex: "0",
      opacity: "0.13",
      background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)",
      transform: "translate(-50%, -50%)",
      left: "-500px",
      top: "-500px",
      filter: "blur(20px)"
    });

    document.body.appendChild(glow);

    window.addEventListener("mousemove", event => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
    }, { passive: true });
  }
});

// =====================================
// NEXORA STUDIO — CONTACT FORM
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");

  if (!form) return;

  const submitButton = document.getElementById("submitOrder");
  const formMessage = document.getElementById("formMessage");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("clientName").value.trim();
    const service = document.getElementById("clientService").value;
    const budget = document.getElementById("clientBudget").value;
    const description = document.getElementById("clientDescription").value.trim();
    const website = document.getElementById("website").value.trim();
    if (!name || !service || !budget || !description) {
      formMessage.textContent = "Заполните все поля.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Отправляем...";
    formMessage.textContent = "";

    try {
      const response = await fetch("http://127.0.0.1:5000/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
  name,
  service,
  budget,
  description,
  website
})
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Не удалось отправить заявку.");
      }

      formMessage.textContent = "✓ Заявка успешно отправлена!";
      form.reset();

    } catch (error) {
      formMessage.textContent =
        "Не удалось отправить заявку. Попробуйте позже.";

      console.error("NEXORA form error:", error);

    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Отправить заявку ↗";
    }
  });
});
