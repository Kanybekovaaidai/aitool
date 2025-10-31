# KnowledgeShare — MVP

Small MVP site for asking and answering questions locally in the browser.

Features
- Post questions and answers
- Like questions and answers
- Toggle answers per question
- Local persistence using LocalStorage
- About and Contact sections (contact messages saved locally)
- Mobile-first responsive design, light/dark theme toggle

Files
- `index.html` — main app UI
- `style.css` — styles and responsive rules
- `script.js` — client-side logic (state, persistence, rendering)

Run locally
1. Open `index.html` in your browser (double-click) or serve with a local server:

```powershell
cd 'C:\Users\HP\Desktop\AItool'
python -m http.server 8000
# then open http://localhost:8000
```

Deployment
- This is a static site and can be deployed to GitHub Pages (enable Pages in repo settings) or any static host (Netlify, Vercel, etc.).

Notes
- Data (questions, answers, contact messages) are stored in your browser's LocalStorage under keys `knowledgeShare.v1` and `knowledgeShare.messages.v1`.
- For production or multi-user scenarios, wire the frontend to a backend API instead of LocalStorage.

License
- MIT
