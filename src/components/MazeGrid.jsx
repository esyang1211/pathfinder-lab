
import "./MazeGrid.css";

export default function MazeGrid({
  grid,
  start,
  end,
  steps = [],
  currentStep = 0,
  path = [],
  onCellClick,
}) {
  const visited = new Set();
  const frontier = new Set();

  // 현재 단계까지의 알고리즘 진행 상황 복원
  steps.slice(0, currentStep).forEach((step) => {
    if (step.type === "visit") {
      const key = `${step.row}-${step.col}`;
      visited.add(key);
      frontier.delete(key);
    }

    if (step.type === "update") {
      const key = `${step.to.row}-${step.to.col}`;
      if (!visited.has(key)) {
        frontier.add(key);
      }
    }
  });

  const isFinished =
    steps.length > 0 && currentStep >= steps.length;

  const pathSet = new Set(
    isFinished
      ? path.map((cell) => `${cell.row}-${cell.col}`)
      : []
  );

  function getCellType(row, col) {
    const key = `${row}-${col}`;

    if (row === start.row && col === start.col) {
      return "start";
    }

    if (row === end.row && col === end.col) {
      return "end";
    }

    if (grid[row][col] === 1) {
      return "wall";
    }

    if (pathSet.has(key)) {
      return "path";
    }

    if (visited.has(key)) {
      return "visited";
    }

    if (frontier.has(key)) {
      return "frontier";
    }

    return "empty";
  }

  return (
    <div className="maze-container">
      <div
        className="maze-grid"
        style={{
          gridTemplateColumns: `repeat(${grid[0].length}, 1fr)`,
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((_, colIndex) => {
            const type = getCellType(rowIndex, colIndex);

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`maze-cell ${type}`}
                onClick={() =>
                  onCellClick?.(rowIndex, colIndex)
                }
                title={`(${rowIndex}, ${colIndex})`}
              >
                {type === "start" && "S"}
                {type === "end" && "E"}
              </div>
            );
          })
        )}
      </div>

      <div className="maze-legend">
        <span><i className="legend-start" /> 출발점</span>
        <span><i className="legend-end" /> 도착점</span>
        <span><i className="legend-wall" /> 장애물</span>
        <span><i className="legend-frontier" /> 탐색 후보</span>
        <span><i className="legend-visited" /> 탐색 완료</span>
        <span><i className="legend-path" /> 최단 경로</span>
      </div>
    </div>
  );
}
