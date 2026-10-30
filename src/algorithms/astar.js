
export function astar(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;

  const gScore = Array.from(
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

  // 휴리스틱: 맨해튼 거리
  function heuristic(row, col) {
    return (
      Math.abs(row - end.row) +
      Math.abs(col - end.col)
    );
  }

  gScore[start.row][start.col] = 0;

  queue.push({
    ...start,
    g: 0,
    h: heuristic(start.row, start.col),
    f: heuristic(start.row, start.col),
  });

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (queue.length > 0) {
    // A*: f(n) = g(n) + h(n)이 작은 정점 우선
    queue.sort((a, b) => a.f - b.f);

    const current = queue.shift();
    const { row, col } = current;

    if (visited[row][col]) continue;

    visited[row][col] = true;

    steps.push({
      type: "visit",
      row,
      col,
      g: gScore[row][col],
      h: heuristic(row, col),
      f: gScore[row][col] + heuristic(row, col),
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

      const newG = gScore[row][col] + 1;

      if (newG < gScore[nr][nc]) {
        gScore[nr][nc] = newG;
        previous[nr][nc] = { row, col };

        const h = heuristic(nr, nc);

        queue.push({
          row: nr,
          col: nc,
          g: newG,
          h,
          f: newG + h,
        });

        steps.push({
          type: "update",
          from: { row, col },
          to: { row: nr, col: nc },
          g: newG,
          h,
          f: newG + h,
        });
      }
    }
  }

  const path = [];
  let current = end;

  if (gScore[end.row][end.col] !== Infinity) {
    while (current !== null) {
      path.unshift(current);
      current = previous[current.row][current.col];
    }
  }

  return {
    steps,
    path,
    visitedCount: visited.flat().filter(Boolean).length,
    distance: gScore[end.row][end.col],
  };
}
