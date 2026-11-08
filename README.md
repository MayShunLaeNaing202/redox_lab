# Redox Lab

Interactive website for Grade 11 Chemistry, Chapter 3: Oxidation and Reduction.

## Files
- `index.html` – page structure and lesson content (English and Burmese)
- `style.css` – white and green theme, dark mode, layout for desktop and phones
- `script.js` – oxidation number calculator, animations, step-by-step balancing, practice quiz, chapter test, language and theme switch

## How to open
Double-click `index.html` to open it in Chrome, Edge or Firefox. No installation is needed.
Fonts load from Google Fonts when online; without internet the page uses the computer's own fonts.

## How the language switch works
Every text is written twice: `<span class="en">…</span><span class="my">…</span>`.
The button sets `data-lang="my"` on `<html>`, and CSS hides the other language.

## Adding a quiz question
In `script.js`, add an item to the `Q` list:
`{t:'on', q:['English question','မြန်မာ မေးခွန်း'], o:['correct answer','wrong','wrong','wrong'], e:['English explanation','မြန်မာ ရှင်းလင်းချက်']}`
The first option is always the correct one; the quiz shuffles them.
Topic codes: `on` (3.1), `concepts` (3.2), `redox` (3.3), `agents` (3.4), `balancing` (3.5).
