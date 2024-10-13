import * as alt from 'alt-client';

let isCursorVisible = false;

export function showCursor(state) {
    if (state && !isCursorVisible) {
        alt.showCursor(true);
        alt.toggleGameControls(false);
        isCursorVisible = true;
    } else if (!state && isCursorVisible) {
        alt.showCursor(false);
        alt.toggleGameControls(true);
        isCursorVisible = false;
    }
}
