---
target: src/pages/GravityLab.tsx
total_score: 28
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 1
target_identity: "file:D:\\SOURCE CODE\\projectDukaan\\src\\pages\\GravityLab.tsx"
target_fingerprint: "sha256:62e0274255ac519e8c5a82165b53458ed822b9cbfd549e66de3965204ee8ac5d"
target_path: "D:\\SOURCE CODE\\projectDukaan\\src\\pages\\GravityLab.tsx"
timestamp: 2026-10-06T05-35-57Z
slug: src-pages-gravitylab-tsx
---
# Design Critique: Gravity Mode & Interactive Physics Sandbox

**Target**: `src/pages/GravityLab.tsx` & `src/components/Navbar.tsx`  
**Visitor Mode**: Experience / Delight  

## Health Scores

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Navbar switch lacks explicit state readout (Active vs Idle) |
| 2 | Match System / Real World | 4 | Solid physics mapping; electronic component vector icons reflect genuine hardware |
| 3 | User Control and Freedom | 3 | Good clear button on /gravity; navbar mode relies on cursor sweeping to disperse |
| 4 | Consistency and Standards | 3 | Uiverse pill switch is soft/glassmorphic; contrasts with bracketed monospace retro HUD elsewhere |
| 5 | Error Prevention | 4 | Hard cap on particle count (450–600) prevents canvas memory leaks |
| 6 | Recognition Rather Than Recall | 3 | Unlabeled switch on navbar may be confused with a theme/dark-mode toggle |
| 7 | Flexibility and Efficiency | n/a | Experience mode surface; keyboard shortcuts not applicable |
| 8 | Aesthetic and Minimalist Design | 4 | Authentic blueprint grid, phosphor glow, clean component rendering |
| 9 | Error Recovery | 4 | Canvas loops safely recover without crashing React tree |
| 10 | Help and Documentation | 3 | Clear initial guide prompt on /gravity; navbar switch relies on hover tooltip |
| **Total** | | **28/36** | **Strong (78%)** |

## Design Specificity Verdict

- **LLM Assessment**: High authorship. The custom vector electronics (Arduino Uno with pin headers, HC-SR04 ultrasonic eyes, CPU substrate, through-hole ceramic resistors, glowing LEDs) are intimately tailored to ProjectDukaan's identity as an engineering capstone marketplace.
- **Deterministic Scan**: Clean (`0` violations across `GravityLab.tsx` and `Navbar.tsx`).

## Priority Issues

- **[P1] Navbar Switch Context & Visual Harmony**: The switch lacks a visual label in the navbar. Users seeing the pill without context may mistake it for a dark/light mode toggle or store setting.
- **[P2] Mobile Discovery & Parity**: The toggle is hidden on mobile screens, and `/gravity` has no link in mobile navigation or footer.
- **[P3] Saturated Floor Dynamics**: In extended sessions, components pack into a static dense floor. Adding an interactive shake, gentle auto-recycle, or vacuum tool will keep the experience engaging.
