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

  // 3D emblem tilt stays on the mark itself; no page-wide parallax.
  const emblem = document.querySelector(".hero-visual .core");
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (emblem && hasFinePointer && !reduceMotion) {
    emblem.addEventListener("pointermove", event => {
      const bounds = emblem.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      emblem.style.setProperty("--emblem-tilt-x", `${(0.5 - y) * 16}deg`);
      emblem.style.setProperty("--emblem-tilt-y", `${(x - 0.5) * 16}deg`);
      emblem.style.setProperty("--emblem-light-x", `${x * 100}%`);
      emblem.style.setProperty("--emblem-light-y", `${y * 100}%`);
    });

    emblem.addEventListener("pointerleave", () => {
      emblem.style.setProperty("--emblem-tilt-x", "0deg");
      emblem.style.setProperty("--emblem-tilt-y", "0deg");
      emblem.style.setProperty("--emblem-light-x", "50%");
      emblem.style.setProperty("--emblem-light-y", "18%");
    });
  }

  // 3. SCROLL PROGRESS
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
    background: "linear-gradient(90deg, #e6e6e3, #77797a)",
    boxShadow: "none",
    pointerEvents: "none"
  });

  const updateProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const percentage = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progress.style.width = `${percentage}%`;
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  // 4. SCROLL REVEAL
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

  // 5. ANIMATED STATISTICS
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

  // 6. SMOOTH ANCHOR SCROLL
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

  // 7. FOOTER YEAR
  document.querySelectorAll("[data-year]").forEach(element => {
    element.textContent = new Date().getFullYear();
  });

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
      const response = await fetch("/api/order", {
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
