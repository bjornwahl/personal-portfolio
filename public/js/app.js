/* ===================================================
   Portfolio — app.js
   Fetches data/portfolio.json and renders everything.
   No external dependencies.
   =================================================== */

(function () {
  "use strict";

  /* ---------- DOM refs ---------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const avatarEl       = $("#avatar");
  const nameEl         = $("#authorName");
  const typingTextEl   = $("#typingText");
  const bioEl          = $("#authorBio");
  const ctaEl          = $("#authorCta");
  const footerLocEl    = $("#footerLocation");
  const searchEl       = $("#search");
  const filtersEl      = $("#filters");
  const gridEl         = $("#grid");
  const emptyEl        = $("#emptyState");
  const errorEl        = $("#errorState");
  const overlayEl      = $("#modalOverlay");
  const modalEl        = $("#modal");
  const modalClose     = $("#modalClose");
  const modalImage     = $("#modalImage");
  const modalThumbs    = $("#modalThumbs");
  const modalCategory  = $("#modalCategory");
  const modalYear      = $("#modalYear");
  const modalTitle     = $("#modalTitle");
  const modalDesc      = $("#modalDesc");
  const modalTags      = $("#modalTags");
  const modalAccordion = $("#modalAccordion");
  const modalLinks     = $("#modalLinks");
  const footerCopy     = $("#footerCopy");

  /* Biography modal refs */
  const storyBtn       = $("#storyBtn");
  const bioOverlayEl   = $("#bioModalOverlay");
  const bioModalEl     = $("#bioModal");
  const bioModalClose  = $("#bioModalClose");
  const bioModalAvatar = $("#bioModalAvatar");
  const bioModalTitle  = $("#bioModalTitle");
  const bioModalSub    = $("#bioModalSubtitle");
  const bioModalBody   = $("#bioModalBody");
  const cvBtn          = $("#cvBtn");

  /* ---------- State ---------- */
  let projects      = [];
  let activeFilter  = "ALL";
  let searchQuery   = "";
  let triggerElement = null; // Element that opened the modal, for focus return

  /* ---------- Fetch data ---------- */
  async function init() {
    try {
      const res = await fetch("data/portfolio.json", { cache: "no-store" });
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      renderAuthor(data.author);
      projects = data.projects || [];
      preloadImages(projects);
      renderFilters();
      renderGrid();
    } catch (err) {
      console.error("Failed to load portfolio data:", err);
      errorEl.hidden = false;
    }
  }

  /* ---------- Preload images ---------- */
  function preloadImages(list) {
    list.forEach(function (p) {
      var img = new Image();
      img.src = p.image;
      // Also preload gallery images
      (p.gallery || []).forEach(function (src) {
        var gImg = new Image();
        gImg.src = src;
      });
    });
  }

  /* ---------- Render author ---------- */
  var avatarRingEl = $("#avatarRing");

  function renderAuthor(a) {
    authorDataCache = a;
    // Avatar: skeleton until loaded
    avatarEl.alt = a.name;
    avatarEl.onload = function () {
      avatarRingEl.classList.add("is-loaded");
      avatarEl.onload = null;
    };
    avatarEl.onerror = function () {
      avatarRingEl.classList.add("is-loaded");
      avatarEl.onerror = null;
    };
    avatarEl.src = a.avatar;
    nameEl.textContent = a.name;
    bioEl.textContent = a.bio;

    // CTA
    if (a.ctaText && a.ctaUrl) {
      ctaEl.href = a.ctaUrl;
      ctaEl.querySelector(".hero__cta-text").textContent = a.ctaText;
    }

    // Footer
    footerCopy.textContent = "\u00A9 " + new Date().getFullYear() + " " + a.name;
    if (a.location) {
      footerLocEl.textContent = a.location;
    }

    // Page title
    document.title = a.name + " \u2014 " + a.title;

    // Start typewriter with roles
    var roles = a.roles || [a.title];
    startTypewriter(roles);
  }

  /* ---------- Typewriter ---------- */
  var typingSizerEl = $("#typingSizer");

  function startTypewriter(phrases) {
    // Set the invisible sizer to the longest phrase so container never changes height
    var longest = phrases.reduce(function (a, b) { return a.length >= b.length ? a : b; }, "");
    typingSizerEl.textContent = longest;

    var phraseIndex = 0;
    var charIndex = 0;
    var isDeleting = false;
    var typeSpeed = 80;
    var deleteSpeed = 40;
    var pauseEnd = 2000;
    var pauseStart = 400;

    function tick() {
      var current = phrases[phraseIndex];

      if (!isDeleting) {
        typingTextEl.textContent = current.substring(0, charIndex + 1);
        charIndex++;

        if (charIndex === current.length) {
          setTimeout(function () {
            isDeleting = true;
            tick();
          }, pauseEnd);
          return;
        }
        setTimeout(tick, typeSpeed);
      } else {
        typingTextEl.textContent = current.substring(0, charIndex - 1);
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          setTimeout(tick, pauseStart);
          return;
        }
        setTimeout(tick, deleteSpeed);
      }
    }

    tick();
  }

  /* ---------- Filters ---------- */
  function renderFilters() {
    var cats = ["ALL"];
    projects.forEach(function (p) {
      (p.category || []).forEach(function (c) {
        if (cats.indexOf(c) === -1) cats.push(c);
      });
    });

    filtersEl.innerHTML = cats
      .map(function (c) {
        var pressed = c === activeFilter ? "true" : "false";
        return '<button class="filter-btn" aria-pressed="' + pressed + '" data-cat="' + c + '">' + c + "</button>";
      })
      .join("");

    filtersEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (!btn) return;
      activeFilter = btn.dataset.cat;
      // Update pressed
      filtersEl.querySelectorAll(".filter-btn").forEach(function (b) {
        b.setAttribute("aria-pressed", b.dataset.cat === activeFilter ? "true" : "false");
      });
      renderGrid();
    });
  }

  /* ---------- Grid ---------- */
  function getFiltered() {
    var q = searchQuery.toLowerCase();
    return projects.filter(function (p) {
      var cats = p.category || [];
      var matchCat = activeFilter === "ALL" || cats.indexOf(activeFilter) !== -1;
      if (!matchCat) return false;
      if (!q) return true;
      var haystack = (
        p.title + " " + cats.join(" ") + " " + p.description + " " + (p.tags || []).join(" ")
      ).toLowerCase();
      return haystack.indexOf(q) !== -1;
    });
  }

  function renderGrid() {
    var filtered = getFiltered();

    if (filtered.length === 0) {
      gridEl.innerHTML = "";
      emptyEl.hidden = false;
      return;
    }

    emptyEl.hidden = true;

    gridEl.innerHTML = filtered
      .map(function (p, i) {
        return (
          '<article class="card" data-index="' + projects.indexOf(p) + '" tabindex="0" role="button" aria-label="View details for ' + escapeAttr(p.title) + '">' +
          '  <div class="card__image-wrap">' +
          '    <img class="card__image" src="' + p.image + '" alt="' + escapeAttr(p.title) + '" loading="lazy" />' +
          "  </div>" +
          '  <div class="card__body">' +
          '    <div class="card__meta">' +
          '      <span class="card__category">' + (p.category || []).join(" • ") + "</span>" +
          '      <span class="card__year">' + p.year + "</span>" +
          "    </div>" +
          '    <h3 class="card__title">' + escapeHTML(p.title) + "</h3>" +
          "  </div>" +
          "</article>"
        );
      })
      .join("");

    /* Shimmer: mark image wraps as loaded once image finishes */
    gridEl.querySelectorAll(".card__image").forEach(function (img) {
      var wrap = img.closest(".card__image-wrap");
      if (img.complete && img.naturalWidth > 0) {
        wrap.classList.add("is-loaded");
      } else {
        img.addEventListener("load", function () {
          wrap.classList.add("is-loaded");
        });
        img.addEventListener("error", function () {
          wrap.classList.add("is-loaded");
        });
      }
    });

    /* Card click / keyboard */
    gridEl.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("click", function () {
        openModal(Number(card.dataset.index), card);
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(Number(card.dataset.index), card);
        }
      });
    });
  }

  /* ---------- Search ---------- */
  searchEl.addEventListener("input", function () {
    searchQuery = searchEl.value.trim();
    renderGrid();
  });

  /* ---------- Modal ---------- */
  function openModal(index, trigger) {
    var p = projects[index];
    if (!p) return;

    triggerElement = trigger || null;

    // Reset shimmer on the image wrap only
    var modalImageWrap = modalImage.closest(".modal__image-wrap");
    modalImageWrap.classList.remove("is-loaded");
    modalImage.alt = p.title;

    var resolvedSrc = new URL(p.image, location.href).href;
    if (modalImage.src === resolvedSrc && modalImage.complete && modalImage.naturalWidth > 0) {
      modalImageWrap.classList.add("is-loaded");
    } else {
      modalImage.onload = function () {
        modalImageWrap.classList.add("is-loaded");
        modalImage.onload = null;
      };
      modalImage.onerror = function () {
        modalImageWrap.classList.add("is-loaded");
        modalImage.onerror = null;
      };
      modalImage.src = p.image;
    }

    // Thumbnails
    var gallery = p.gallery || [];
    if (gallery.length > 1) {
      modalThumbs.hidden = false;
      modalThumbs.innerHTML = gallery
        .map(function (src, i) {
          var activeClass = i === 0 ? " is-active" : "";
          return (
            '<button class="modal__thumb' + activeClass + '" data-src="' + src + '" aria-label="View image ' + (i + 1) + '">' +
            '  <img src="' + src + '" alt="" />' +
            '</button>'
          );
        })
        .join("");

      modalThumbs.querySelectorAll(".modal__thumb").forEach(function (thumb) {
        thumb.addEventListener("click", function () {
          var src = thumb.dataset.src;
          // Update active state
          modalThumbs.querySelectorAll(".modal__thumb").forEach(function (t) {
            t.classList.remove("is-active");
          });
          thumb.classList.add("is-active");
          // Swap main image with shimmer
          modalImageWrap.classList.remove("is-loaded");
          var resolved = new URL(src, location.href).href;
          if (modalImage.src === resolved && modalImage.complete && modalImage.naturalWidth > 0) {
            modalImageWrap.classList.add("is-loaded");
          } else {
            modalImage.onload = function () {
              modalImageWrap.classList.add("is-loaded");
              modalImage.onload = null;
            };
            modalImage.onerror = function () {
              modalImageWrap.classList.add("is-loaded");
              modalImage.onerror = null;
            };
            modalImage.src = src;
          }
        });
      });
    } else {
      modalThumbs.hidden = true;
      modalThumbs.innerHTML = "";
    }

    modalCategory.textContent = (p.category || []).join(" • ");
    modalYear.textContent = p.year;
    modalTitle.textContent = p.title;
    modalDesc.textContent = p.description;

    // Tags
    modalTags.innerHTML = (p.tags || [])
      .map(function (t) {
        return '<span class="modal__tag">' + escapeHTML(t) + "</span>";
      })
      .join("");

    // Accordion details
    var details = p.details || [];
    if (details.length > 0) {
      modalAccordion.hidden = false;
      modalAccordion.innerHTML = details
        .map(function (d, i) {
          return (
            '<div class="accordion-item" data-index="' + i + '">' +
            '  <button class="accordion-trigger" aria-expanded="false">' +
            '    <span>' + escapeHTML(d.heading) + '</span>' +
            '    <svg class="accordion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>' +
            '  </button>' +
            '  <div class="accordion-panel" role="region">' +
            '    <div class="accordion-panel__inner">' +
            '      <p class="accordion-panel__text">' + escapeHTML(d.body) + '</p>' +
            '    </div>' +
            '  </div>' +
            '</div>'
          );
        })
        .join("");

      // Toggle listeners
      modalAccordion.querySelectorAll(".accordion-trigger").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var item = btn.closest(".accordion-item");
          var isOpen = item.classList.contains("is-open");

          // Close all siblings
          modalAccordion.querySelectorAll(".accordion-item").forEach(function (el) {
            el.classList.remove("is-open");
            el.querySelector(".accordion-trigger").setAttribute("aria-expanded", "false");
          });

          // Open clicked if it was closed
          if (!isOpen) {
            item.classList.add("is-open");
            btn.setAttribute("aria-expanded", "true");
          }
        });
      });
    } else {
      modalAccordion.hidden = true;
      modalAccordion.innerHTML = "";
    }

    // Links
    modalLinks.innerHTML = (p.links || [])
      .map(function (l) {
        return (
          '<a class="modal__link" href="' + l.url + '" target="_blank" rel="noopener noreferrer">' +
          escapeHTML(l.label) +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>' +
          "</a>"
        );
      })
      .join("");

    // Show
    overlayEl.hidden = false;
    document.body.style.overflow = "hidden";
    // Trigger reflow for animation
    void overlayEl.offsetHeight;
    overlayEl.classList.add("is-visible");

    // Focus close button
    modalClose.focus();
  }

  function closeModal() {
    overlayEl.classList.remove("is-visible");
    document.body.style.overflow = "";

    // Wait for transition
    setTimeout(function () {
      overlayEl.hidden = true;
    }, 260);

    // Return focus
    if (triggerElement) {
      triggerElement.focus();
      triggerElement = null;
    }
  }

  // Close triggers
  modalClose.addEventListener("click", closeModal);
  overlayEl.addEventListener("click", function (e) {
    if (e.target === overlayEl) closeModal();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !overlayEl.hidden) closeModal();
    if (e.key === "Escape" && !bioOverlayEl.hidden) closeBioModal();
  });

  /* ---------- Biography modal ---------- */
  var authorDataCache = null;

  function openBioModal() {
    if (!authorDataCache) return;
    var a = authorDataCache;

    bioModalAvatar.src = a.avatar;
    bioModalAvatar.alt = a.name;
    bioModalTitle.textContent = a.name;
    bioModalSub.textContent = a.title;

    // Render biography paragraphs
    var bio = a.biography || a.bio || "";
    var paragraphs = bio.split("\n\n");
    var htmlParagraphs = paragraphs
      .map(function (p) { return "<p>" + escapeHTML(p.trim()) + "</p>"; })
      .filter(function (p) { return p !== "<p></p>"; });
    
    // Insert image after first paragraph with 16:9 aspect ratio
    if (htmlParagraphs.length > 0) {
      htmlParagraphs.splice(1, 0, '<div class="bio-modal__inline-image"><img src="assets/img/about.png" alt="Pictures of Bjørn in nature" /></div>');
    }
    
    bioModalBody.innerHTML = htmlParagraphs.join("");

    bioOverlayEl.hidden = false;
    document.body.style.overflow = "hidden";
    void bioOverlayEl.offsetHeight;
    bioOverlayEl.classList.add("is-visible");
    bioModalClose.focus();
  }

  function closeBioModal() {
    bioOverlayEl.classList.remove("is-visible");
    document.body.style.overflow = "";
    setTimeout(function () {
      bioOverlayEl.hidden = true;
    }, 260);
    storyBtn.focus();
  }

  storyBtn.addEventListener("click", openBioModal);
  bioModalClose.addEventListener("click", closeBioModal);
  bioOverlayEl.addEventListener("click", function (e) {
    if (e.target === bioOverlayEl) closeBioModal();
  });

  /* ---------- Helpers ---------- */
  function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- Hero mouse-tracking glow ---------- */
  var heroEl    = $("#hero");
  var mouseGlow = document.querySelector(".hero__glow-mouse");
  var glowX     = 0;
  var glowY     = 0;
  var targetX   = 0;
  var targetY   = 0;
  var glowRAF   = null;

  function lerpGlow() {
    glowX += (targetX - glowX) * 0.08;
    glowY += (targetY - glowY) * 0.08;
    mouseGlow.style.left = glowX + "px";
    mouseGlow.style.top  = glowY + "px";
    glowRAF = requestAnimationFrame(lerpGlow);
  }

  heroEl.addEventListener("mouseenter", function () {
    mouseGlow.classList.add("is-active");
    if (!glowRAF) glowRAF = requestAnimationFrame(lerpGlow);
  });

  heroEl.addEventListener("mousemove", function (e) {
    var rect = heroEl.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
  });

  heroEl.addEventListener("mouseleave", function () {
    mouseGlow.classList.remove("is-active");
    if (glowRAF) {
      cancelAnimationFrame(glowRAF);
      glowRAF = null;
    }
  });

  /* ---------- Go ---------- */
  init();
})();
