# Acceptance and evidence

The shipped `plan.md` and ready issues are the agreement for step one. Product changes belong to step two, after its response.

| Requirement | Check | Evidence |
| --- | --- | --- |
| R1: newest incidents appear live at top | Browser routes add a newer incident at next poll; assert first row ID | `tests/browser.mjs` |
| R2: Ack targets its row and marks only on success | Failure/retry; request ID and cursor; persisted mark across polling | `tests/browser.mjs` |
| R3: loader until initial response | Delayed initial response; error/recovery; empty state | `tests/browser.mjs` |
| R4: refresh every 2 seconds | Browser waits for next polls without reloading | `tests/browser.mjs`, real-board recording |
| R5: local times and full UTC datetime | Berlin/en-GB and Auckland/en-NZ, including date rollover | `tests/format.test.mjs`, `tests/browser.mjs` |
| R6: build SHA | Build script stamps source commit in meta and footer | `scripts/build.mjs`, deployed-board recording |

## Run

- `npm test` — dependency-free Node tests.
- `npm run serve` — uses Python already installed on the machine; no implicit npm install.
- `node tests/browser.mjs` — requires Playwright plus Chromium already installed. Set `PLAYWRIGHT_PACKAGE` to the absolute path to an existing package.json providing Playwright if it is not installed in this repository. Set `PLAYWRIGHT_BROWSERS_PATH` to its existing browser cache when necessary.
- `npm run build -- /path/to/output` — requires a committed Git tree; stamps its HEAD SHA. Run only on a clean source tree for publication.

Mocked API checks isolate UI behavior. They do not prove the live service works. The published-board recording and sealed course receipt supply that separate evidence. Raw session and receipt logs stay outside this source repository.

## Release gate

Do not describe the Challenge as solved until the course accepts step two. Keep source SHA, recording URL, precise timestamp, and the receipt from the recorded Ack together. Preserve the original course workflow unchanged. Review product's response before changing the agreement. Previous source commits and the publication branch provide rollback points; rolling back a page does not undo acknowledgements already sent to the course API.
