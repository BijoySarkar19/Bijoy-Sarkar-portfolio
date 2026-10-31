"use client";

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Info, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { playCyberClick, playGameMoveSound, playTactilePop } from "@/lib/audio";

type Direction = "left" | "right" | "up" | "down";
type Card = { id: number; face: string };

const SIZE = 4;
const SYMBOLS = ["✦", "◈", "◉", "⌘", "△", "⬡"];
const INITIAL_CARDS = ["◈", "✦", "△", "⬡", "⌘", "◉", "✦", "⌘", "⬡", "◈", "◉", "△"];

/* ── 2048 game logic ───────────────────────────────────── */

function emptyGrid() {
  return Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0));
}

function addTile(source: number[][]) {
  const grid = source.map((row) => [...row]);
  const empty: [number, number][] = [];
  grid.forEach((row, y) => row.forEach((value, x) => { if (value === 0) empty.push([y, x]); }));
  if (empty.length === 0) return grid;
  const [y, x] = empty[Math.floor(Math.random() * empty.length)];
  grid[y][x] = Math.random() < 0.9 ? 2 : 4;
  return grid;
}

function newGrid() {
  return addTile(addTile(emptyGrid()));
}

function initialGrid() {
  const grid = emptyGrid();
  grid[1][2] = 2;
  grid[2][1] = 2;
  return grid;
}

function compact(line: number[]) {
  const values = line.filter((value) => value !== 0);
  let gained = 0;
  for (let index = 0; index < values.length - 1; index += 1) {
    if (values[index] === values[index + 1]) {
      values[index] *= 2;
      gained += values[index];
      values.splice(index + 1, 1);
    }
  }
  while (values.length < SIZE) values.push(0);
  return { values, gained };
}

function slide(source: number[][], direction: Direction) {
  const result = emptyGrid();
  let gained = 0;
  for (let lineIndex = 0; lineIndex < SIZE; lineIndex += 1) {
    let line = direction === "left" || direction === "right"
      ? [...source[lineIndex]]
      : source.map((row) => row[lineIndex]);
    if (direction === "right" || direction === "down") line.reverse();
    const merged = compact(line);
    gained += merged.gained;
    line = merged.values;
    if (direction === "right" || direction === "down") line.reverse();
    for (let cell = 0; cell < SIZE; cell += 1) {
      if (direction === "left" || direction === "right") result[lineIndex][cell] = line[cell];
      else result[cell][lineIndex] = line[cell];
    }
  }
  return { grid: result, gained };
}

function gridsMatch(first: number[][], second: number[][]) {
  return first.every((row, y) => row.every((value, x) => value === second[y][x]));
}

function noMoves(grid: number[][]) {
  if (grid.some((row) => row.includes(0))) return false;
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (grid[y][x] === grid[y + 1]?.[x] || grid[y][x] === grid[y][x + 1]) return false;
    }
  }
  return true;
}

function shuffledCards(): Card[] {
  return [...SYMBOLS, ...SYMBOLS]
    .map((face, id) => ({ face, id }))
    .sort(() => Math.random() - 0.5);
}

/* ── Game info content ─────────────────────────────────── */

const INFO_2048 = {
  type: "2048" as const,
  title: "2048 — Number Puzzle",
  eyebrow: "Rulebook & Strategy",
  objective: "Merge matching numbered tiles to build a tile with the value 2048 or higher.",
  howToPlay: [
    "Swipe or press arrow keys (↑, ↓, ←, →) or tap on-screen direction buttons.",
    "All tiles slide simultaneously to the farthest available cell in that direction.",
    "When two identical numbers collide, they merge into a single tile with double the value (2+2=4, 4+4=8, 8+8=16).",
    "Each successful move spawns a new random 2 or 4 tile in an empty spot.",
  ],
  controls: "Keyboard: Arrow Keys (↑ ↓ ← →)  ·  Touch/Mouse: Direction control buttons below grid",
  howToWin: "Reach the 2048 tile! Once you hit 2048, you can keep playing to achieve 4096 or an all-time personal high score.",
  gameOver: "The board fills completely with all 16 tiles and no adjacent identical numbers can merge in any direction.",
  tips: [
    "Anchor your highest tile strictly into one corner (e.g. bottom-right).",
    "Build a descending snake chain along the outer edge (e.g. 512, 256, 128, 64).",
    "Never swipe in the opposite direction of your corner anchor.",
    "Keep empty cells open so new tiles don't disrupt your chain.",
  ],
};

