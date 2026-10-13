# Cursor concepts - brainstorm only

No custom cursor has been implemented. These are visual directions for Spencer to select.

1. Sensor reticle: a precise center dot with four small corner brackets that trail slightly and catch up.
2. Acquisition brackets: brackets contract and align around a hovered interactive element.
3. Navigation chevron: a small angular arrow with a trailing outline that leans with movement.
4. Gyroscope: broken circular arcs respond to velocity and settle when movement stops.
5. Vector tail: two or three short fading segments trace the recent path.
6. Scanner arc: one muted-red arc sweeps around a precise center point.
7. Lock pulse: a short contraction on hover and a crisp expanding ring on click.
8. Pixel wake: a tiny sequence of fading square points follows movement.
9. Orbit marker: one small satellite point moves around the pointer; hovering controls arrests its orbit.
10. Layered depth: center point tracks exactly, while an offset frame moves with restrained parallax.

Preferred combination: 1 with the hover/click behavior of 7, optionally a short 5 trail. Keep the actual pointer location precise while only the outer decoration lags. Avoid a large full-screen crosshair. Preserve native text-selection and resize cursors; use desktop fine-pointer behavior and a reduced-motion version. Keep existing magnetic button behavior consistent with any hover acquisition.
