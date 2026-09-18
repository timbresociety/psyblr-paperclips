# Discovery before execution

Codex must distinguish exploratory conversation from an approved implementation request.

## Default interpretation

A prompt that asks to rethink, explore, brainstorm, compare, critique, improve, define, clarify, consider, or decide a product/game/design direction is **DISCOVERY**, not permission to edit code.

A prompt becomes **EXECUTION** only when the user explicitly asks to build, implement, apply, modify, code, execute, or proceed from an approved build contract.

When uncertain, remain read-only and clarify the decision rather than starting a broad implementation.

## Discovery response

For a consequential gameplay, UX, visual, architecture, or product question, return only what is useful to make the decision:

1. intended player/user outcome;
2. settled constraints from current context;
3. assumptions that would otherwise be invented;
4. unresolved decisions that materially change the artifact;
5. 2–3 materially different alternatives when useful;
6. strongest failure mode / counterargument;
7. cheapest prototype or observation that could falsify the preferred direction.

Do not create code, new canon, exhaustive documentation, or implementation tasks during discovery unless explicitly requested.

## Build-contract gate

Before substantial visible/gameplay implementation, establish a concise build contract with:

- player outcome;
- starting state;
- what is visible;
- exact interaction sequence;
- semantic state transitions;
- settled decisions;
- allowed implementation discretion;
- explicit non-goals;
- visual/reference evidence;
- observable acceptance criteria;
- empirical failure condition.

Keep the contract small. Its job is to prevent consequential interpretation errors, not to predict every implementation detail.

## Execution

Once the user explicitly approves or supplies the contract and asks to execute:

- the contract is immediate task authority;
- broader context resolves dependencies but does not expand scope;
- reversible implementation choices can be made autonomously;
- unresolved product decisions that materially change player behavior must be surfaced rather than silently canonicalized;
- do not respond to ambiguity by writing more architecture or context documents.

For visible work, implementation is incomplete until the running product has been interacted with and visually inspected.
