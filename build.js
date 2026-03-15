const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const CONTENT_DIR = path.join(__dirname, 'content');
const DIST_DIR = path.join(__dirname, 'dist');

// Ensure dist directory exists and copy static files
function setup() {
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // Copy static assets
  copyDir(path.join(__dirname, 'assets'), path.join(DIST_DIR, 'assets'));
  copyDir(path.join(__dirname, 'css'), path.join(DIST_DIR, 'css'));
  copyDir(path.join(__dirname, 'js'), path.join(DIST_DIR, 'js'));
  copyDir(path.join(__dirname, 'admin'), path.join(DIST_DIR, 'admin'));

  // Copy static HTML pages (ones that don't need dynamic content)
  const staticPages = ['about.html', 'contact.html'];
  staticPages.forEach(file => {
    const src = path.join(__dirname, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DIST_DIR, file));
    }
  });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Read all markdown files from a content folder
function readContent(folder) {
  const dir = path.join(CONTENT_DIR, folder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = fs.readFileSync(path.join(dir, f), 'utf-8');
      const { data, content } = matter(raw);
      return { ...data, body: content, slug: f.replace('.md', '') };
    });
}

// Format a date string nicely
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Escape HTML entities
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Extract video embed URL from a Vimeo or YouTube link
function getVideoEmbed(url) {
  if (!url) return null;
  // Vimeo: https://vimeo.com/123456 or https://player.vimeo.com/video/123456
  let match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (match) return `https://player.vimeo.com/video/${match[1]}?dnt=1`;
  // YouTube: various formats
  match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return null;
}

// Map category slug to display label
function categoryLabel(cat) {
  const labels = {
    'film': 'Film',
    'commercial': 'Commercial',
    'music-video': 'Music Video',
    'nonprofit': 'Nonprofit'
  };
  return labels[cat] || cat;
}

// Build a card HTML snippet for a work project
function buildCardHtml(p) {
  const embedUrl = getVideoEmbed(p.video_url);

  let mediaHtml;
  if (embedUrl) {
    mediaHtml = `<div class="card__video">
              <iframe src="${escapeHtml(embedUrl)}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>
            </div>`;
  } else if (p.thumbnail) {
    mediaHtml = `<div class="card__image">
              <img src="${escapeHtml(p.thumbnail)}" alt="${escapeHtml(p.title)}">
            </div>`;
  } else {
    mediaHtml = `<div class="card__image">
              <div class="card__image-placeholder">Project Image</div>
            </div>`;
  }

  const galleryJson = (p.gallery && p.gallery.length) ? escapeHtml(JSON.stringify(p.gallery)) : '';
  const dataAttrs = ` data-category="${escapeHtml(p.category)}" data-title="${escapeHtml(p.title)}" data-description="${escapeHtml(p.description)}" data-thumbnail="${escapeHtml(p.thumbnail || '')}" data-video="${escapeHtml(p.video_url || '')}" data-gallery="${galleryJson}"`;

  return `        <div class="card card--clickable"${dataAttrs}>
          ${mediaHtml}
          <div class="card__body">
            <span class="card__tag">${categoryLabel(p.category)}</span>
            <h3 class="card__title">${escapeHtml(p.title)}</h3>
            <p class="card__text">${escapeHtml(p.description)}</p>
          </div>
        </div>`;
}

// Build a featured card that links to the work page
function buildFeaturedCardHtml(p) {
  const embedUrl = getVideoEmbed(p.video_url);

  let mediaHtml;
  if (embedUrl) {
    mediaHtml = `<div class="card__video">
              <iframe src="${escapeHtml(embedUrl)}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>
            </div>`;
  } else if (p.thumbnail) {
    mediaHtml = `<div class="card__image">
              <img src="${escapeHtml(p.thumbnail)}" alt="${escapeHtml(p.title)}">
            </div>`;
  } else {
    mediaHtml = `<div class="card__image">
              <div class="card__image-placeholder">Project Image</div>
            </div>`;
  }

  return `        <a href="work.html" class="card">
          ${mediaHtml}
          <div class="card__body">
            <span class="card__tag">${categoryLabel(p.category)}</span>
            <h3 class="card__title">${escapeHtml(p.title)}</h3>
            <p class="card__text">${escapeHtml(p.description)}</p>
          </div>
        </a>`;
}

