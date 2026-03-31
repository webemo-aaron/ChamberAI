export function attachPaneSplitter(
  layout,
  {
    storageKey,
    variableName,
    defaultWidth = 360,
    minWidth = 320,
    maxWidth = 520
  } = {}
) {
  if (!layout || !storageKey || !variableName) {
    return () => {};
  }

  const splitter = layout.querySelector(".pane-splitter");
  if (!splitter) {
    return () => {};
  }

  const storedWidth = Number(localStorage.getItem(storageKey) || defaultWidth);
  setWidth(clamp(storedWidth, minWidth, maxWidth));

  const handlePointerMove = (event) => {
    if (window.innerWidth <= 1024) {
      return;
    }

    const bounds = layout.getBoundingClientRect();
    const nextWidth = clamp(event.clientX - bounds.left, minWidth, Math.min(maxWidth, bounds.width - 320));
    setWidth(nextWidth);
  };

  const handlePointerUp = () => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    document.body.classList.remove("pane-resizing");
  };

  const handlePointerDown = (event) => {
    if (window.innerWidth <= 1024) {
      return;
    }

    event.preventDefault();
    document.body.classList.add("pane-resizing");
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });
  };

  splitter.addEventListener("pointerdown", handlePointerDown);

  return () => {
    splitter.removeEventListener("pointerdown", handlePointerDown);
    handlePointerUp();
  };

  function setWidth(width) {
    layout.style.setProperty(variableName, `${width}px`);
    localStorage.setItem(storageKey, String(width));
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
