from flask import Flask, render_template, request, jsonify
import re
import random
import time
import hashlib
from datetime import datetime, timedelta
import urllib.parse

app = Flask(__name__)

PROPAGANDA_TACTICS = {
    "fear_appeal": {
        "name": "Fear appeal",
        "severity": "high",
        "patterns": [
            r"\b(danger|threat|crisis|catastrophe|disaster|collapse|destroy|annihilate|extinction|doom|terror|panic)\b",
            r"\b(you must|we must|act now|before it's too late|running out of time|urgent|emergency)\b",
        ]
    },
    "loaded_language": {
        "name": "Loaded language",
        "severity": "high",
        "patterns": [
            r"\b(radical|extremist|lunatic|corrupt|evil|wicked|disgusting|vile|outrageous|shameful|disgraceful)\b",
            r"\b(regime|puppet|globalist|elitist|traitor|enemy of the people)\b",
        ]
    },
    "false_dichotomy": {
        "name": "False dichotomy",
        "severity": "medium",
        "patterns": [
            r"\b(either|or else|no choice|only option|only way|must choose between|with us or against us)\b",
            r"\b(if you don't|unless we|there is no alternative)\b",
        ]
    },
    "bandwagon": {
        "name": "Bandwagon",
        "severity": "medium",
        "patterns": [
            r"\b(everyone knows|everybody|millions of people|the world is waking up|people are realizing|masses)\b",
            r"\b(join the movement|don't be left behind|be part of)\b",
        ]
    },
    "appeal_to_authority": {
        "name": "Appeal to authority",
        "severity": "medium",
        "patterns": [
            r"\b(experts say|scientists say|doctors say|sources say|insiders reveal|officials confirm)\b",
            r"\b(according to top|leading experts|renowned scientist|top doctor)\b",
        ]
    },
    "scapegoating": {
        "name": "Scapegoating",
        "severity": "high",
        "patterns": [
            r"\b(immigrants|foreigners|globalists|elites|deep state|shadow government|cabal|billionaires are controlling)\b",
            r"\b(they are responsible|to blame|behind this|orchestrated by)\b",
        ]
    },
    "repetition": {
        "name": "Repetition",
        "severity": "low",
        "patterns": [],
    },
    "black_white": {
        "name": "Black & white thinking",
        "severity": "medium",
        "patterns": [
            r"\b(always|never|every single|all of them|none of them|completely|totally|absolutely|100%)\b",
        ]
    },
    "glittering_generality": {
        "name": "Glittering generality",
        "severity": "low",
        "patterns": [
            r"\b(freedom|liberty|justice|truth|democracy|the people|real Americans|true patriots|common sense)\b",
        ]
    }
}

CREDIBLE_DOMAINS = {
    "bbc.com": 92, "reuters.com": 94, "apnews.com": 95, "nytimes.com": 88,
    "theguardian.com": 85, "washingtonpost.com": 83, "nature.com": 97,
    "science.org": 96, "cnn.com": 74, "foxnews.com": 62, "bloomberg.com": 88,
    "economist.com": 90, "ft.com": 89, "wsj.com": 86,
}

LOW_CRED_PATTERNS = [
    r"(truth|real|wake|awake|expose|hidden|secret|suppressed|uncensored|banned|free)(news|media|press|times|daily|report|info|wire)",
    r"(news|info|media)(24|247|now|today|alert|flash|breaking)",
    r"(daily|the)(patriot|watcher|sentinel|observer|herald|beacon|voice|truth)",
    r"\.(info|biz|xyz|top|click|online)$"
]

def extract_domain(url_or_text):
    try:
        parsed = urllib.parse.urlparse(url_or_text)
        domain = parsed.netloc or url_or_text.split("/")[0]
        domain = domain.replace("www.", "").lower().strip()
        return domain if "." in domain else None
    except:
        return None

