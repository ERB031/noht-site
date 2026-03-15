/* ============================================
   NOHT — Shared JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initPortfolioFilter();
  initProjectModal();
  initBlogModal();
  initServiceModal();
});

/* --- Navigation --- */
function initNav() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const drawer = document.querySelector('.nav__drawer');
  const drawerLinks = document.querySelectorAll('.nav__drawer .nav__link');

  // Scroll effect
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('nav--scrolled', window.scrollY > 40);
    });
    // Trigger on load in case page is already scrolled
    nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  }

  // Scroll reveal animations
  var revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length) {
    var revealObserver = new IntersectionObserver(
      function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal--visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    revealElements.forEach(function(el) { revealObserver.observe(el); });
  }

  // Mobile toggle
  if (toggle && drawer) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('nav__toggle--open');
      drawer.classList.toggle('nav__drawer--open');
      document.body.style.overflow = drawer.classList.contains('nav__drawer--open') ? 'hidden' : '';
    });

    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('nav__toggle--open');
        drawer.classList.remove('nav__drawer--open');
        document.body.style.overflow = '';
      });
    });
  }
}

/* --- Project Modal --- */
function initProjectModal() {
  var modal = document.getElementById('project-modal');
  if (!modal) return;

  var overlay = modal.querySelector('.modal__overlay');
  var closeBtn = modal.querySelector('.modal__close');
  var mediaEl = document.getElementById('modal-media');
  var tagEl = document.getElementById('modal-tag');
  var titleEl = document.getElementById('modal-title');
  var descEl = document.getElementById('modal-description');
  var prevBtn = document.getElementById('modal-prev');
  var nextBtn = document.getElementById('modal-next');
  var counterEl = document.getElementById('modal-counter');

  var slides = [];
  var currentSlide = 0;

  function getEmbedUrl(url) {
    if (!url) return null;
    var m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return 'https://player.vimeo.com/video/' + m[1] + '?dnt=1';
    m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    if (m) return 'https://www.youtube.com/embed/' + m[1];
    return null;
  }

  var categoryLabels = { film: 'Film', commercial: 'Commercial', 'music-video': 'Music Video', nonprofit: 'Nonprofit' };

  function showSlide(index) {
    currentSlide = index;
    var slide = slides[index];
    if (slide.type === 'video') {
      mediaEl.innerHTML = '<iframe src="' + slide.src + '" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
    } else if (slide.type === 'image') {
      mediaEl.innerHTML = '<img src="' + slide.src + '" alt="' + slide.alt + '">';
    } else {
      mediaEl.innerHTML = '<div class="modal__media-placeholder">Project Image</div>';
    }
    counterEl.textContent = (index + 1) + ' / ' + slides.length;
  }

  function openModal(card) {
    var title = card.dataset.title;
    var description = card.dataset.description;
    var category = card.dataset.category;
    var thumbnail = card.dataset.thumbnail;
    var videoUrl = card.dataset.video;
    var embedUrl = getEmbedUrl(videoUrl);

    tagEl.textContent = categoryLabels[category] || category;
    titleEl.textContent = title;
    descEl.textContent = description;

    // Build slides array
    slides = [];
    if (embedUrl) {
      slides.push({ type: 'video', src: embedUrl, alt: title });
    }
    if (thumbnail) {
      slides.push({ type: 'image', src: thumbnail, alt: title });
    }
    var galleryData = card.dataset.gallery;
    if (galleryData) {
      try {
        var images = JSON.parse(galleryData);
        images.forEach(function(src) {
          slides.push({ type: 'image', src: src, alt: title });
        });
      } catch (e) {}
    }
    if (slides.length === 0) {
      slides.push({ type: 'placeholder' });
    }

    // Show/hide arrows and counter
    if (slides.length > 1) {
      prevBtn.classList.add('modal__arrow--visible');
      nextBtn.classList.add('modal__arrow--visible');
      counterEl.classList.add('modal__counter--visible');
    } else {
      prevBtn.classList.remove('modal__arrow--visible');
      nextBtn.classList.remove('modal__arrow--visible');
      counterEl.classList.remove('modal__counter--visible');
    }

    showSlide(0);
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
    mediaEl.innerHTML = '';
    slides = [];
  }

  prevBtn.addEventListener('click', function() {
    if (slides.length > 1) {
      showSlide((currentSlide - 1 + slides.length) % slides.length);
    }
  });

  nextBtn.addEventListener('click', function() {
    if (slides.length > 1) {
      showSlide((currentSlide + 1) % slides.length);
    }
  });

  document.addEventListener('click', function(e) {
    var card = e.target.closest('.card--clickable');
    if (card) {
      e.preventDefault();
      openModal(card);
    }
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e) {
    if (modal.classList.contains('modal--open')) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft' && slides.length > 1) showSlide((currentSlide - 1 + slides.length) % slides.length);
      if (e.key === 'ArrowRight' && slides.length > 1) showSlide((currentSlide + 1) % slides.length);
    }
  });
}

/* --- Blog Modal --- */
function initBlogModal() {
  const modal = document.getElementById('blog-modal');
  if (!modal) return;

  const overlay = modal.querySelector('.modal__overlay');
  const closeBtn = modal.querySelector('.modal__close');
  const dateEl = document.getElementById('blog-modal-date');
  const titleEl = document.getElementById('blog-modal-title');
  const bodyEl = document.getElementById('blog-modal-body');

  function openModal(card) {
    dateEl.textContent = card.dataset.date;
    titleEl.textContent = card.dataset.title;

    var paragraphs = card.dataset.body.split('||');
    bodyEl.innerHTML = paragraphs.map(function(p) { return '<p>' + p + '</p>'; }).join('');

    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
    bodyEl.innerHTML = '';
  }

  document.addEventListener('click', function(e) {
    var card = e.target.closest('.blog-card--clickable');
    if (card) {
      e.preventDefault();
      openModal(card);
    }
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
      closeModal();
    }
  });
}

/* --- Service Modal --- */
function initServiceModal() {
  const modal = document.getElementById('service-modal');
  if (!modal) return;

  const overlay = modal.querySelector('.modal__overlay');
  const closeBtn = modal.querySelector('.modal__close');
  const iconEl = document.getElementById('service-modal-icon');
  const titleEl = document.getElementById('service-modal-title');
  const descEl = document.getElementById('service-modal-description');

  function openModal(card) {
    iconEl.textContent = card.dataset.icon;
    titleEl.textContent = card.dataset.title;
    descEl.textContent = card.dataset.description;

    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
  }

  document.addEventListener('click', function(e) {
    var card = e.target.closest('.service-card--clickable');
    if (card) {
      e.preventDefault();
      openModal(card);
    }
  });

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
      closeModal();
    }
  });
}

/* --- Portfolio Filter --- */
function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('[data-category]');
  if (!filterBtns.length || !cards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      // Update active button
      filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');

      // Filter cards
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}
