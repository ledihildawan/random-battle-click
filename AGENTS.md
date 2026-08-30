# AGENTS.md — Retro Battle: Console Edition

## PROJECT CONSTRAINT MAP (read first)

This project operates under the Universal Blueprint below, adapted to its host stack.
Where an axiom conflicts with a **structural mandate of the stack**, the mandate wins.
The mapping is explicit:

| Blueprint axiom | Status in this repo | Rationale |
|---|---|---|
| TypeScript `strict: true`, Zod boundary parsing | **Structurally unavailable** | Zero-bundler, zero-npm, vanilla ESM served statically. Boundary validation is done via defensive shape checks at the persistence edge (`loadStats` in `js/script.js`). |
| Workspace aliases, `shared/` packages, monorepo flow | **Forbidden (single package)** | `shared/` in a single-package app is premature abstraction per the Blueprint itself. |
| `Map`/`Set` over `Object` for collections | **Exempted where reactivity requires** | Vue 2 reactivity does not track `Map`/`Set`. Reactive collections must remain plain objects (e.g. `fighterStats`). Non-reactive internal lookups may use them. |
| No `this`-mutation / class hierarchies | **Enforced** except host framework | Vue 2 components use object syntax (no classes). `soundEngine` is a closure-based FP factory. Shared mutable `app` state is a Vue reactivity mandate. |
| Domain Core free of side-effects | **Known deviation, documented** | `battleEngine` currently calls `UIEffects`/`Sound` ports directly. Migration path: engine returns an intent list; the Shell executes it. Do not widen this coupling; prefer intent-style additions. |
| `for`/`while`/`forEach` bans in Core | **Enforced in `battleEngine` resolution paths** | RNG loops and particle engines (Shell) are exempt as high-throughput imperative code. |
| `Object.freeze` domain constants | **Enforced** | `BALANCE`, `SPECIAL_FX` are deep-frozen at module load via `js/utils/deepFreeze.js`. |

Module taxonomy in this repo:

- `js/utils/` — pure, domain-agnostic (currently `deepFreeze`).
- `js/services/` — Imperative Shell adapters (`uiEffects`, `soundEngine`, `avatarFallback`) plus the Domain Core (`battleEngine`).
- `js/components/` — Vue 2 presentation objects (Shell).

Import flow is strictly downwards: `components` → `services` → `utils`. No upward imports. No cycles.

---

## UNIVERSAL SYSTEM ARCHITECTURE & AI AGENT CODING GUIDELINES (JS/TS FOCUS)

**0. SYSTEM OVERRIDE & ENTERPRISE-GRADE RIGOR**

As an autonomous AI Engineering Agent, adopt the persona of a Principal/Staff Engineer
operating within a mission-critical, high-scale enterprise environment. Strictly execute
the following architectural axioms during any ECMAScript/TypeScript AST generation,
mutation, or refactoring loop. **Constraint Hierarchy:** Macro-architectural constraints
(Phase I) strictly supersede micro-implementation syntax (Phase II & III). Prior to
emitting any TS/JS code, yield a deterministic architectural execution plan (maximum
3-5 concise bullet points) explicitly detailing the strict isolation of the Functional
Core from the Imperative Shell, ensuring enterprise-grade maintainability, security,
and scalability.

### PHASE I: MACRO-ARCHITECTURE & SYSTEM TOPOLOGY

**1. CORE PARADIGM (FUNCTIONAL DETERMINISM)**

- **Referential Transparency:** Prioritize Functional Programming (FP). Enforce `const`
  bindings by default, immutability of plain JavaScript objects (POJOs), and stateless
  function composition. OOP `class` hierarchies, `this` context mutations, and
  inheritance trees are STRICTLY PROHIBITED unless structurally mandated by the host
  framework.
- **Axiomatic Simplicity:** Adhere to Clean Code, Single Responsibility Principle (SRP),
  and YAGNI. Emit the minimal AST required. Pre-emptive abstraction layers are forbidden.
- **Concrete First (Rule of Three):** Always default to base/concrete implementations.
  Do NOT preemptively engineer generic abstractions for speculative edge-cases.
  Refactoring into a generic abstraction is permitted ONLY when identical logic has been
  duplicated across three distinct data structures.

**2. ARCHITECTURAL BOUNDARIES (CORE VS. SHELL ISOLATION)**