// Modal HTML to inject before </body>
const MODAL_HTML = `
  <!-- Project Modal -->
  <div class="modal" id="project-modal">
    <div class="modal__overlay"></div>
    <div class="modal__content">
      <button class="modal__close" aria-label="Close">&times;</button>
      <div class="modal__media" id="modal-media"></div>
      <div class="modal__body">
        <span class="modal__tag" id="modal-tag"></span>
        <h3 class="modal__title" id="modal-title"></h3>
        <p class="modal__description" id="modal-description"></p>
        <div class="modal__gallery" id="modal-gallery"></div>
      </div>
    </div>
  </div>`;

// Blog modal HTML
const BLOG_MODAL_HTML = `
  <!-- Blog Post Modal -->
  <div class="modal" id="blog-modal">
    <div class="modal__overlay"></div>
    <div class="modal__content">
      <button class="modal__close" aria-label="Close">&times;</button>
      <div class="modal__body">
        <span class="blog-card__date" id="blog-modal-date"></span>
        <h3 class="modal__title" id="blog-modal-title"></h3>
        <div class="blog-post__content" id="blog-modal-body"></div>
      </div>
    </div>
  </div>`;

// Inject modal HTML into a page string
function injectModal(html) {
  return html.replace('</body>', MODAL_HTML + '\n</body>');
}

function injectBlogModal(html) {
  return html.replace('</body>', BLOG_MODAL_HTML + '\n</body>');
}

// Build the Home page with featured work from content
function buildHomePage() {
  const projects = readContent('work').sort((a, b) => (a.order || 0) - (b.order || 0));
  const featured = projects.slice(0, 3);

  const cards = featured.map(p => buildFeaturedCardHtml(p)).join('\n');

  let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

  html = html.replace(
    /(<div class="grid grid--3">)([\s\S]*?)(<\/div>\s*<div class="text-center")/,
    `$1\n${cards}\n      $3`
  );

  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html);
  console.log(`Built index.html with ${featured.length} featured projects`);
}

// Build the Work page
function buildWorkPage() {
  const projects = readContent('work').sort((a, b) => (a.order || 0) - (b.order || 0));

  const cards = projects.map(p => buildCardHtml(p)).join('\n\n');

  // Read the work.html template and replace the project grid content
  let html = fs.readFileSync(path.join(__dirname, 'work.html'), 'utf-8');

  // Replace everything between the grid opening and closing tags
  html = html.replace(
    /(<!-- Project Grid -->\s*<div class="grid grid--3">)([\s\S]*?)(\s*<\/div>\s*<\/div>\s*<\/section>)/,
    `$1\n\n${cards}\n\n      $3`
  );

  html = injectModal(html);
  fs.writeFileSync(path.join(DIST_DIR, 'work.html'), html);
  console.log(`Built work.html with ${projects.length} projects`);
}

// Build the Community page
function buildCommunityPage() {
  const partners = readContent('community').sort((a, b) => (a.order || 0) - (b.order || 0));

  const cards = partners.map(p => {
    const embedUrl = getVideoEmbed(p.video_url);

    let mediaHtml;
    if (embedUrl) {
      mediaHtml = `<div class="card__video">
              <iframe src="${escapeHtml(embedUrl)}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe>
            </div>`;
    } else if (p.thumbnail) {
      mediaHtml = `<div class="card__image">
              <img src="${escapeHtml(p.thumbnail)}" alt="${escapeHtml(p.title)}">
            </div>`;
    } else {
      mediaHtml = `<div class="card__image">
              <div class="card__image-placeholder">Partner Image</div>
            </div>`;
    }

    const galleryJson = (p.gallery && p.gallery.length) ? escapeHtml(JSON.stringify(p.gallery)) : '';

    return `        <div class="card card--clickable" data-category="nonprofit" data-title="${escapeHtml(p.title)}" data-description="${escapeHtml(p.description)}" data-thumbnail="${escapeHtml(p.thumbnail || '')}" data-video="${escapeHtml(p.video_url || '')}" data-gallery="${galleryJson}">
          ${mediaHtml}
          <div class="card__body">
            <span class="card__tag">Nonprofit Partner</span>
            <h3 class="card__title">${escapeHtml(p.title)}</h3>
            <p class="card__text">${escapeHtml(p.description)}</p>
          </div>
        </div>`;
  }).join('\n\n');

  let html = fs.readFileSync(path.join(__dirname, 'community.html'), 'utf-8');

  html = html.replace(
    /(<div class="grid grid--3">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>\s*<!-- Impact Stats -->)/,
    `$1\n\n${cards}\n\n      $3`
  );

  html = injectModal(html);
  fs.writeFileSync(path.join(DIST_DIR, 'community.html'), html);
  console.log(`Built community.html with ${partners.length} partners`);
}

