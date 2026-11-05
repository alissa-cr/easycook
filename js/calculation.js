// Split a measure like "200g", "1/2 tsp" or "1 1/2 cups" into a number and a unit
function parseMeasure(measure) {
  const m = measure.trim().match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)\s*(.*)$/);
  if (m === null) return null;             // text only, like "Pinch" or "to taste"

  const numText = m[1];
  let qty;

  if (numText.includes('/')) {
    const parts = numText.split(/\s+/);
    if (parts.length === 2) {              // mixed number: "1 1/2"
      const [top, bottom] = parts[1].split('/');
      qty = Number(parts[0]) + Number(top) / Number(bottom);
    } else {                               // simple fraction: "1/2"
      const [top, bottom] = parts[0].split('/');
      qty = Number(top) / Number(bottom);
    }
  } else {
    qty = Number(numText);                 // plain number: "200"
  }

  return { qty: qty, unit: m[2] };
}

// Multiply one ingredient's amount by the scaling factor
function scaleIngredient(item, factor) {
  const parsed = parseMeasure(item.measure);

  if (parsed === null) {                   // can't be scaled, keep the original text
    return item.measure + ' ' + item.name;
  }

  const newQty = Math.round(parsed.qty * factor * 100) / 100;   // round to 2 decimals
  return newQty + ' ' + parsed.unit + ' ' + item.name;
}