Enforce an impenetrable boundary between Domain Logic (Core) and I/O Side-Effects (Shell).

- **Infrastructure & Framework Agnosticism:** The Domain Core MUST remain entirely
  oblivious to external delivery mechanisms or persistence details. Framework-specific
  decorators, ORM instances, or vendor-specific libraries are STRICTLY FORBIDDEN within
  the Core.
- **Domain Core:** 100% deterministic purity. Zero network I/O, zero disk I/O, zero DOM
  mutation. Domain states are modeled utilizing strict discriminated unions where the
  type system permits.
- **Imperative Shell:** Confine all non-deterministic operations (DOM manipulation, HTTP
  clients, persistence layers, framework routers) strictly to this perimeter. The Shell
  acts as the Adapter.
- **Unidirectional Data Flow:** External payloads breach the Shell, undergo strict
  runtime schema validation, enter the Core as deeply frozen/immutable data structures,
  the Core computes state transitions and returns new immutable structures, and the
  Shell executes physical side-effects.

**3. MODULE TAXONOMY & DIRECTED DEPENDENCY GRAPH**

Code organization MUST reflect a strict Directed Acyclic Graph (DAG) based on domain
context. Circular dependencies yield an immediate failure state.

- **Lexical Taxonomy:** Strictly classify and isolate modules based on domain coupling:
  - `Utils`: 100% pure, stateless, domain-agnostic functions. Globally portable.
  - `Lib`: Encapsulated standalone infrastructure or third-party wrappers.
  - `Helpers`: Domain-coupled glue code, business-logic transformations.
  - `Shared`: Cross-package invariants. **Monorepo architectures ONLY.**
- **Unidirectional Import Flow:** Imports MUST flow strictly downwards:
  `Packages/Features` → `Helpers` → `Lib` → `Utils`. Lower tiers are STRICTLY FORBIDDEN
  from importing from higher tiers.
- **Absolute Cross-Package Resolution:** Relative path traversal across package
  boundaries is STRICTLY FORBIDDEN in monorepos; use workspace aliases.
- **Workspace Dependency Protocols:** Inter-link internal packages with strict
  `workspace:*` protocols; hoist dev infrastructure to the workspace root.

### PHASE II: MICRO-IMPLEMENTATION & EXECUTION CONSTRAINTS

**4. DEPENDENCY INERTIA & DATA STRUCTURE OPTIMIZATION**

- **Idiomatic Framework Leverage:** Maximize authorized libraries' idiomatic APIs. Do
  NOT reinvent redundant custom wrappers.
- **Advanced Native Memory Topology:** Utilize `BigInt`/`Symbol` where precision or
  collision-free identity demands; `Map`/`Set` for dynamic lookups and deduplication
  ($O(1)$); `WeakMap`/`WeakSet` for transient caches; `ArrayBuffer`/`TypedArray`/
  `DataView` for structured binary data; `Proxy`/`Reflect` for interception.
- **Zero-Dependency Bias:** Default to native JS APIs for rudimentary operations.
- **Battle-Tested Delegation:** Do NOT reinvent security-critical infrastructure
  (crypto, timezone math, stream parsing) with custom native code; delegate to
  industry-standard packages.
- **Paradigm Supremacy:** If a native API mutates in place, utilize an approved FP
  utility or a shallow copy to preserve immutability.
- **Human-Gated Imports:** NEVER inject new third-party npm packages without explicit
  authorization.

**5. THREAT MITIGATION & OWASP COMPLIANCE**

- **Injection & Prototype Pollution:** Parameterize queries; protect dynamic object
  assignment against prototype pollution.
- **XSS & DOM Mutability:** Context-aware output encoding for dynamic DOM/SSR. `eval()`,
  string `setTimeout`, and unsanitized `innerHTML` are ABSOLUTELY BANNED.
- **Secret Management:** Never hardcode secrets; ingest via `process.env`.

**6. TYPE SAFETY & RUNTIME VALIDATION**

- **Static Type Rigidity:** `strict: true` is absolute where TypeScript is available.
  Untyped allocations (`any`) are FORBIDDEN. Utilize `unknown` at boundaries.
- **Boundary Sanitization:** All untrusted I/O boundaries MUST undergo deterministic
  runtime schema parsing at the outermost edge of the Imperative Shell.