const INFO_MEMORY = {
  type: "memory" as const,
  title: "Signal Pairs — Memory Challenge",
  eyebrow: "Rulebook & Memorization",
  objective: "Uncover and match all 6 pairs of cosmic cyber-signals in the least number of turns.",
  howToPlay: [
    "Tap any face-down card marked with '?' to reveal its hidden glyph.",
    "Tap a second card. If both glyphs match, they lock open as a matched pair!",
    "If they differ, both flip back face-down after a brief moment.",
    "Memorize the positions of glyphs as you reveal them.",
    "Each 2 cards flipped counts as exactly 1 turn.",
  ],
  controls: "Touch or Click any face-down card to flip it over  ·  🔄 Reset button to reshuffle",
  howToWin: "Find and lock all 6 signal pairs (12 cards total). Aim for a perfect 6 turns!",
  gameOver: "You cannot lose! The round ends once all 6 pairs are successfully discovered.",
  tips: [
    "Focus on quadrants: memorize glyphs in groups of 4.",
    "Avoid blind guessing once you have seen 3 or more symbols.",
    "Target cards you have never seen first to map the unknown territory.",
    "Connect matching pairs immediately once both locations are known.",
  ],
};

const SUGGESTIONS_2048 = [
  "💡 Move tiles toward your favorite corner to keep high values safe!",
  "💡 Try pushing tiles left or down to consolidate space.",
  "💡 Check if two adjacent numbers can merge before swiping.",
  "💡 Avoid moving upward if your highest tile is on the bottom row.",
  "💡 Keep the board tidy by merging small 2s and 4s quickly.",
];

const SUGGESTIONS_MEMORY = [
  "💡 Think back to the cards you flipped earlier!",
  "💡 Uncover an unrevealed card to scout new symbols.",
  "💡 If you saw a match earlier, now is the time to pair it up!",
  "💡 Focus on the top row first to build an easy mental map.",
  "💡 Take your time — accuracy matters more than speed!",
];

/* ── Interactive How-to-Play Illustrations ──────────────── */

function HowToPlayIllustration({ type }: { type: "2048" | "memory" }) {
  if (type === "2048") {
    return (
      <div className="game-illustration-box">
        <div className="illus-label">🎮 HOW TO PLAY DIAGRAM</div>
        <div className="illus-2048-keys">
          <div className="illus-key-row">
            <span className="illus-key">↑</span>
          </div>
          <div className="illus-key-row">
            <span className="illus-key">←</span>
            <span className="illus-key">↓</span>
            <span className="illus-key">→</span>
          </div>
          <span className="illus-action-note">Press arrow keys or tap controls to slide &amp; merge</span>
        </div>
        <div className="illus-merge-demo">
          <span className="illus-tile">2</span>
          <span className="illus-plus">+</span>
          <span className="illus-tile">2</span>
          <span className="illus-arrow">➔</span>
          <span className="illus-tile illus-tile-merged">4</span>
          <span className="illus-arrow">➔➔</span>
          <span className="illus-tile illus-tile-goal">2048</span>
        </div>
      </div>
    );
  }

  return (
    <div className="game-illustration-box">
      <div className="illus-label">🎮 HOW TO PLAY DIAGRAM</div>
      <div className="illus-memory-demo">
        <div className="illus-card-step">
          <span className="illus-card illus-card-back">?</span>
          <small>1. Flip first</small>
        </div>
        <span className="illus-plus">+</span>
        <div className="illus-card-step">
          <span className="illus-card illus-card-back">?</span>
          <small>2. Flip second</small>
        </div>
        <span className="illus-arrow">➔</span>
        <div className="illus-card-step">
          <div className="illus-matched-pair">
            <span className="illus-card illus-card-face">✦</span>
            <span className="illus-card illus-card-face">✦</span>
          </div>
          <small>Match found!</small>
        </div>
      </div>
      <span className="illus-action-note">Find all 6 pairs (12 cards) with minimum turns</span>
    </div>
  );
}

/* ── Bounded In-Card Info Overlay (Ends strictly inside game card box) ── */

