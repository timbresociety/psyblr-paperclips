# Design System: Obsidian Cockpit (Apple-Inspired AI CEO Terminal)

## Visual World & Metaphor
The visual language is **Obsidian Cockpit (Apple HIG Edition)**—a high-density, mission-critical operations dashboard blending the ergonomics of Apple Pro interfaces with the precision of Linear and Bloomberg Terminal.

---

## Palette & Surface Tokens

| Token | Hex / Value | Semantic Role |
| :--- | :--- | :--- |
| `bg-cockpit-base` | `#000000` | Deep OLED obsidian backdrop |
| `bg-cockpit-panel` | `#121214` / `#161618` | HUD ribbons, titlebar & sidebar frosted glass |
| `bg-cockpit-card` | `#1c1c1e` | Primary container & telemetry cards |
| `bg-cockpit-card-hover` | `#242426` | Interactive hover surface |
| `border-cockpit` | `rgba(255, 255, 255, 0.08)` | Hairline razor border (1px) |
| `border-cockpit-active` | `rgba(10, 132, 255, 0.4)` | Apple Blue focus & active selection border |
| `system-blue` (Primary) | `#0a84ff` / `#0071e3` | Universal interactive accent: tabs, buttons, links, tools, badges, roadmap |
| `signal-green` | `#30d158` | Positive telemetry signals: MRR/ARR, Cash Treasury, 1 Human CEO, High Trust (≥60%) |
| `signal-yellow` | `#ff9f0a` / `#ffd60a` | Warning signals: Founder Focus energy, Ticket Backlog warning, Medium Trust (30-59%) |
| `signal-red` | `#ff453a` | Critical/Danger signals: Severe Tech Debt (≥70%), Low Trust (<30%), Compute Throttling, Destructive actions |

---

## Typography & Hierarchy

- **Display & Titles**: Apple system font (`-apple-system`, `SF Pro Display`, `Inter`) with tight tracking (`tracking-tight font-semibold`).
- **Data & Telemetry**: Monospace tabular figures (`font-mono tabular-nums font-semibold`).
- **Micro-Labels**: `text-[10px] uppercase font-medium tracking-wider text-white/40`.
- **Status Pills**: Compact rounded badges with subtle status beacon dots.

---

## Cockpit Ergonomics & Interaction Rules

1. **Unified Color Discipline**: No rainbow clutter. Everything interactive or structural is Apple Blue or neutral dark surfaces. Red, Yellow, and Green are strictly reserved for state signals.
2. **Keyboard-First Controls**:
   - `⌘K` / `Ctrl+K`: Global CEO Command Palette.
   - `[1]` through `[0]`: Direct screen switching.
   - `[C]`, `[P]`, `[S]`, `[T]`: Instant founder action shortcuts.
3. **Live Status Radar**: Subtle status beacon dots indicate live simulation loops.
4. **Zero AI Slop**: Clean 1px hairlines, frosted glass backdrops (`backdrop-blur-2xl`), precise contrast ratios, and deliberate Apple Blue accents.

