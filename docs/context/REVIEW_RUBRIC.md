# Running-product review rubric

Use this after visible/gameplay implementation. This is not a checklist to satisfy mechanically; it is a way to find reasons the artifact still feels wrong.

Score each dimension 0–2:

- **0** = clearly fails;
- **1** = understandable but generic/weak;
- **2** = convincing enough to keep and test with users.

A build should not pass taste review with any 0 in Causality, Decision, Interaction Legibility, or Mobile Composition.

| Dimension | Review question |
|---|---|
| Hierarchy | Does the current work object clearly dominate without hiding critical company state? |
| Causality | Can I explain what changed and why within one second of acting? |
| Decision | Is there a real trade-off, or am I just completing a chore? |
| Interaction legibility | Before acting, can I predict what the gesture means and what commitment threshold exists? |
| Tactility | Does resistance, snap, timing, recoil or transition communicate state rather than decorate it? |
| Business truth | Are ARR, cash, risk, deadlines and downstream consequences represented honestly? |
| Attention pressure | Do I feel opportunity cost from choosing this task over another without UI spam? |
| Restraint | Is visual salience scarce and purposeful? |
| Brand specificity | Could this screenshot belong to a generic SaaS/crypto/AI product? If yes, it fails. |
| Object quality | Is the central object/interaction visually specific enough to carry the screen? |
| Motion | Does motion follow anticipation → commitment → response → resolution without blocking control? |
| Copy | Is text specific, human and mechanically clear rather than generic startup jargon? |
| Mobile composition | At 390×844, are work object, primary action and urgent state still first-class rather than miniaturized? |
| Strategic consequence | Would removing this mechanic materially change decisions or build strategy? |
| Rhythm | Is there contrast between calm mastery and pressure, rather than constant alarm? |

## Review procedure

For each visible slice:

1. reset to the intended starting state;
2. play it without reading implementation notes;
3. inspect at 1440×900 and 390×844;
4. deliberately trigger success, failure and pressure states that exist in scope;
5. write the three most important observed problems, ordered by effect on comprehension/decision quality;
6. fix the blocking problems before polishing ornamental details.

Do not reward code sophistication. Judge the artifact the player actually experiences.

## Falsification prompts

Ask:

- What would a new player misunderstand here?
- What part looks polished but does no gameplay work?
- Which mechanic is only present because it was in the specification?
- What can be removed without reducing strategic depth?
- Where is the UI hiding a consequence until after commitment?
- Where would an experienced roguelike player find an obviously dominant or non-decision?
- What would make this feel like a generic web app instead of a game?