function GameInfoOverlay({
  info,
  isOpen,
  onClose,
}: {
  info: typeof INFO_2048 | typeof INFO_MEMORY;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="game-info-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Instructions for ${info.title}`}
      onMouseLeave={onClose}
    >
      <div className="game-info-overlay-header">
        <div>
          <span className="game-info-eyebrow">{info.eyebrow}</span>
          <h4 className="game-info-heading">{info.title}</h4>
        </div>
        <button
          className="game-info-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close game instructions"
        >
          <X size={16} />
        </button>
      </div>

      <div className="game-info-scroll-content">
        <HowToPlayIllustration type={info.type} />

        <div className="game-info-block">
          <h5>🎯 Objective</h5>
          <p>{info.objective}</p>
        </div>

        <div className="game-info-block">
          <h5>🕹️ How to Play</h5>
          <ul>
            {info.howToPlay.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>

        <div className="game-info-block">
          <h5>🎮 Controls</h5>
          <p>{info.controls}</p>
        </div>

        <div className="game-info-block">
          <h5>🏆 How to Finish / Win</h5>
          <p>{info.howToWin}</p>
        </div>

        <div className="game-info-block">
          <h5>❌ Game Over Conditions</h5>
          <p>{info.gameOver}</p>
        </div>

        <div className="game-info-block">
          <h5>💡 Pro Tips &amp; Strategies</h5>
          <ul>
            {info.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="game-info-overlay-footer">
        <span>Hover outside or click ✕ to return to game</span>
      </div>
    </div>
  );
}

function GameTimer({ startTime }: { startTime: number | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 200);
    return () => window.clearInterval(id);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <span className="game-timer" title="Elapsed game time">
      ⏱ {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

function IdleSuggestion({ suggestion }: { suggestion: string | null }) {
  if (!suggestion) return null;
  return <p className="game-idle-suggestion" aria-live="polite">{suggestion}</p>;
}

function useIdleSuggestion(suggestions: string[], isStarted: boolean) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const lastInputRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const recordInput = useCallback(() => {
    lastInputRef.current = Date.now();
    setSuggestion(null);
  }, []);

  const resetIdle = useCallback(() => {
    setSuggestion(null);
    lastInputRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!isStarted) return;
    timerRef.current = setInterval(() => {
      if (Date.now() - lastInputRef.current >= 10000) {
        setSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
      }
    }, 2000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted, suggestions]);

  return { suggestion, recordInput, resetIdle };
}

/* ── 2048 Game ─────────────────────────────────────────── */

export function NumberMergeGame({ compactMode = false }: { compactMode?: boolean }) {
  const [grid, setGrid] = useState<number[][]>(initialGrid);
  const [score, setScore] = useState(0);
  const [bestTile, setBestTile] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const { suggestion, recordInput, resetIdle } = useIdleSuggestion(SUGGESTIONS_2048, startTime !== null);

  function reset() {
    setGrid(newGrid());
    setScore(0);
    setBestTile(0);
    setStartTime(null);
    resetIdle();
  }

  function move(direction: Direction) {
    if (!startTime) setStartTime(Date.now());
    recordInput();
    const { grid: moved, gained } = slide(grid, direction);
    if (gridsMatch(grid, moved)) return;
    playGameMoveSound();
    const next = addTile(moved);
    setGrid(next);
    setScore((current) => current + gained);
    setBestTile((current) => Math.max(current, ...next.flat()));
  }

  function handleBoardKey(event: KeyboardEvent<HTMLDivElement>) {
    const direction = ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" } as const)[event.key as "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown"];
    if (!direction) return;
    event.preventDefault();
    move(direction);
  }

  const arrows: { direction: Direction; label: string; icon: typeof ArrowUp }[] = [
    { direction: "up", label: "Move tiles up", icon: ArrowUp },
    { direction: "left", label: "Move tiles left", icon: ArrowLeft },
    { direction: "down", label: "Move tiles down", icon: ArrowDown },
    { direction: "right", label: "Move tiles right", icon: ArrowRight },
  ];
  const won = bestTile >= 2048;
  const over = noMoves(grid);

  return (
    <article className={`game-card number-game${compactMode ? " game-card-compact" : ""}`}>
      {/* Strictly bounded instruction overlay inside the game card box */}
      <GameInfoOverlay
        info={INFO_2048}
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
      />

      <div className="game-card-heading">
        <div>
          <p className="game-eyebrow">01 · Number puzzle</p>
          <h3>2048</h3>
        </div>
        <div className="game-heading-actions">
          {/* Hover-triggered (i) Info button */}
          <div
            className="game-info-trigger-wrap"
            onMouseEnter={() => setInfoOpen(true)}
            onClick={() => setInfoOpen((prev) => !prev)}
          >
            <button
              className="game-info-btn"
              type="button"
              aria-label="How to play 2048 (Hover to view full details)"
            >
              <Info size={15} />
            </button>
          </div>
          <button
            className="game-reset"
            type="button"
            onClick={reset}
            aria-label="Start a new 2048 game"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <p className="game-description">Join matching tiles and make 2048. Use your arrow keys or the controls.</p>

      {/* Timer row with live timer and scores */}
      <div className="game-timer-row">
        <GameTimer startTime={startTime} />
        <div className="game-score-row">
          <span>Score <strong>{score}</strong></span>
          <span>Best tile <strong>{bestTile || Math.max(0, ...grid.flat())}</strong></span>
        </div>
      </div>

      <IdleSuggestion suggestion={suggestion} />

      <div
        className="game-2048-board"
        role="grid"
        aria-label="2048 game board. Focus here and use the arrow keys."
        tabIndex={0}
        onKeyDown={handleBoardKey}
        onClick={() => { if (!startTime) setStartTime(Date.now()); recordInput(); }}
      >
        {grid.flatMap((row, y) => row.map((value, x) => (
          <div
            className="game-2048-cell"
            role="gridcell"
            aria-label={value ? String(value) : "empty"}
            data-value={value || "empty"}
            key={`${y}-${x}`}
          >
            {value || ""}
          </div>
        )))}
      </div>

      <div className="game-controls" aria-label="Move tiles">
        {arrows.map(({ direction, label, icon: Icon }) => (
          <button
            key={direction}
            className="game-control"
            type="button"
            onClick={() => move(direction)}
            aria-label={label}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>

      <p className="game-status" aria-live="polite">
        {won
          ? "🎉 2048 reached! Keep going for 4096 or an even higher tile."
          : over
          ? "No moves left. Start a new round!"
          : "New tiles appear after every move."}
      </p>
    </article>
  );
}

/* ── Memory Match Game ─────────────────────────────────── */

export function MemoryMatchGame({ compactMode = false }: { compactMode?: boolean }) {
  const [cards, setCards] = useState<Card[]>(() => INITIAL_CARDS.map((face, id) => ({ face, id })));
  const [selected, setSelected] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [turns, setTurns] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const { suggestion, recordInput, resetIdle } = useIdleSuggestion(SUGGESTIONS_MEMORY, startTime !== null);

  useEffect(() => {
    if (selected.length !== 2) return;
    const [first, second] = selected;
    const match = cards.find((card) => card.id === first)?.face === cards.find((card) => card.id === second)?.face;
    const timer = window.setTimeout(() => {
      if (match) {
        playTactilePop();
        setMatched((current) => [...current, first, second]);
      }
      setSelected([]);
    }, match ? 420 : 760);
    return () => window.clearTimeout(timer);
  }, [cards, selected]);

  function restart() {
    setCards(shuffledCards());
    setSelected([]);
    setMatched([]);
    setTurns(0);
    setStartTime(null);
    resetIdle();
  }

  function flip(id: number) {
    if (selected.length === 2 || selected.includes(id) || matched.includes(id)) return;
    playCyberClick();
    if (!startTime) setStartTime(Date.now());
    recordInput();
    setSelected((current) => [...current, id]);
    if (selected.length === 1) setTurns((current) => current + 1);
  }

  const complete = matched.length === cards.length && cards.length > 0;

  return (
    <article className={`game-card memory-game${compactMode ? " game-card-compact" : ""}`}>
      {/* Strictly bounded instruction overlay inside the game card box */}
      <GameInfoOverlay
        info={INFO_MEMORY}
        isOpen={infoOpen}
        onClose={() => setInfoOpen(false)}
      />

      <div className="game-card-heading">
        <div>
          <p className="game-eyebrow">02 · Memory challenge</p>
          <h3>Signal Pairs</h3>
        </div>
        <div className="game-heading-actions">
          {/* Hover-triggered (i) Info button */}
          <div
            className="game-info-trigger-wrap"
            onMouseEnter={() => setInfoOpen(true)}
            onClick={() => setInfoOpen((prev) => !prev)}
          >
            <button
              className="game-info-btn"
              type="button"
              aria-label="How to play Signal Pairs (Hover to view full details)"
            >
              <Info size={15} />
            </button>
          </div>
          <button
            className="game-reset"
            type="button"
            onClick={restart}
            aria-label="Restart the memory game"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      <p className="game-description">Find all six matching pairs. Every two cards count as one turn.</p>

      {/* Timer row with live timer and scores */}
      <div className="game-timer-row">
        <GameTimer startTime={startTime} />
        <div className="game-score-row">
          <span>Turns <strong>{turns}</strong></span>
          <span>Pairs <strong>{matched.length / 2}/6</strong></span>
        </div>
      </div>

      <IdleSuggestion suggestion={suggestion} />

      <div className="memory-board" aria-label="Memory card game">
        {cards.map(({ id, face }) => {
          const open = selected.includes(id) || matched.includes(id);
          return (
            <button
              className={`memory-card${open ? " is-open" : ""}${matched.includes(id) ? " is-matched" : ""}`}
              key={id}
              type="button"
              onClick={() => flip(id)}
              aria-label={matched.includes(id) ? `Matched ${face}` : open ? `Open card ${face}` : "Flip a face-down card"}
              aria-pressed={open}
              disabled={matched.includes(id)}
            >
              {open ? face : "?"}
            </button>
          );
        })}
      </div>

      <p className="game-status" aria-live="polite">
        {complete
          ? `🏆 All 6 pairs found in ${turns} turns! Excellent memory performance.`
          : "Match each signal with its pair."}
      </p>
    </article>
  );
}