// Build the Services page
function buildServicesPage() {
  const services = readContent('services').sort((a, b) => (a.order || 0) - (b.order || 0));

  const cards = services.map(s => {
    return `        <div class="service-card service-card--clickable" data-title="${escapeHtml(s.title)}" data-description="${escapeHtml(s.description)}" data-thumbnail="${escapeHtml(s.thumbnail || '')}" data-icon="${escapeHtml(s.icon || '')}">
          <div class="service-card__icon">${s.icon || ''}</div>
          <h3 class="service-card__title">${escapeHtml(s.title)}</h3>
          <p class="service-card__text">${escapeHtml(s.description)}</p>
        </div>`;
  }).join('\n\n');

  let html = fs.readFileSync(path.join(__dirname, 'services.html'), 'utf-8');

  html = html.replace(
    /(<div class="grid grid--3">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>\s*<!-- CTA Strip -->)/,
    `$1\n\n${cards}\n\n      $3`
  );

  // Inject a service-specific modal
  const serviceModalHtml = `
  <!-- Service Modal -->
  <div class="modal" id="service-modal">
    <div class="modal__overlay"></div>
    <div class="modal__content">
      <button class="modal__close" aria-label="Close">&times;</button>
      <div class="modal__body" style="text-align: center; padding: var(--space-xl) var(--space-lg);">
        <div class="service-card__icon" id="service-modal-icon" style="width: 72px; height: 72px; font-size: 2rem; margin: 0 auto var(--space-md);"></div>
        <h3 class="modal__title" id="service-modal-title"></h3>
        <p class="modal__description" id="service-modal-description"></p>
      </div>
    </div>
  </div>`;

  html = html.replace('</body>', serviceModalHtml + '\n</body>');
  fs.writeFileSync(path.join(DIST_DIR, 'services.html'), html);
  console.log(`Built services.html with ${services.length} services`);
}