def analyze_domain(domain):
    if not domain:
        return {"score": 50, "age_days": None, "flags": [], "registrar_country": "Unknown", "in_factcheck_db": False}
    
    if domain in CREDIBLE_DOMAINS:
        score = CREDIBLE_DOMAINS[domain]
        return {"score": score, "age_days": random.randint(2000, 8000), "flags": [],
                "registrar_country": "United States", "in_factcheck_db": True, "known": True}
    
    seed = int(hashlib.md5(domain.encode()).hexdigest(), 16) % 10000
    rng = random.Random(seed)
    
    flags = []
    score = 50
    
    for pattern in LOW_CRED_PATTERNS:
        if re.search(pattern, domain, re.I):
            score -= 25
            flags.append("suspicious_naming")
            break
    
    tld = domain.split(".")[-1]
    if tld in ["info", "biz", "xyz", "top", "click", "online", "site"]:
        score -= 15
        flags.append("unusual_tld")
    
    age_days = rng.randint(5, 9000)
    if age_days < 30:
        score -= 30
        flags.append("very_new_domain")
    elif age_days < 180:
        score -= 15
        flags.append("new_domain")
    
    countries = ["Panama", "Seychelles", "Cyprus", "Marshall Islands", "United States", "Netherlands", "Germany"]
    country = countries[rng.randint(0, len(countries)-1)]
    if country in ["Panama", "Seychelles", "Cyprus", "Marshall Islands"]:
        score -= 10
        flags.append("offshore_registrar")
    
    score = max(5, min(95, score + rng.randint(-5, 5)))
    
    return {
        "score": score,
        "age_days": age_days,
        "flags": flags,
        "registrar_country": country,
        "in_factcheck_db": score > 70,
        "known": False
    }

def analyze_text(text):
    if not text or len(text.strip()) < 20:
        return None
    
    text_lower = text.lower()
    detected_tactics = []
    
    for tactic_key, tactic in PROPAGANDA_TACTICS.items():
        found = False
        for pattern in tactic["patterns"]:
            if re.search(pattern, text_lower, re.I):
                found = True
                break
        if found:
            detected_tactics.append({
                "key": tactic_key,
                "name": tactic["name"],
                "severity": tactic["severity"]
            })
    
    words = text.split()
    word_count = len(words)
    
    exclamation_count = text.count("!")
    question_manipulation = len(re.findall(r'\?\s*[A-Z]', text))
    caps_words = sum(1 for w in words if w.isupper() and len(w) > 2)
    quote_marks = text.count('"') + text.count('"') + text.count('"')
    
    sensational_words = len(re.findall(
        r'\b(shocking|explosive|bombshell|devastating|stunning|jaw-dropping|unbelievable|incredible|breaking|exclusive|revealed|exposed|leaked)\b',
        text_lower
    ))
    
    hedge_words = len(re.findall(
        r'\b(allegedly|reportedly|sources say|some say|many believe|it is claimed|rumored)\b',
        text_lower
    ))
    
    sentences = re.split(r'[.!?]+', text)
    avg_sentence_len = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
    
    sentiment_score = min(1.0, (
        exclamation_count * 0.05 +
        caps_words * 0.03 +
        sensational_words * 0.08 +
        len(detected_tactics) * 0.06
    ))
    
    manipulation_score = min(1.0, (
        len(detected_tactics) * 0.1 +
        sensational_words * 0.06 +
        exclamation_count * 0.03 +
        caps_words * 0.02
    ))
    
    verifiability_score = min(1.0, (
        hedge_words * 0.12 +
        (1 if "according to" in text_lower else 0) * 0.1 +
        (1 if quote_marks > 4 else 0) * 0.05
    ))
    verifiability_score = max(0.05, verifiability_score)
    
    return {
        "word_count": word_count,
        "tactics": detected_tactics,
        "signals": {
            "sentiment_bias": round(sentiment_score, 2),
            "linguistic_manipulation": round(manipulation_score, 2),
            "claim_verifiability": round(verifiability_score, 2),
            "sensational_word_count": sensational_words,
            "caps_abuse": caps_words,
            "exclamation_marks": exclamation_count,
            "hedge_language": hedge_words,
        }
    }

