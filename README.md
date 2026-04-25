# Veridect — Fake News & Propaganda Detection Tool

A full-stack fake news and propaganda detection web application built with Flask, vanilla JS, and a custom dark UI. Designed as a final year cybersecurity project.

## Features

- **NLP Analysis** — Detects 9 propaganda tactics via pattern matching (fear appeal, loaded language, false dichotomy, bandwagon, appeal to authority, scapegoating, repetition, black & white thinking, glittering generality)
- **Sentiment Scoring** — Measures emotional manipulation through linguistic signals
- **OSINT Source Analysis** — Domain credibility scoring, age detection, registrar country risk, fact-check database lookup
- **Multi-signal Fusion** — Weighted risk score combining NLP + OSINT signals
- **Scan History** — Persists all analyses in the session with timeline view
- **Propaganda Guide** — Reference library of all tactic types with examples
- **Domain Lookup** — Standalone domain credibility tool
- **Responsive Dark UI** — Sleek dashboard with animated risk meters

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the server
python app.py

# 3. Open in browser
# http://localhost:5000
```

## Project Structure

```
veridect/
├── app.py                  # Flask backend + NLP/OSINT analysis engine
├── requirements.txt
├── templates/
│   └── index.html          # Single-page app shell
└── static/
    ├── css/
    │   └── style.css       # Full dark theme stylesheet
    └── js/
        └── app.js          # Frontend logic, API calls, rendering
```

## How It Works

### Analysis Pipeline

1. **Input** — URL or raw article text submitted via the top bar
2. **Domain extraction** — Parses URL to extract domain for OSINT checks
3. **Domain analysis** — Scores domain against whitelist, checks naming patterns, TLD, simulates age and registrar country
4. **NLP analysis** — Regex-based propaganda tactic detection across 9 categories, sentiment scoring via keyword heuristics, manipulation signal extraction
5. **Score fusion** — Weighted combination: tactics (30%) + sentiment (20%) + manipulation (15%) + source credibility (25%) + cross-source (10%)
6. **Output** — Risk score, credibility score, per-signal breakdown, OSINT report

### Extending to Production

Replace the heuristic components with:
- **BERT/RoBERTa** fine-tuned on FakeNewsNet or LIAR dataset (HuggingFace Transformers)
- **Real Whois API** (python-whois library)
- **NewsAPI / GDELT** for cross-source agreement
- **ClaimBuster API** for claim-level fact checking
- **Google Reverse Image API** for image forensics
- **PostgreSQL** for persistent scan history
- **SHAP / LIME** for ML explainability

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Analyse article URL or text. Body: `{"text": "..."}` |
| GET  | `/api/history` | Returns sample scan history |

### Example Request

```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "SHOCKING: Government HIDING 5G truth! Share before banned!"}'
```

### Example Response

```json
{
  "input": "SHOCKING: Government HIDING 5G truth!...",
  "scores": {
    "fake_probability": 78,
    "credibility_score": 22,
    "risk_level": "high",
    "source_credibility": 0.5,
    "cross_source_agreement": 0.4
  },
  "domain_analysis": { ... },
  "text_analysis": {
    "tactics": [
      { "key": "fear_appeal", "name": "Fear appeal", "severity": "high" },
      { "key": "loaded_language", "name": "Loaded language", "severity": "high" }
    ],
    "signals": {
      "sentiment_bias": 0.72,
      "linguistic_manipulation": 0.65,
      "claim_verifiability": 0.08
    }
  }
}
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Flask |
| NLP | Regex heuristics (→ BERT/RoBERTa) |
| OSINT | Domain pattern analysis (→ Whois, Shodan) |
| Frontend | Vanilla HTML/CSS/JS, Space Grotesk + DM Mono |
| Deployment | Python built-in server (→ Docker + Gunicorn) |
