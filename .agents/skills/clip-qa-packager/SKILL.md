---
name: clip-qa-packager
description: Pre-publish QA verification, frame inspection, caption spelling audit, hook title overlay generation, and platform campaign compliance validation.
---

# Clip QA & Packaging Auditor: Pre-Publish Playbook

This skill establishes the mandatory pre-flight audit every rendered clip must pass before being published to TikTok, YouTube Shorts, or Instagram Reels.

---

## 1. Frame-Level Visual Audit
Before outputting any clip as final:
* **Aspect Ratio Verification:** Confirm strict vertical 9:16 ($1080\times1920\text{ px}$) canvas.
* **Safe Zone Contact Sheet:** Generate a 9-frame contact sheet (`0.0s`, `1.5s`, `5.0s`, `10.0s`, `15.0s`, `25.0s`, `35.0s`, `45.0s`, end) to verify:
  1. No text or logos in the bottom $320\text{px}$ or right $140\text{px}$.
  2. Speaker's eyes and face remain unobstructed by captions.
  3. No black letterboxing or unwanted pillarboxing.

---

## 2. On-Screen Hook Title Header (First 3.0 Seconds)
* Every clip must render a **bold 3 to 5-word hook title** at the top of the frame ($Y: 220\text{px}\text{–}320\text{px}$) during the opening $0.0\text{s}–3.0\text{s}$.
* **Style:**
  - High-impact yellow/white text inside a translucent black pill banner (`rgba(0,0,0,0.7)`).
  - Examples: `"HE REALLY DID THIS?! 💀"`, `"GTA 6 SECRET COP CHASE"`, `"THE MOMENT HE KNEW..."`.

---

## 3. Audio & Transcript Spelling Audit
Whisper often misinterprets slang, gaming names, and streamer tags. Verify and fix:
* Streamer names: "Foltyn" (never "Faulty", "Falton", or "Folton").
* Game names & terms: "GTA 6", "Rockstar", "Vice City", "Lucia", "Jason", "NPC".
* Cursing / Platform Censorship: Add asterisks or bleeps if required for monetization (`f***`, `s***`).

---

## 4. Campaign Compliance Checklist (Foltyn GTA Campaign)
No clip may be packaged without passing this 5-point gate:
1. **First-Line Creator Tags:**
   - **TikTok (TT):** `@realkfoltyn`
   - **YouTube (YT):** `@FoltynFamily`
   - **Instagram (IG):** `@realfoltyn`
2. **Zero Negativity:** Tone must be entertaining, hype, or humorous. Zero disparaging comments toward Foltyn.
3. **Zero External Sponsor Logos:** No watermarks or logos for betting/crypto sites (Stake, Rainbet, Kalshi, etc.).
4. **Unique Caption & Title:** Caption must be custom-written to avoid duplicate spam flags and optimize algorithm search terms (SEO).
5. **Engagement Potential Audit:** Hook must possess high comment-bait or share-trigger to surpass the required **$0.75\%$ engagement threshold**.
