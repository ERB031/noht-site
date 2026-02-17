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
  const staticPages = ['index.html', 'about.html', 'services.html', 'community.html', 'contact.html'];
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

// Build the Work page
function buildWorkPage() {
  const projects = readContent('work').sort((a, b) => (a.order || 0) - (b.order || 0));

  const cards = projects.map(p => {
    const imgHtml = p.thumbnail
      ? `<img src="${escapeHtml(p.thumbnail)}" alt="${escapeHtml(p.title)}">`
      : `<div class="card__image-placeholder">Project Image</div>`;

    return `        <div class="card" data-category="${escapeHtml(p.category)}">
          <div class="card__image">
            ${imgHtml}
          </div>
          <div class="card__body">
            <span class="card__tag">${categoryLabel(p.category)}</span>
            <h3 class="card__title">${escapeHtml(p.title)}</h3>
            <p class="card__text">${escapeHtml(p.description)}</p>
          </div>
        </div>`;
  }).join('\n\n');

  // Read the work.html template and replace the project grid content
  let html = fs.readFileSync(path.join(__dirname, 'work.html'), 'utf-8');

  // Replace everything between the grid opening and closing tags
  html = html.replace(
    /(<!-- Project Grid -->\s*<div class="grid grid--3 reveal">)([\s\S]*?)(\s*<\/div>\s*<\/div>\s*<\/section>)/,
    `$1\n\n${cards}\n\n      $3`
  );

  fs.writeFileSync(path.join(DIST_DIR, 'work.html'), html);
  console.log(`Built work.html with ${projects.length} projects`);
}

// Build the Blog page
function buildBlogPage() {
  const posts = readContent('blog').sort((a, b) => new Date(b.date) - new Date(a.date));

  const cards = posts.map(p => {
    const imgHtml = p.image
      ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">`
      : `<div class="blog-card__image-placeholder"></div>`;

    return `      <div class="blog-card reveal" style="margin-bottom: var(--space-lg);">
        <div class="blog-card__image">
          ${imgHtml}
        </div>
        <div class="blog-card__body">
          <span class="blog-card__date">${formatDate(p.date)}</span>
          <h3 class="blog-card__title">${escapeHtml(p.title)}</h3>
          <p class="blog-card__excerpt">${escapeHtml(p.excerpt)}</p>
          <a href="#" class="blog-card__link">Read More &rarr;</a>
        </div>
      </div>`;
  }).join('\n\n');

  // Read the blog.html template and replace the blog content
  let html = fs.readFileSync(path.join(__dirname, 'blog.html'), 'utf-8');

  // Replace everything inside the blog section container
  html = html.replace(
    /(<section class="section">\s*<div class="container">)([\s\S]*?)(<\/div>\s*<\/section>\s*<!-- Footer -->)/,
    `$1\n\n${cards}\n\n    $3`
  );

  fs.writeFileSync(path.join(DIST_DIR, 'blog.html'), html);
  console.log(`Built blog.html with ${posts.length} posts`);
}

// Run the build
console.log('Building NOHT website...');
setup();
buildWorkPage();
buildBlogPage();
console.log('Build complete! Output in /dist');
