# Brain Rush

A self-contained browser prototype for a playful shared-device quiz board game. The title is **Brain Rush** and can be edited directly on the main menu.

## Run

Open `index.html` in a modern browser, or start a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

Run the gameplay, audit, and board geometry checks with `node --test game.smoke.test.cjs game.audit.test.cjs game.board.test.cjs`.

## Included

- Flexible 2–4 player setup with at least one human and any mix of human and AI players
- Four original characters on the title page; eight named characters in the player picker
- Two animated dice
- Paper-dice rolling sound generated in the browser
- Sound-effect toggle; no background music
- 60 separate rounded tiles in a numbered zigzag board, with ladders, playful pink slides, and a striped black-and-white Finish
- Tile numbers and skill icons share a top header; chosen and correct answers use matching-width stacked panels
- Five color-linked question categories and four difficulty tiers
- 200 additional multiple-choice questions from the supplied bank, plus the earlier questions with more relevant answer choices
- Each category/difficulty has its own reshuffled, no-repeat pile; answer positions reshuffle for each new game
- Depleted piles give an explicit free pass; used cards are never recycled during a game
- 15-second multiple-choice questions
- Audible countdown ticks throughout, with urgent ticks in the final five seconds
- Shield, Push Back, Rainbow, Switch, and Double Roll spaces
- Category colors and 20 skill locations (four of each type) reshuffle at the start of every game; skill spaces avoid Start, Finish, and route endpoints
- Rainbow immediately chooses the current question category and cannot be kept
- Category color guide is contained in the How to Play panel
- Quitting cancels timers and AI actions, stops audio, and clears the previous player session
- Scattered animated paper dice and active-meeple-only giggle animation
- Every human and AI answer appears in a question popup with a funny result card
- Arriving on an occupied tile immediately starts a challenge, with separate cards of the same category and difficulty; all occupants are handled
- Full information for the active player and compact tile-only cards for waiting players
- Push Back, Switch, and Double Roll can be used immediately or kept in a three-slot inventory
- Shield is automatically pocketed in its own defensive slot (maximum one), without displacing kept action skills; no manual activation is needed
- A pocketed Shield automatically blocks one wrong-answer bounce, slide, hostile skill, or challenge penalty, then is consumed
- A wrong answer after a slide sends the player two more tiles back from the slide's bottom; a Shielded slide does not cause this extra penalty
- A kept Double Roll gives a normal roll followed by a bonus roll
- Illustrated color-coded how-to-play guide
- Responsive, original hand-drawn visual treatment
- Dialogs isolate keyboard focus, and narrow screens can pan across the board
- Editable game title

The game is built with plain HTML, CSS, and JavaScript, with no build step or external game engine required.
