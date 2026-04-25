🔍 Veridect — Fake News & Propaganda Detection Tool
A full-stack fake news and propaganda detection web application
Built as a final year Cybersecurity project using NLP, OSINT techniques, and a custom dark-themed dashboard UI.
Features · Demo · Architecture · Setup · API Docs · Tech Stack · Roadmap

📸 Demo

Paste any article URL or raw text into the search bar to get a full analysis in under 2 seconds.

The dashboard surfaces:

A fake news probability score (0–100%)
Per-signal breakdown (sentiment bias, manipulation index, source credibility, cross-source agreement)
Propaganda tactics detected with severity ratings
OSINT source analysis — domain age, registrar country, fact-check DB status


✨ Features
Core Detection Engine

9 Propaganda Tactic Detectors — Fear appeal, loaded language, false dichotomy, bandwagon, appeal to authority, scapegoating, repetition, black & white thinking, and glittering generality
Sentiment Bias Scoring — Measures emotional manipulation through sensational keyword density, caps abuse, and exclamation mark frequency
Linguistic Manipulation Index — Aggregated NLP signal from tactic count, sensational vocabulary, and structural abnormalities
Claim Verifiability Score — Detects hedge language, anonymous sourcing patterns, and vague attribution

OSINT Source Analysis

Domain Credibility Scoring — Whitelist of 14 established sources (BBC, Reuters, AP, etc.) with baseline trust scores
Suspicious Naming Pattern Detection — Regex-based detection of common disinformation site naming conventions
TLD Risk Profiling — Flags non-standard TLDs (.info, .xyz, .biz, .click, etc.)
Registrar Country Risk — Flags domains registered in common offshore secrecy jurisdictions
Domain Age Analysis — New domains (< 180 days) are treated as higher risk
Fact-Check Database Lookup — Cross-references against known credible source whitelist

Multi-Signal Fusion

Weighted scoring model combining all NLP and OSINT signals into a single risk classification
Four risk tiers: Low · Medium · High · Critical
Per-signal explainability — see exactly which signals drove the final score

UI & Dashboard

Sleek dark-themed single-page app (no framework dependencies — pure HTML/CSS/JS)
Animated risk meters and signal bars
5 built-in views: Dashboard, Article Analyser, Scan History, Propaganda Guide, Domain Lookup
Fully responsive — works on desktop and mobile
Session-based scan history with timeline
Propaganda tactic reference guide with real-world examples


🏗 Architecture
┌─────────────────────────────────────────────────────────────┐
│                        User Input                           │
│              (Article URL or raw text)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Flask REST API                            │
│                    /api/analyze                             │
└────────┬───────────────────────────────┬────────────────────┘
         │                               │
         ▼                               ▼
┌─────────────────────┐      ┌──────────────────────────────┐
│   NLP Analysis      │      │      OSINT Analysis          │
│                     │      │                              │
│  • Tactic detection │      │  • Domain extraction         │
│  • Sentiment score  │      │  • Credibility whitelist     │
│  • Manipulation idx │      │  • Naming pattern check      │
│  • Verifiability    │      │  • TLD / registrar risk      │
│  • Word-level stats │      │  • Age analysis              │
└────────┬────────────┘      └──────────────┬───────────────┘
         │                                   │
         └──────────────┬────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                 Scoring & Fusion Engine                     │
│                                                             │
│   fake_prob = (tactics × 0.30) + (sentiment × 0.20)        │
│             + (manipulation × 0.15) + (source × 0.25)      │
│             + (cross-source × 0.10)                        │
│                                                             │
│   Risk tiers: Low (<35%) · Medium (35-55%) ·               │
│               High (55-75%) · Critical (>75%)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    JSON Response                            │
│   → React/Vanilla JS Dashboard renders results             │
└─────────────────────────────────────────────────────────────┘

📁 Project Structure
veridect/
│
├── app.py                     # Flask backend + full analysis engine
│   ├── PROPAGANDA_TACTICS     # Pattern library for 9 tactic types
│   ├── CREDIBLE_DOMAINS       # Whitelist of trusted news sources
│   ├── analyze_text()         # NLP pipeline function
│   ├── analyze_domain()       # OSINT domain scoring function
│   ├── compute_final_score()  # Weighted fusion model
│   └── /api/analyze           # POST endpoint
│
├── requirements.txt           # Python dependencies
├── README.md                  # This file
│
├── templates/
│   └── index.html             # Single-page app shell (5 views)
│
└── static/
    ├── css/
    │   └── style.css          # Full dark theme + animations
    └── js/
        └── app.js             # Frontend logic, API calls, rendering

🚀 Quick Start
Prerequisites

Python 3.10 or higher
pip

Installation
bash# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/veridect.git
cd veridect

# 2. (Optional) Create a virtual environment
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the development server
python app.py

# 5. Open in your browser
# http://localhost:5000
The server starts on http://localhost:5000 by default.

