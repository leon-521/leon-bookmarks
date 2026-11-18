#!/bin/bash
# Generate PNG icons from SVG using Node.js
# Requires: npm install -g svgexport
# Or use any other SVG to PNG converter

SIZES=(16 32 48 128)
for size in "${SIZES[@]}"; do
  echo "Creating placeholder icon${size}.png"
  # Create a minimal valid PNG (1x1 blue pixel) as placeholder
  # Replace these with proper icons before publishing
  node -e "
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(${size}, ${size});
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#3b6cf4';
    ctx.beginPath();
    ctx.roundRect(0, 0, ${size}, ${size}, ${size}/5);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold ${size/2}px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', ${size}/2, ${size}/2);
    const fs = require('fs');
    fs.writeFileSync('icons/icon${size}.png', canvas.toBuffer('image/png'));
    console.log('  → icon${size}.png');
  " 2>/dev/null || echo "  → Skipped (canvas not available)"
done
echo "Done! If canvas is not available, manually create PNG icons from icons/icon.svg"
