# developer guide: adding a new arcade game

this guide provides step-by-step instructions on how to add a new arcade game to the bidda gaming platform. to ensure nothing is missed, follow this checklist sequentially.

> [!IMPORTANT]
> **platform arcade game standards:**
>
> 1. **naming convention:** we use the term **`level` / `levels`** across the entire platform (database configuration, backend logic, and frontend code) instead of `round` / `rounds`. ensure all functions, variables, and properties follow this convention (e.g., `total_levels`, `redactLevel`, `level`, `levels`).
> 2. **level count:** the number of levels can be configured game-by-game, but the naming must remain `level` / `levels`.
> 3. **game rules:** by default, **max skips is 3** and **max mistakes is 3**. the game session ends immediately when _either_ skips or mistakes reach their maximum limit.
> 4. **UI stats layout standard:**
>    - the game status stats (`LEVEL`, `MISTAKES`, and `SKIPS`) must always be displayed together on the **left side** of the running layout header.
>    - scoring stats (`SCORE`) and other custom statistics must be displayed on the **right side** of the running layout header.

---

## checklist overview

```mermaid
graph td
    a[1. database seed & config] --> b[2. register backend game keys]
    b --> c[3. write backend game logic]
    c --> d[4. register game in gameregistry.js]
    d --> e[5. update routing in gaming.service.js]
    e --> f[6. add typescript types in frontend]
    f --> g[7. create frontend game component folder]
    g --> h[8. add game to gamecatalog.ts]
    h --> i[9. register route component in index.tsx]
```

---

## backend changes

### 1. database configuration & seeding

add the metadata and default configuration of the new game to the database.

- **file:** [gaming.sql](file:///e:/WebApp/Deploy/Bidda/Backend/sql_code_folder/gaming.sql)

- **action:** insert the game's initial configuration into the `public.games` table insert script.
- **example:**

  ```sql
  INSERT INTO public.games (key, title, description, content_config) VALUES
  ('your-game-key', 'Your Game Title', 'A description of the game.', '{"total_levels": 15, "points_per_correct": 10, "penalty_per_wrong": 5, "max_skips": 3, "max_mistakes": 3}'::jsonb);
  ```

### 2. register game key in constants

declare the game key in the backend constants file.

- **file:** [gaming.js](file:///e:/WebApp/Deploy/Bidda/Backend/src/constants/gaming.js)
- **action:** add your new game key string to the `ARCADE_GAME_KEYS` array constant.

### 3. create game logic file

write the generation, evaluation, and redaction logic for your game.

- **folder:** `Backend/src/services/games/logic/`
- **file name:** `[gameKey].logic.js` (e.g. `gridHunter.logic.js`)
- **action:** create the file and implement the following **5 mandatory default exports**:
  1. `generate(config)`: returns generated array of levels based on difficulty configs.
  2. `redact(sessionState)`: removes answers/solutions from the payload sent to the client.
  3. `redactLevel(level)`: helper to redact answers from a single level.
  4. `verify(sessionState, clientSubmission, config)`: evaluates full session offline submissions (fallback).
  5. `verifyTurn(sessionState, answer, config)`: checks individual turn-by-turn submissions. updates score, mistakes, skips, and returns `completed` status along with correct answers.

### 4. register logic in game registry

register the new logic service inside the game logic lookup directory.

- **file:** [gameRegistry.js](file:///e:/WebApp/Deploy/Bidda/Backend/src/services/games/gameRegistry.js)
- **action:** import your logic file and add it to the `registry` export object mapping key -> logic service.

### 5. update turn routing in gaming service

ensure the gaming controller knows how to format the next level payload when advancement occurs.

- **file:** [gaming.service.js](file:///e:/WebApp/Deploy/Bidda/Backend/src/services/gaming.service.js)
- **action:** find the `submitTurn` logic and update the conditions where `gameLogic.redactLevel` is called. ensure your game key is handled there so users get clean, redacted payloads for subsequent levels.
- **example check:**

  ```javascript
  if (
    gameKey === "grid-hunter" ||
    gameKey === "speed-equate" ||
    gameKey === "your-game-key"
  ) {
    // Redact next turn before sending back to frontend
  }
  ```

---

## frontend changes

### 6. add game key to typescript types

declare the game key so that compiling and routing are type-safe.

- **file:** [gaming.types.ts](file:///e:/WebApp/Deploy/Bidda/Frontend/src/types/gaming.types.ts)
- **action:** add your new game key string to the union type `ArcadeGameKey`.

### 7. create game UI components folder

create a standardized structure for the game's front-end code.

- **folder:** `Frontend/src/app/gaming/play/games/[gameKey]/`
- **files to create:**
  1. `[GameName]Game.tsx`: wrapper component loading initial session and handling onFinish transitions.
  2. `[GameName]RunningView.tsx`: gameplay screen (renders timers, layouts, card interfaces, active inputs, and correctness feedback).
  3. `[gameKey].constants.ts`: game constants (e.g. points, mistakes limits, game instructions, rules text).
  4. `[gameKey].types.ts`: TypeScript definitions of questions, levels, and options for compiling safety.

> [!TIP]
> when implementing correctness/incorrectness feedback, keep it inline (e.g., highlighting borders/backgrounds) rather than using screen-blocking bouncing modals. this preserves the sleek and uniform arcade UI experience.

### 8. register in game catalog

register the game in the list that populates the user selection screen.

- **file:** [gameCatalog.ts](file:///e:/WebApp/Deploy/Bidda/Frontend/src/app/gaming/play/gameCatalog.ts)
- **action:** append the game metadata object to the catalog array.
- **fields required:**
  - `key` (must match database key)
  - `title`
  - `description`
  - `slug` (path)
  - `icon` (react icon component)
  - `gradient` (tailwind style background class)

### 9. register route mapping

connect the game container to the dynamic routing index.

- **file:** [index.tsx](file:///e:/WebApp/Deploy/Bidda/Frontend/src/app/gaming/play/gameKey/index.tsx)
- **action:** import your game container component (`[GameName]Game.tsx`) and add it to the routing lookup object inside `GamePlayRouter` components dictionary.

---

## validation steps

1. **build frontend:** run `npx tsc -b` inside `Frontend` folder to verify no TypeScript compilation errors exist.
2. **test database config:** run the backend server using `npm run dev` and test launching a new session of the game.