📡 API Reference
POST /api/analyze
Analyse an article URL or raw text for fake news and propaganda signals.
Request body:
json{
  "text": "https://example.com/article  OR  raw article text here"
}
Response:
json{
  "input": "SHOCKING: Government HIDING the truth...",
  "is_url": false,
  "domain": null,
  "scores": {
    "fake_probability": 78,
    "credibility_score": 22,
    "risk_level": "high",
    "source_credibility": 0.62,
    "cross_source_agreement": 0.38
  },
  "domain_analysis": {
    "score": 31,
    "age": "14 days",
    "age_days": 14,
    "registrar_country": "Panama",
    "in_factcheck_db": false,
    "flags": ["very_new_domain", "offshore_registrar"]
  },
  "text_analysis": {
    "word_count": 42,
    "tactics": [
      { "key": "fear_appeal",     "name": "Fear appeal",     "severity": "high"   },
      { "key": "loaded_language", "name": "Loaded language", "severity": "high"   },
      { "key": "bandwagon",       "name": "Bandwagon",       "severity": "medium" }
    ],
    "signals": {
      "sentiment_bias":        0.72,
      "linguistic_manipulation": 0.65,
      "claim_verifiability":   0.08,
      "sensational_word_count": 4,
      "caps_abuse":            3,
      "exclamation_marks":     2,
      "hedge_language":        0
    }
  },
  "timestamp": "2025-04-25T14:32:01.123456"
}
Example cURL:
bashcurl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "SHOCKING: Government HIDING 5G truth! Share before banned!"}'

GET /api/history
Returns a sample set of pre-populated scan history items for demo purposes.
Response: Array of scan summary objects with input, risk_level, fake_probability, domain, and timestamp fields.

🛠 Tech Stack
LayerCurrent (MVP)Production ExtensionBackendPython, FlaskFlask + Gunicorn + DockerNLP — Tactic DetectionRegex pattern matchingFine-tuned BERT / RoBERTa (HuggingFace)NLP — SentimentKeyword heuristicsVADER, TextBlob, or fine-tuned classifierFact-Check VerificationDomain whitelistClaimBuster API, Snopes RSSDomain IntelligencePattern + heuristicspython-whois, Shodan APIImage ForensicsNot includedGoogle Vision API, TinEye, ExifToolData SourcesHardcoded samplesNewsAPI, GDELT, Reddit (PRAW)ML ExplainabilityPer-signal weightsSHAP, LIMEDatabaseSession memoryPostgreSQL + SQLAlchemyFrontendVanilla HTML/CSS/JSReact or SvelteFontsSpace Grotesk, DM MonoSame

🎯 Propaganda Tactics Detected
TacticSeverityDescriptionFear appeal🔴 HighExploits anxiety or fear to push an agendaLoaded language🔴 HighEmotionally charged words without rational basisScapegoating🔴 HighBlames a group for complex societal problemsFalse dichotomy🟡 MediumPresents only two options, ignoring alternativesBandwagon🟡 MediumEncourages following the alleged majorityAppeal to authority🟡 MediumUnnamed "experts" lending false credibilityBlack & white thinking🟡 MediumAbsolute language eliminating nuanceRepetition🟢 LowRepeated slogans to manufacture credibilityGlittering generality🟢 LowVague, emotionally appealing value words

🔮 Roadmap
Phase 1 — Current MVP ✅

 Flask REST API with NLP analysis engine
 9 propaganda tactic detectors
 OSINT domain scoring
 Multi-signal fusion model
 Full dark-theme single-page dashboard
 Scan history, propaganda guide, domain lookup views

Phase 2 — NLP Upgrade

 Fine-tune roberta-base on FakeNewsNet dataset
 Integrate ClaimBuster API for claim-level verification
 Add sentence-level claim extraction with spaCy NER
 VADER sentiment analysis pipeline
 SHAP explainability for ML model decisions

Phase 3 — OSINT Expansion

 Real Whois lookups via python-whois
 Shodan integration for infrastructure analysis
 NewsAPI / GDELT cross-source agreement
 Reverse image search via Google Vision API
 ExifTool metadata stripping and analysis

Phase 4 — Infrastructure

 PostgreSQL persistent storage
 Docker + docker-compose deployment
 Rate limiting and API key authentication
 Bulk URL analysis endpoint
 Export reports as PDF


📊 Scoring Model
The final fake news probability is computed as a weighted sum of five signals:
fake_probability =
    (tactic_risk        × 0.30)   ← Number and severity of propaganda tactics
  + (sentiment_risk     × 0.20)   ← Emotional manipulation signals
  + (manipulation_risk  × 0.15)   ← Linguistic manipulation index
  + (source_cred_risk   × 0.25)   ← Inverse of domain credibility score
  + (cross_source_risk  × 0.10)   ← Low cross-source agreement penalty
Known credible sources (BBC, Reuters, AP, Nature, etc.) receive a 0.4× dampening factor on the final score regardless of text signals, reflecting that established sources rarely publish fabricated content.

🧪 Sample Inputs to Test
InputExpected Riskhttps://bbc.com/news/worldLowhttps://reuters.comLowSHOCKING: Government HIDING the 5G truth before it gets BANNED!CriticalLeaked documents EXPOSE the billionaire cabal destroying democracyHighNew study links social media algorithms to political polarisationLowhttps://healthtruth24.net/vaccines-side-effects-hiddenHigh

🤝 Contributing
Contributions are welcome, especially in these areas:

Better NLP models — Replace regex patterns with a fine-tuned transformer
New tactic patterns — Add more propaganda technique detectors
Real OSINT integration — Wire up actual Whois and Shodan APIs
Dataset integration — Connect to FakeNewsNet or LIAR benchmark datasets
UI improvements — Network graph visualisation, article highlighting

bash# Fork the repo, then:
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
# Open a Pull Request

📚 References & Datasets

FakeNewsNet Dataset — Labelled fake/real news with social context
LIAR Dataset — 12.8K labelled political statements
GDELT Project — Global news event database
ClaimBuster — Academic claim-checking API
Propaganda Techniques Corpus — NLP4IF shared task dataset
HuggingFace Fake News Models — Pre-trained classifiers
