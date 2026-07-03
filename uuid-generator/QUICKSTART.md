# UUID Generator - Quick Start Guide

Get up and running in minutes.

## 🚀 5-Minute Setup

### Step 1: Test Locally (2 minutes)

```bash
cd /Users/paulodonnell/.openclaw/workspace/codex/uuid-generator

# Start local server
python3 -m http.server 8000

# Open browser
# http://localhost:8000
```

**What to test:**
- Generate UUIDs (v1, v4, v5, v7)
- Click "Copy" button
- Paste UUID in validator
- Toggle dark mode
- Generate bulk UUIDs (10+)
- Try export buttons

### Step 2: Push to GitHub (2 minutes)

```bash
# Create repo at https://github.com/new
# Name: "uuid-generator"
# Make it public

# Add remote & push
git remote add origin https://github.com/<YOUR-USERNAME>/uuid-generator.git
git push -u origin main
```

### Step 3: Deploy to Vercel (1 minute)

**Option A: CLI (easiest)**
```bash
npm install -g vercel
vercel
# Follow prompts → deploy
```

**Option B: Web Dashboard**
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your uuid-generator repo
4. Click "Deploy"

**Done! 🎉**

Your site is live at: `https://uuid-generator-xxxxx.vercel.app`

---

## 📝 Optional Configuration

### Add Custom Domain

```bash
# In Vercel Dashboard:
# Settings → Domains → Add Domain

# Register domain at Namecheap, GoDaddy, etc.
# Update DNS records (Vercel shows exact values)
# Update canonical URL in index.html:
```

Edit line ~12 in `index.html`:
```html
<meta name="canonical" href="https://your-domain.com/">
```

Then:
```bash
git add index.html
git commit -m "Update canonical URL"
git push origin main
```

### Add Google Analytics

Edit line ~30 in `index.html`, add before `</head>`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Add Google AdSense

Get your Publisher ID from https://www.google.com/adsense

Find this in `index.html` (line ~490):
```html
<div class="ad-space">
    <!-- Google AdSense Code will be inserted here -->
    <small>Advertisement Space</small>
</div>
```

Replace with:
```html
<div class="ad-space">
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxxxxxxxx"></script>
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-xxxxxxxxxxxxxxxx"
         data-ad-slot="1234567890"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
    <script>
         (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
</div>
```

Then commit and push:
```bash
git add index.html
git commit -m "Add Google AdSense"
git push origin main
```

---

## 📚 Documentation

- **README.md** - Features, customization, browser support
- **DEPLOYMENT.md** - Detailed deployment guide
- **DEVELOPMENT.md** - Code architecture, development setup
- **PROJECT_SUMMARY.txt** - Complete project overview

---

## ✅ Verification Checklist

After deployment:

- [ ] Site accessible at your domain
- [ ] HTTPS working (🔒 lock icon)
- [ ] Dark mode toggle works
- [ ] Generate UUID works (all versions)
- [ ] Copy-to-clipboard works
- [ ] Validation works
- [ ] Mobile responsive (test on phone)
- [ ] Lighthouse score 85+ (Chrome DevTools)

---

## 🔗 Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **GitHub:** https://github.com/<your-username>/uuid-generator
- **Your Site:** https://your-domain.com
- **Google Search Console:** https://search.google.com/search-console
- **Lighthouse:** Chrome DevTools → Lighthouse tab

---

## 🆘 Troubleshooting

**Site not updating?**
```bash
# Clear browser cache (Cmd+Shift+R on Mac)
# Check Vercel deployment log
# Verify git push succeeded
```

**Domain not working?**
```bash
# Wait 5-30 minutes for DNS propagation
nslookup your-domain.com  # Check DNS
```

**Copy-to-clipboard not working?**
- Must be HTTPS (clipboard API requirement)
- Works in modern browsers (Chrome, Firefox, Safari, Edge)

---

## 📞 Support

See **DEPLOYMENT.md** for comprehensive troubleshooting guide.

---

## 🎉 You're Done!

Your UUID Generator is now live and ready to serve developers worldwide.

**Next steps:**
1. Share your site
2. Monitor analytics
3. Collect feedback
4. Iterate & improve

Happy generating! 🚀