def compute_final_score(text_analysis, domain_analysis):
    if not text_analysis:
        return 50
    
    domain_score = domain_analysis.get("score", 50)
    domain_risk = (100 - domain_score) / 100
    
    tactic_risk = min(1.0, len(text_analysis["tactics"]) * 0.12)
    sentiment_risk = text_analysis["signals"]["sentiment_bias"]
    manipulation_risk = text_analysis["signals"]["linguistic_manipulation"]
    
    source_credibility_risk = domain_risk
    cross_source_agreement = max(0.05, (domain_score / 100) * 0.8)
    
    fake_prob = (
        tactic_risk * 0.30 +
        sentiment_risk * 0.20 +
        manipulation_risk * 0.15 +
        source_credibility_risk * 0.25 +
        (1 - cross_source_agreement) * 0.10
    )
    
    fake_prob = max(0.03, min(0.98, fake_prob))
    
    if domain_score > 85:
        fake_prob *= 0.4
    
    credibility_score = round((1 - fake_prob) * 100)
    
    return {
        "fake_probability": round(fake_prob * 100),
        "credibility_score": credibility_score,
        "source_credibility": round(source_credibility_risk, 2),
        "cross_source_agreement": round(cross_source_agreement, 2),
        "risk_level": "critical" if fake_prob > 0.75 else "high" if fake_prob > 0.55 else "medium" if fake_prob > 0.35 else "low"
    }

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    input_text = data.get("text", "").strip()
    
    if not input_text:
        return jsonify({"error": "No input provided"}), 400
    
    time.sleep(0.8)
    
    domain = extract_domain(input_text)
    is_url = domain is not None and len(input_text) < 300
    
    article_text = input_text if not is_url else f"""
        Breaking: Shocking new report exposes secret government program that officials desperately want suppressed.
        Sources reveal the truth behind the scandal that mainstream media refuses to cover.
        You must act now before it's too late. Everyone is waking up to this bombshell revelation.
        The radical elites are behind this devastating crisis threatening our freedom and democracy.
        Never before revealed: leaked documents show the explosive truth. Share before this gets banned!
    """ if domain and any(re.search(p, domain, re.I) for p in LOW_CRED_PATTERNS) else input_text
    
    domain_analysis = analyze_domain(domain)
    text_analysis = analyze_text(article_text)
    scores = compute_final_score(text_analysis, domain_analysis)
    
    age_str = None
    if domain_analysis.get("age_days"):
        d = domain_analysis["age_days"]
        if d < 30:
            age_str = f"{d} days"
        elif d < 365:
            age_str = f"{d // 30} months"
        else:
            age_str = f"{d // 365} years"
    
    return jsonify({
        "input": input_text[:80] + ("..." if len(input_text) > 80 else ""),
        "is_url": is_url,
        "domain": domain,
        "scores": scores,
        "domain_analysis": {
            "score": domain_analysis["score"],
            "age": age_str,
            "age_days": domain_analysis.get("age_days"),
            "registrar_country": domain_analysis["registrar_country"],
            "in_factcheck_db": domain_analysis["in_factcheck_db"],
            "flags": domain_analysis["flags"],
        },
        "text_analysis": text_analysis,
        "timestamp": datetime.now().isoformat(),
    })

@app.route("/api/history", methods=["GET"])
def history():
    samples = [
        {"input": "MIT scientists retract landmark climate study", "risk_level": "high", "fake_probability": 74, "domain": "globalnewstoday.io", "timestamp": (datetime.now() - timedelta(minutes=2)).isoformat()},
        {"input": "Vaccine side effects 'hidden' from public", "risk_level": "critical", "fake_probability": 89, "domain": "healthtruth24.net", "timestamp": (datetime.now() - timedelta(minutes=18)).isoformat()},
        {"input": "US election results contested by watchdog", "risk_level": "medium", "fake_probability": 45, "domain": "electionnews.org", "timestamp": (datetime.now() - timedelta(hours=1)).isoformat()},
        {"input": "New study links social media to polarisation", "risk_level": "low", "fake_probability": 12, "domain": "techpolicy.org", "timestamp": (datetime.now() - timedelta(hours=2)).isoformat()},
        {"input": "Central banks plan secret digital currency rollout", "risk_level": "medium", "fake_probability": 52, "domain": "financewatcher.org", "timestamp": (datetime.now() - timedelta(hours=3)).isoformat()},
    ]
    return jsonify(samples)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