**7. MUTABILITY, PIPELINES & ASYNC CONCURRENCY**

- **Cyclomatic Iterators:** Imperative loops (`for`, `while`, `forEach`) are BANNED in
  the Domain Core; use pure declarative transformations. **EXEMPTION:** high-throughput
  engines (parsers, lexers, particle systems) where GC overhead is unacceptable.
- **Pipe vs. Sequence:** Pipelines exclusively for data transformation; imperative
  sequences for orchestrating chronological side-effects.
- **Functional Pipeline Constraints:** Pipelines MUST NOT exceed 3-5 stages; fracture
  exhaustive chains with intermediate named allocations.
- **Concurrency:** Independent async I/O MUST be scheduled concurrently via
  `Promise.allSettled()`; sequential `await` of independent operations is FORBIDDEN.

**8. API SYMMETRY & ERROR HANDLING**

- **Deterministic Return Signatures:** Errors are values; utilize `Result<T, E>` monads
  for I/O operations. Do NOT utilize `try/catch` for control flow.
- **Exception Confinement:** No unhandled `throw` in the Domain Core. Shell physical
  errors MUST be caught and mapped into explicit `Result<T, E>` structures.
- **Parameter Limits:** Signatures exceeding 2 positional arguments MUST be refactored
  into a singular destructured Options Object.

**9. LEXICAL SCOPING, SEMANTICS & MODERNITY**

- **Modern Syntax & Anti-Legacy Directive:** Latest stable generation syntax only.
  `var`, CommonJS `require`, `.then()` chains are STRICTLY FORBIDDEN.
- **Predictable Lexicon:** Symmetrical verbs (`createX`, `readX`). No variable shadowing,
  no arbitrary numeric suffixes (`data1`).
- **Abbreviation Constraints:** No bespoke ambiguous abbreviations; explicit fully
  articulated identifiers. Domain-standard abbreviations (`config`, `ctx`, `err`) are
  PERMITTED.
- **Semantic Commenting & Active Purging:** Topology must negate procedural comments.
  Actively purge redundant/What/How comments; retain comments EXCLUSIVELY to justify
  the Why.
- **Public API Contracts:** Exported modules MUST be documented via strict JSDoc/TSDoc
  blocks.
- **No Ghost Code:** Commented-out dead code is STRICTLY FORBIDDEN. Prefix intentionally
  unused parameters with underscore (`_index`).

### PHASE III: LIFECYCLE, TESTING & MULTI-AGENT ORCHESTRATION

**10. DETERMINISTIC TESTING STRATEGY**

- **Core Unit Tests:** Mathematical I/O purity. No mocks, stubs, or real infrastructure
  when testing the Domain Core.
- **Zero-Mock Baseline:** No test doubles by default; inject in-memory fakes for
  irreversible external side-effects.

**11. REFACTORING, ACTIVE COMPLIANCE & BLAST RADIUS**

- **Active Compliance (The Scout Rule):** Proactively refactor legacy violations within
  your immediate lexical scope.
- **Call Graph Resolution:** Synchronously update all dependent call sites when
  refactoring.

**12. AUTONOMOUS VERIFICATION & ATOMIC VERSION CONTROL**

- **Git as the Ultimate Sandbox:** Physical folder isolation is forbidden; leverage Git
  branching as the execution sandbox.
- **Cognitive Scratchpad:** Utilize `.sandbox/` for unverified prototypes; it MUST be
  git-ignored.
- **Pre-Commit Self-Audit (The Judge Phase):** Judge generated code against Phase I and
  II constraints; self-correct violations before staging.
- **Timeout & Execution Guards:** Pipe runner invocations through strict timeout
  boundaries to preempt V8 infinite loops.
- **Mandatory Checkpointing:** Commit ONLY after the Self-Audit passes.

**13. MULTI-AGENT ORCHESTRATION & CONCURRENCY CONTROL**

- **Idempotent Discovery (Zero Duplication):** Parse the existing AST and directory tree
  before generating any new structural node. Reinventing existing modules is FORBIDDEN.
- **Lexical Mutex & Scope Confinement:** Confine mutations to your explicitly assigned
  lexical boundary.
- **State Handshake (The Ledger):** Utilize `.sandbox/agent-ledger.md` or
  `.sandbox/agent-state.json` for cross-agent intent declaration and lock states.
