let counter = 0;

export function nextId(prefix) {
  counter += 1;
  return `${prefix}_${counter}`;
}

export function resetIds() {
  counter = 0;
}