// Build the Blog listing page and individual post pages
function buildBlogPage() {
  const posts = readContent('blog').sort((a, b) => new Date(b.date) - new Date(a.date));

  // Build individual post pages
  fs.mkdirSync(path.join(DIST_DIR, 'blog'), { recursive: true });

  posts.forEach(p => {
    const postHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(p.title)} — NOHT</title>
  <meta name="description" content="${escapeHtml(p.excerpt)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>

  <nav class="nav">
    <div class="nav__inner">
      <a href="../index.html" class="nav__logo">
        <img src="../assets/NOHT5.png" alt="NOHT">
      </a>
      <div class="nav__links">
        <a href="../index.html" class="nav__link">Home</a>
        <a href="../about.html" class="nav__link">About</a>
        <a href="../work.html" class="nav__link">Work</a>
        <a href="../services.html" class="nav__link">Services</a>
        <a href="../community.html" class="nav__link">Community</a>
        <a href="../blog.html" class="nav__link nav__link--active">Blog</a>
        <a href="../contact.html" class="nav__link">Contact</a>
      </div>
      <button class="nav__toggle" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </nav>

  <div class="nav__drawer">
    <a href="../index.html" class="nav__link">Home</a>
    <a href="../about.html" class="nav__link">About</a>
    <a href="../work.html" class="nav__link">Work</a>
    <a href="../services.html" class="nav__link">Services</a>
    <a href="../community.html" class="nav__link">Community</a>
    <a href="../blog.html" class="nav__link nav__link--active">Blog</a>
    <a href="../contact.html" class="nav__link">Contact</a>
  </div>

  <article class="page-hero">
    <div class="container container--narrow text-center">
      <div class="divider divider--center"></div>
      <span class="blog-card__date">${formatDate(p.date)}</span>
      <h1>${escapeHtml(p.title)}</h1>
    </div>
  </article>

  <section class="section">
    <div class="container container--narrow">
      ${p.image ? `<div class="blog-post__hero-image" style="margin-bottom: var(--space-xl);"><img src="../${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" style="width:100%; border-radius: var(--radius-lg);"></div>` : ''}
      <div class="blog-post__content">
        ${p.body.split('\n').filter(line => line.trim()).map(line => `<p>${escapeHtml(line.trim())}</p>`).join('\n        ')}
      </div>
      <div style="margin-top: var(--space-xl);">
        <a href="../blog.html" class="btn btn--outline">&larr; Back to Blog</a>
      </div>
    </div>
  </section>

  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <img src="../assets/NOHT5.png" alt="NOHT">
          <p class="footer__tagline">Atlanta-based film production company driven by creativity and community.</p>
          <div class="footer__social">
            <a href="#" class="footer__social-link" aria-label="Instagram">&#9679;</a>
            <a href="#" class="footer__social-link" aria-label="YouTube">&#9679;</a>
            <a href="#" class="footer__social-link" aria-label="Vimeo">&#9679;</a>
          </div>
        </div>
        <div>
          <h4 class="footer__heading">Navigate</h4>
          <a href="../index.html" class="footer__link">Home</a>
          <a href="../about.html" class="footer__link">About</a>
          <a href="../work.html" class="footer__link">Work</a>
          <a href="../services.html" class="footer__link">Services</a>
        </div>
        <div>
          <h4 class="footer__heading">More</h4>
          <a href="../community.html" class="footer__link">Community</a>
          <a href="../blog.html" class="footer__link">Blog</a>
          <a href="../contact.html" class="footer__link">Contact</a>
        </div>
        <div>
          <h4 class="footer__heading">Location</h4>
          <p class="footer__link">Atlanta, GA</p>
          <a href="mailto:hello@noht.com" class="footer__link">hello@noht.com</a>
        </div>
      </div>
      <div class="footer__bottom">
        <span>&copy; 2026 NOHT. All rights reserved.</span>
        <a href="../admin/" class="footer__admin-link">Admin</a>
        <span>Based in Atlanta, GA</span>
      </div>
    </div>
  </footer>

  <script src="../js/main.js"></script>
</body>
</html>`;

    fs.writeFileSync(path.join(DIST_DIR, 'blog', p.slug + '.html'), postHtml);
  });

  // Build listing page
  const cards = posts.map(p => {
    const imgHtml = p.image
      ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">`
      : `<div class="blog-card__image-placeholder"></div>`;

    const bodyHtml = p.body.split('\n').filter(line => line.trim()).map(line => escapeHtml(line.trim())).join('||');

    return `      <div class="blog-card blog-card--clickable" style="margin-bottom: var(--space-lg);" data-title="${escapeHtml(p.title)}" data-date="${escapeHtml(formatDate(p.date))}" data-body="${bodyHtml}" data-image="${escapeHtml(p.image || '')}">
        <div class="blog-card__image">
          ${imgHtml}
        </div>
        <div class="blog-card__body">
          <span class="blog-card__date">${formatDate(p.date)}</span>
          <h3 class="blog-card__title">${escapeHtml(p.title)}</h3>
          <p class="blog-card__excerpt">${escapeHtml(p.excerpt)}</p>
          <span class="blog-card__link">Read More &rarr;</span>
        </div>
      </div>`;
  }).join('\n\n');

  let html = fs.readFileSync(path.join(__dirname, 'blog.html'), 'utf-8');

  html = html.replace(
    /(<section class="section">\s*<div class="container">)([\s\S]*?)(<\/div>\s*<\/section>\s*<!-- Footer -->)/,
    `$1\n\n${cards}\n\n    $3`
  );

  html = injectBlogModal(html);
  fs.writeFileSync(path.join(DIST_DIR, 'blog.html'), html);
  console.log(`Built blog.html with ${posts.length} posts (+ ${posts.length} individual pages)`);
}

// Run the build
console.log('Building NOHT website...');
setup();
buildHomePage();
buildWorkPage();
buildCommunityPage();
buildServicesPage();
buildBlogPage();
console.log('Build complete! Output in /dist');
