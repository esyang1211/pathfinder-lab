
export function dijkstra(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;

  const distances = Array.from(
    { length: rows },
    () => Array(cols).fill(Infinity)
  );

  const visited = Array.from(
    { length: rows },
    () => Array(cols).fill(false)
  );

  const previous = Array.from(
    { length: rows },
    () => Array(cols).fill(null)
  );

  const steps = [];
  const queue = [];

  distances[start.row][start.col] = 0;
  queue.push({ ...start, distance: 0 });

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    queue.sort((a, b) => a.distance - b.distance);
    const current = queue.shift();

    const { row, col } = current;

    if (visited[row][col]) continue;

    visited[row][col] = true;

    steps.push({
      type: "visit",
      row,
      col,
      distance: distances[row][col],
    });

    if (row === end.row && col === end.col) {
      break;
    }

    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;

      if (
        nr < 0 ||
        nr >= rows ||
        nc < 0 ||
        nc >= cols ||
        grid[nr][nc] === 1 ||
        visited[nr][nc]
      ) {
        continue;
      }

      const newDistance = distances[row][col] + 1;

      if (newDistance < distances[nr][nc]) {
        distances[nr][nc] = newDistance;
        previous[nr][nc] = { row, col };

        queue.push({
          row: nr,
          col: nc,
          distance: newDistance,
        });

        steps.push({
          type: "update",
          from: { row, col },
          to: { row: nr, col: nc },
          distance: newDistance,
        });
      }
    }
  }

  const path = [];
  let current = end;

  if (distances[end.row][end.col] !== Infinity) {
    while (current !== null) {
      path.unshift(current);
      current = previous[current.row][current.col];
    }
  }

  return {
    steps,
    path,
    visitedCount: visited.flat().filter(Boolean).length,
    distance: distances[end.row][end.col],
  };
}
