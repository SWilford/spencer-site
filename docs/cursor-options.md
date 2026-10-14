# Cursor concepts and selected implementation

Implemented selection: 1 + 7, with a short 5 trail and no 10 depth echo (removed by request). The remaining concepts below are alternatives.

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

## Approved cursor implementation

Spencer selected 1 + 7 with a little 5; the initial depth echo was removed. SensorCursor mounts once in the root layout outside page transitions. The exact 3px center tracks immediately; a 25px corner frame follows with a 45ms exponential catch-up and contracts over links/buttons. Three short red vector segments cap at 14px each and disappear at rest. There is no offset depth frame. Primary clicks emit a 300ms expanding corner-bracket pulse. Pointer positions never trigger React renders; animation frames stop once settled. The overlay is decorative and cannot intercept input.

Only fine hover mouse pointers with no reduced-motion preference receive the cursor. Text and editable content retain the native browser cursor; the custom I-beam was removed. Special cursor contexts, keyboard use, scroll, blur, pointer exit and hidden tabs restore the native cursor. Touch and reduced-motion retain native behavior. Glass faces have no charcoal base, a 2.5% reflection with 3.5–5.5% red tint, 2.5px frosted blur, saturation 1.12 and the existing red outline; the block fill and magnetic/press behavior stay intact.
