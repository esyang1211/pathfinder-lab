import { useEffect, useMemo, useState } from 'react';
import MazeGrid from './components/MazeGrid';
import GraphLesson from './GraphLesson';
import { dijkstra } from './algorithms/dijkstra';
import { astar } from './algorithms/astar';
import './App.css';

const LESSON_GRID = [[0,0,0,0],[0,0,0,0]]; // 8 traversable vertices
const PLAY_GRID = [
 [0,0,0,0,0,0,0,0],
 [0,1,1,0,0,1,0,0],
 [0,0,0,0,1,0,0,0],
 [0,1,0,0,0,0,1,0],
 [0,0,0,1,0,0,0,0],
 [0,0,0,0,1,0,0,0],
 [0,1,0,0,0,0,1,0],
 [0,0,0,0,0,0,0,0],
];
const PAGES = [
 {label:'프로젝트 소개',kicker:'01 / WELCOME'},
 {label:'Dijkstra 개념',kicker:'02 / DIJKSTRA BASICS'},
 {label:'Dijkstra 심화',kicker:'03 / DIJKSTRA WALKTHROUGH'},
 {label:'A* 개념',kicker:'04 / A STAR BASICS'},
 {label:'A* 심화',kicker:'05 / A STAR WALKTHROUGH'},
 {label:'복잡도 비교',kicker:'06 / COMPLEXITY'},
 {label:'그래프 다이어그램',kicker:'07 / WEIGHTED GRAPH'},
 {label:'8×8 미로 체험',kicker:'08 / MAZE EXPERIENCE'},
 {label:'동시 배틀',kicker:'09 / LIVE BATTLE'},
 {label:'실험실',kicker:'10 / EXPERIMENT LAB'},
];
const clone = (g) => g.map(row => [...row]);
const xy = (p) => `(${p.row}, ${p.col})`;

function CodePanel({ title, children }) {
 return <div className="code-card"><h3>{title}</h3><pre><code>{children}</code></pre></div>;
}

const DIJKSTRA_CODE = `dist[start] ← 0; 다른 모든 정점의 dist ← ∞
우선순위 큐 PQ에 (0, start) 삽입
while PQ가 비어 있지 않으면:
    dist가 가장 작은 정점 u 꺼내기
    이미 확정된 정점이면 건너뛰기
    u 확정; u가 목적지이면 종료
    for u와 연결된 각 정점 v:
        후보 ← dist[u] + 간선 비용(u, v)
        if 후보 < dist[v]:
            dist[v] ← 후보; prev[v] ← u
            PQ에 (후보, v) 삽입`;
const ASTAR_CODE = `g[start] ← 0; 다른 모든 정점의 g ← ∞
f[start] ← g[start] + h(start)
우선순위 큐 PQ에 (f[start], start) 삽입
while PQ가 비어 있지 않으면:
    f = g + h가 가장 작은 정점 u 꺼내기
    이미 확정된 정점이면 건너뛰기
    u 확정; u가 목적지이면 종료
    for u와 연결된 각 정점 v:
        후보 ← g[u] + 간선 비용(u, v)
        if 후보 < g[v]:
            g[v] ← 후보; prev[v] ← u
            f[v] ← g[v] + h(v)
            PQ에 (f[v], v) 삽입`;

function getDescription(result, currentStep, algorithm) {
 if (!result) return '실행 버튼을 누르면 각 단계에서 무엇을 했고 왜 그렇게 했는지 설명해 줄게요.';
 if (currentStep === 0) return '아직 탐색 전이에요. 출발점의 거리만 0, 다른 칸은 ∞로 시작합니다.';
 const event = result.steps[currentStep - 1];
 if (!event) return '탐색 기록을 확인하세요.';
 const done = currentStep === result.steps.length;
 let message = '';
 if (event.type === 'visit') {
   message = algorithm === 'dijkstra'
    ? `${xy(event)} 칸을 확정했어요. 시작점에서 여기까지의 거리 g=${event.distance}가 현재 가장 작아 먼저 탐색합니다.`
    : `${xy(event)} 칸을 확정했어요. g=${event.g}, h=${event.h}, f=g+h=${event.f}로, 예상 총거리 f가 가장 낮은 후보를 먼저 탐색합니다.`;
 } else {
   message = algorithm === 'dijkstra'
    ? `${xy(event.from)}에서 ${xy(event.to)}(으)로 이동하는 경로를 찾았어요. 더 짧은 경로이므로 거리 기록을 ${event.distance}(으)로 갱신하고 탐색 후보에 넣습니다.`
    : `${xy(event.from)}에서 ${xy(event.to)}까지의 거리 후보를 갱신했어요. g=${event.g} (실제 이동), h=${event.h} (남은 거리 추정), f=${event.f} (우선순위)입니다.`;
 }
 if (done) message += Number.isFinite(result.distance)
   ? ' 모든 과정이 끝났습니다. 보라색은 최단 경로예요.'
   : ' 모든 과정이 끝났지만 도착점으로 가는 길은 없어요.';
 return message;
}

export default function App() {
 const [page, setPage] = useState(0);
 const [mode, setMode] = useState('lesson');
 const [grid, setGrid] = useState(clone(LESSON_GRID));
 const [start, setStart] = useState({row:0,col:0});
 const [end, setEnd] = useState({row:1,col:3});
 const [result, setResult] = useState(null);
 const [algorithm, setAlgorithm] = useState('dijkstra');
 const [currentStep, setCurrentStep] = useState(0);
 const [playing, setPlaying] = useState(false);
 const [speed, setSpeed] = useState(360);
 const [editMode, setEditMode] = useState('wall');
 const [battle, setBattle] = useState(null);

 useEffect(() => {
  if (!playing || !result) return;
  const id = window.setInterval(() => setCurrentStep(s => Math.min(s + 1, result.steps.length)), speed);
  return () => window.clearInterval(id);
 }, [playing, result, speed]);
 useEffect(() => {
  if (result && currentStep >= result.steps.length) setPlaying(false);
 }, [currentStep, result]);

 useEffect(() => {
  if (page >= 8 && mode !== 'play') switchMode('play');
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [page]);
 const isLesson = mode === 'lesson';
 const next = () => { setPlaying(false); setPage(p => Math.min(PAGES.length-1,p+1)); window.scrollTo({top:0,behavior:'smooth'}); };
 const previous = () => { setPlaying(false); setPage(p => Math.max(0,p-1)); window.scrollTo({top:0,behavior:'smooth'}); };
 function switchMode(nextMode) {
  setMode(nextMode);
  setGrid(clone(nextMode === 'lesson' ? LESSON_GRID : PLAY_GRID));
  setStart({row:0,col:0});
  setEnd(nextMode === 'lesson' ? {row:1,col:3} : {row:7,col:7});
  setResult(null); setBattle(null); setCurrentStep(0); setPlaying(false);
 }
 function editCell(row,col) {
  setPlaying(false); setResult(null); setBattle(null); setCurrentStep(0);
  if (editMode === 'start') {
   if (row === end.row && col === end.col) return;
   setStart({row,col});
   setGrid(g => g.map((r,ri) => r.map((v,ci) => ri===row && ci===col ? 0 : v)));
   return;
  }
  if (editMode === 'end') {
   if (row === start.row && col === start.col) return;
   setEnd({row,col});
   setGrid(g => g.map((r,ri) => r.map((v,ci) => ri===row && ci===col ? 0 : v)));
   return;
  }
  if (row===start.row && col===start.col || row===end.row && col===end.col) return;
  setGrid(g => g.map((r,ri) => r.map((v,ci) => ri===row && ci===col ? 1-v : v)));
 }
 function runOne() {
  setPlaying(false);
  const res = algorithm === 'dijkstra' ? dijkstra(grid,start,end) : astar(grid,start,end);
  setResult(res); setCurrentStep(0);
 }
 function runBattle() {
  const d = dijkstra(grid,start,end), a = astar(grid,start,end);
  setBattle({d,a}); setResult(null); setPlaying(false);
 }
 const visitor = result?.steps.slice(0,currentStep).filter(s=>s.type==='visit').length ?? 0;
 const haveCourseSteps = isLesson && grid.flat().filter(v=>v===0).length<=8;
 return <div className="site-shell">
  <header className="site-nav"><button className="brand" onClick={() => {setPage(0);window.scrollTo({top:0,behavior:'smooth'});}}>✦ PATHFINDER <span>LAB</span></button><div className="nav-right"><span className="nav-tag">ALGORITHM PROJECT · A* VS DIJKSTRA</span><span className="nav-progress">{String(page+1).padStart(2,'0')} / {String(PAGES.length).padStart(2,'0')}</span></div></header>
  <div className="layout">
   <aside className="sidebar"><span className="sidebar-label">CONTENTS</span>{PAGES.map((p,i)=><button key={i} className={`side-link ${i===page?'active':''}`} onClick={() => {setPage(i);setPlaying(false);window.scrollTo({top:0,behavior:'smooth'});}}><span>{String(i+1).padStart(2,'0')}</span>{p.label}{i===page && <b>●</b>}</button>)}<div className="sidebar-foot">탐색의 모든 순간을<br/>눈으로 확인하세요.</div></aside>
   <main className="main-content">
    <div className="page-overline">{PAGES[page].kicker}</div>
    {page===0 && <>
     <h1>최단 경로를 찾는<br/><em>두 가지 생각.</em></h1>
     <p className="lead">같은 출발점과 도착점, 같은 지도. 그런데 왜 두 알고리즘은 서로 다른 칸을 먼저 탐색할까요?</p>
     <div className="intro-grid"><article className="feature-card cyan"><div className="card-icon">◎</div><p className="mini-label">ALGORITHM 01</p><h2>Dijkstra</h2><p>출발점에서 가까운 정점부터 차례로 탐색합니다. 지금까지의 이동 거리 <strong>g(n)</strong>만 보고 다음 정점을 선택해요.</p><div className="equation">우선순위 = g(n)</div><p className="card-note">✔ 비음수 가중치 그래프에서 최단 경로 보장</p></article><article className="feature-card purple"><div className="card-icon">✦</div><p className="mini-label">ALGORITHM 02</p><h2>A* Search</h2><p>지금까지의 거리와 목적지까지의 예상 거리를 함께 고려해, 유망한 정점을 먼저 탐색합니다.</p><div className="equation">f(n) = g(n) + h(n)</div><p className="card-note">✔ 적절한 휴리스틱과 탐색 조건에서 최단 경로 보장</p></article></div>
     <section className="info-panel"><div className="pill">핵심 개념</div><h3>왜 A*에는 h(n)이 필요할까?</h3><p>g(n)은 이미 이동한 거리, h(n)은 앞으로 남은 거리의 <strong>추정값</strong>이에요. 이 사이트의 상하좌우 미로에서는 맨해튼 거리 h(n)=|행 차이|+|열 차이|를 사용해요. 벽은 추정에서 무시하지만 실제 이동 거리보다 크게 계산하지 않기 때문에 최단 경로 탐색에 사용할 수 있어요.</p><p>h(n)=0이면 A*는 Dijkstra와 같은 우선순위를 사용해요. 단, 동일한 거리 후보들의 처리 순서에 따라 방문 순서는 달라질 수 있어요.</p></section>
     <div className="feature-strip"><div><strong>동일한 문제</strong><span>출발점 → 도착점 최단 경로</span></div><div><strong>서로 다른 선택 기준</strong><span>g(n) vs g(n)+h(n)</span></div><div><strong>직접 검증</strong><span>의사코드 · 복잡도 · 시각화</span></div></div>
    </>}
    {page===2 && <><h1>핵심 로직을<br/><em>코드로 읽기.</em></h1><p className="lead">두 알고리즘 모두 거리 갱신(Relaxation)을 사용하지만, 우선순위 기준이 달라요.</p><div className="code-grid"><CodePanel title="◎ Dijkstra · Pseudocode">{DIJKSTRA_CODE}</CodePanel><CodePanel title="✦ A* · Pseudocode">{ASTAR_CODE}</CodePanel></div><section className="info-panel"><div className="pill">코드 해설</div><h3>“더 짧은 경로를 발견했다”는 무슨 뜻일까?</h3><p>어떤 칸까지 기존에 알고 있던 거리가 7인데 다른 길로 가 보니 5라면 <strong>7 → 5</strong>로 수정합니다. 처음 발견한 경우는 <strong>∞ → 5</strong>가 돼요. 이게 거리 갱신이며, 후보 정점을 큐에 넣어 다음 탐색 대상으로 고려하게 됩니다.</p><p>실제 구현은 동일 정점을 큐에 여러 번 넣을 수 있으며, 이미 확정한 정점은 건너뜁니다. 이 의사코드는 비음수 이동 비용과 일관적인 휴리스틱을 가정합니다.</p></section></>}
    {page===5 && <><h1>얼마나 빠르고,<br/><em>얼마나 기억할까?</em></h1><p className="lead">V는 정점 수, E는 간선 수입니다. 우선순위 큐를 이진 힙으로 구현했을 때의 대표적인 상한입니다.</p><div className="table-frame"><table><thead><tr><th>분석 항목</th><th>Dijkstra</th><th>A*</th></tr></thead><tbody><tr><td>시간 복잡도</td><td>O((V+E) log V)</td><td>일반적으로 O((V+E) log V)*</td></tr><tr><td>공간 복잡도</td><td>O(V+E)</td><td>O(V+E)</td></tr><tr><td>우선순위</td><td>g(n)</td><td>g(n)+h(n)</td></tr><tr><td>목적지 정보</td><td>사용하지 않음</td><td>휴리스틱에 활용</td></tr></tbody></table></div><section className="info-panel"><h3>왜 이런 복잡도가 나올까?</h3><p>인접 리스트로 그래프를 저장하면 <strong>O(V+E)</strong> 공간이 필요합니다. 정점과 간선을 확인하고 우선순위 큐를 갱신할 때 로그 시간이 들어, 이진 힙 기반 구현에서는 보통 <strong>O((V+E) log V)</strong>로 설명합니다.</p><p><strong>*주의:</strong> A*의 시간 복잡도는 휴리스틱의 성질과 구현 방식에 따라 달라집니다. 이 사이트처럼 <strong>일관적인 휴리스틱</strong>으로 확정 정점을 재확장하지 않는 경우의 그래프 탐색 상한입니다. 모든 문제에서 A*가 Dijkstra보다 빠르다는 뜻은 아닙니다.</p><p>지금까지 작성한 실습 코드는 힙 대신 <strong>배열을 매번 정렬</strong>하므로, 위 표의 이진 힙 구현과 실제 코드의 실행 비용은 같지 않아요. 이 점은 최종 분석에서 별도로 명시할 예정입니다.</p></section></>}
    {(page===7) && <>
      <h1>{page===7?<>한 걸음씩 보는<br/><em>탐색의 원리.</em></>:<>직접 그려 보는<br/><em>알고리즘 대결.</em></>}</h1>
      <p className="lead">{isLesson ? '2×4 미로(총 8정점)로 과제 조건에 맞춰 탐색을 한 단계씩 살펴봐요.' : '8×8 미로(총 64정점)를 자유롭게 편집하며 두 알고리즘을 체험해요.'}</p>
      <div className="sim-status"><span className="pill">{isLesson ? '과제 필수 · 8정점' : '추가 실험 · 64정점'}</span><span>상하좌우 이동 · 한 칸 비용 1</span></div>{page===7 && <div className="sim-select"><button className={isLesson?'selected cyan':''} onClick={()=>switchMode('lesson')}>▦ 2×4 미로 (과제용) {isLesson?'✓':''}</button><button className={!isLesson?'selected purple':''} onClick={()=>switchMode('play')}>▦ 8×8 미로 (확장용) {!isLesson?'✓':''}</button></div>}
      <div className="sim-toolbar"><div className="edit-buttons"><span>편집 도구</span>{[['wall','벽'],['start','출발점'],['end','도착점']].map(([value,label])=><button key={value} className={editMode===value?'active':''} onClick={()=>setEditMode(value)}>{label}</button>)}</div><button className="subtle-btn" onClick={()=>switchMode(isLesson?'lesson':'play')}>↻ 지도 초기화</button></div>
      {page===7?<div className="sim-select"><button onClick={()=>{setAlgorithm('dijkstra');setResult(null);setCurrentStep(0);setPlaying(false);}} className={algorithm==='dijkstra'?'selected cyan':''}>◎ Dijkstra {algorithm==='dijkstra'?'✓':''}</button><button onClick={()=>{setAlgorithm('astar');setResult(null);setCurrentStep(0);setPlaying(false);}} className={algorithm==='astar'?'selected purple':''}>✦ A* {algorithm==='astar'?'✓':''}</button></div>:null}
      <div className="maze-surface"><div className="maze-header"><h3>{page===7?(algorithm==='dijkstra'?'◎ Dijkstra':'✦ A*'):'미로 편집 및 대결'}</h3><p>좌표 (행, 열): 왼쪽 위가 (0,0) · 오른쪽으로 열 증가 · 아래로 행 증가</p></div><MazeGrid grid={grid} start={start} end={end} steps={result?.steps??[]} currentStep={currentStep} path={result?.path??[]} onCellClick={editCell}/><p className="grid-hint">각 칸에 마우스를 올리면 (행, 열)을 확인할 수 있어요. 현재: {grid.length}행 × {grid[0].length}열</p></div>
      {page===7?<><button className="primary-action" onClick={runOne}>▶ {algorithm==='dijkstra'?'Dijkstra':'A*'} 탐색 기록 생성</button>{result&&<div className="playback"><div className="stat-row"><div><span>최단 거리</span><strong>{Number.isFinite(result.distance)?`${result.distance}칸`:'경로 없음'}</strong></div><div><span>확정한 정점 (현재 / 전체)</span><strong>{visitor} / {result.visitedCount}</strong></div><div><span>이벤트</span><strong>{currentStep} / {result.steps.length}</strong></div></div><input aria-label="탐색 단계" type="range" min="0" max={result.steps.length} value={currentStep} onChange={e=>{setCurrentStep(Number(e.target.value));setPlaying(false);}}/><div className="play-buttons"><button onClick={()=>{setCurrentStep(0);setPlaying(false);}}>처음</button><button onClick={()=>{setCurrentStep(n=>Math.max(0,n-1));setPlaying(false);}}>← 이전</button><button className="play-primary" onClick={()=>{if(currentStep===result.steps.length)setCurrentStep(0);setPlaying(v=>!v);}}>{playing?'❚❚ 일시정지':'▶ 자동 재생'}</button><button onClick={()=>{setCurrentStep(n=>Math.min(result.steps.length,n+1));setPlaying(false);}}>다음 →</button><button onClick={()=>{setCurrentStep(result.steps.length);setPlaying(false);}}>결과</button><label>속도 <select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={650}>느리게</option><option value={360}>보통</option><option value={120}>빠르게</option></select></label></div><div className="step-explanation"><strong>STEP {currentStep} · 지금 무엇을 했고, 왜?</strong><p>{getDescription(result,currentStep,algorithm)}</p></div></div>}</>:<><button className="primary-action" onClick={runBattle}>⚔ 두 알고리즘 동시에 계산하기</button>{battle&&<div className="battle-result"><div className="stat-row"><div><span>Dijkstra · 확정 정점</span><strong>{battle.d.visitedCount}개</strong></div><div><span>A* · 확정 정점</span><strong>{battle.a.visitedCount}개</strong></div><div><span>최단 거리</span><strong>{Number.isFinite(battle.d.distance)?`${battle.d.distance}칸`:'경로 없음'}</strong></div></div><p>두 알고리즘이 찾은 경로 길이: {Number.isFinite(battle.d.distance)?`${battle.d.distance} / ${battle.a.distance}`:'양쪽 모두 경로 없음'}. 탐색 횟수는 미로 구조, 종료 시점, 동일 우선순위의 처리 순서에 따라 달라집니다.</p></div>}</>}
      {page===7&&<section className="info-panel"><h3>두 가지 미로를 모두 제공해요</h3><p><strong>2×4 미로</strong>는 정점 8개로 과제의 작은 입력 조건을 충족합니다. <strong>8×8 미로</strong>는 정점 64개이므로 추가 심화 체험용입니다. 과제 제출용 다이어그램은 7페이지의 가중 그래프와 함께 활용할 수 있어요.</p></section>}
    </>}

    {page===1 && <><h1>Dijkstra를 처음부터,<br/><em>차근차근.</em></h1><p className="lead">교수님 강의에서 배운 Y, length, touch를 실제 그래프에 연결해 이해해요.</p><div className="intro-grid"><article className="feature-card cyan"><h2>① 문제는 무엇일까?</h2><p>음수 간선이 없는 가중 그래프에서 시작점 A부터 다른 정점까지의 최단 거리를 찾는 문제예요. 간선 숫자는 이동 비용을 나타냅니다.</p><div className="equation">A → B(4) → D(2) = 총 6</div></article><article className="feature-card purple"><h2>② Greedy 선택</h2><p>아직 확정하지 않은 정점 중 시작점으로부터의 거리 후보가 가장 짧은 정점을 선택해요. 비음수 가중치 덕분에 이 거리를 확정할 수 있어요.</p><div className="equation">다음 정점 = min length[i]</div></article></div><section className="info-panel"><h3>강의 자료의 세 가지 핵심 기호</h3><p><strong>Y</strong>: 최단 거리가 확정된 정점 집합. 처음에는 시작점만 들어 있어요.</p><p><strong>length[i]</strong>: 출발점부터 정점 i까지 현재 알려진 최단 거리 후보. 최초에는 직접 연결된 간선 비용 또는 ∞예요.</p><p><strong>touch[i]</strong>: 현재 최단 경로 후보에서 i 바로 앞에 오는 정점. 실제 최단 경로를 역추적할 때 사용해요.</p></section><div className="info-panel"><h3>쉬운 예시: 왜 length가 바뀔까?</h3><p>A → D 직접 가는 길이 9인데, A → B가 3이고 B → D가 2라면 새 경로 비용은 3+2=5예요. 기존 9보다 작아서 <strong>length[D]: 9 → 5</strong>, <strong>touch[D]: A → B</strong>로 고쳐요.</p></div></>}
    {page===3 && <><h1>A*는 어떻게<br/><em>목표를 향할까?</em></h1><p className="lead">Dijkstra와 같은 최단 경로 문제를 풀지만, 목적지까지 남은 비용을 예상하여 탐색 우선순위를 바꿔요.</p><div className="intro-grid"><article className="feature-card cyan"><h2>g(n) · 이미 온 거리</h2><p>출발점에서 현재 정점까지 실제로 찾은 경로 비용이에요. Dijkstra의 length와 대응해요.</p><div className="equation">g(n) = 지금까지의 비용</div></article><article className="feature-card purple"><h2>h(n) · 남은 거리 예상</h2><p>현재 정점에서 목적지까지 얼마나 더 걸릴지 추정한 비용이에요. 실제 최단 비용보다 크게 추정하지 않으면 admissible 휴리스틱이에요.</p><div className="equation">f(n) = g(n) + h(n)</div></article></div><section className="info-panel"><h3>A*의 판단 기준은 f(n)</h3><p>후보 P: g=2, h=9라면 f=11. 후보 Q: g=4, h=3이라면 f=7. Dijkstra는 P를 먼저 고르지만, A*는 <strong>Q를 먼저 고릅니다.</strong> f는 예상 총비용이기 때문이에요.</p><p>다만 h가 정확하지 않거나 최단 비용을 과대평가하면 최적성을 잃을 수 있어요. A*가 무조건 빠르다는 뜻도 아니에요.</p></section></>}
    {page===4 && <><h1>A*도 단계별로,<br/><em>선택의 이유까지.</em></h1><p className="lead">A*는 발견한 경로 비용 g를 갱신하면서 목표까지의 추정치 h를 더해 다음 정점을 고릅니다.</p><div className="info-panel"><h3>실행 순서</h3><p><strong>1.</strong> 시작 정점의 g=0, 다른 정점은 ∞로 초기화해요.</p><p><strong>2.</strong> 열린 후보 집합(Open)에서 f=g+h가 가장 작은 정점을 선택해요.</p><p><strong>3.</strong> 그 정점의 인접 정점을 살피고, 더 짧은 경로가 발견되면 g·직전 정점을 갱신해요.</p><p><strong>4.</strong> 목표 정점을 선택하면 경로를 역추적해요. 이 사이트는 일관적인 휴리스틱을 사용해 최단 경로를 보장해요.</p></div><CodePanel title="A* 핵심 의사코드">{ASTAR_CODE}</CodePanel><div className="info-panel"><h3>왜 맨해튼 거리를 사용할까?</h3><p>상하좌우로만 움직이는 격자에서는 <strong>h = |행 차이| + |열 차이|</strong>를 사용해요. 벽을 무시하므로 실제 최단 거리보다 커지지 않고, 각 칸의 이동 비용이 1이라면 일관성도 만족합니다.</p><p>h를 전부 0으로 두면 A*의 우선순위가 g만 남아 Dijkstra와 같아져요.</p></div></>}
    {page===6 && <><h1>교수님 강의처럼,<br/><em>그래프를 한 단계씩.</em></h1><p className="lead">총 6개 정점과 간선 가중치로 구성한 과제용 핵심 다이어그램입니다. Y, length, touch 변화를 직접 확인하세요.</p><GraphLesson/><section className="info-panel"><h3>강의 PPT와 연결하기</h3><p>수업에서는 정점 집합 Y, 거리 배열 length, 이전 정점 touch를 사용했죠. 여기서는 같은 개념으로 실제 최단 경로 갱신을 확인하고, A*는 f=g+h를 추가해서 비교해요.</p><p>※ 이 예시의 간선은 이해를 위해 양방향으로 구성했습니다. 강의의 방향 그래프와는 간선 방향 조건이 다르지만 핵심 갱신 원리는 같습니다.</p></section></>}
    {page===8 && <><h1>똑같은 미로에서,<br/><em>두 방식의 승부.</em></h1><p className="lead">8×8 격자에서 Dijkstra와 A*를 동시에 계산하고, 각각의 탐색 흔적을 나란히 비교해요.</p><button className="primary-action" onClick={runBattle}>⚔ 같은 미로에서 동시 실행</button>{battle ? <><div className="battle-grid"><div className="maze-surface"><h3>◎ Dijkstra</h3><MazeGrid grid={grid} start={start} end={end} steps={battle.d.steps} currentStep={battle.d.steps.length} path={battle.d.path}/><p>확정 정점 {battle.d.visitedCount}개 · 최단 거리 {Number.isFinite(battle.d.distance)?battle.d.distance:'없음'}</p></div><div className="maze-surface"><h3>✦ A*</h3><MazeGrid grid={grid} start={start} end={end} steps={battle.a.steps} currentStep={battle.a.steps.length} path={battle.a.path}/><p>확정 정점 {battle.a.visitedCount}개 · 최단 거리 {Number.isFinite(battle.a.distance)?battle.a.distance:'없음'}</p></div></div><section className="info-panel"><h3>결과 해석</h3><p>두 알고리즘이 구한 최단 거리: Dijkstra <strong>{Number.isFinite(battle.d.distance)?battle.d.distance:'경로 없음'}</strong>, A* <strong>{Number.isFinite(battle.a.distance)?battle.a.distance:'경로 없음'}</strong>. 두 방법의 방문 정점 수는 미로 구조와 동점 처리 순서에 따라 달라질 수 있어요.</p></section></>:<div className="info-panel"><p>동시 실행 버튼을 누르면 같은 지도에서 두 알고리즘을 계산해요. 여기서는 8페이지에서 편집한 미로가 그대로 사용돼요.</p></div>}</>}
    {page===9 && <><h1>한 번의 결과를 넘어,<br/><em>반복 실험으로.</em></h1><p className="lead">기본 미로의 탐색 정점 수와 최단 거리 차이를 비교하고, 설계한 탐색 실험을 정리해 보세요.</p><div className="info-panel"><h3>실험 설계: 무엇을 같게 유지할까?</h3><p>시작점과 도착점, 이동 규칙(상하좌우), 장애물 배치, 이동 비용을 같게 유지해야 공정한 비교가 됩니다. 방문 정점 수를 비교하면 알고리즘의 탐색 범위 차이를 확인할 수 있어요.</p></div><button className="primary-action" onClick={runBattle}>현재 미로에서 실험 실행</button>{battle&&<div className="stat-row"><div><span>Dijkstra 방문 정점</span><strong>{battle.d.visitedCount}</strong></div><div><span>A* 방문 정점</span><strong>{battle.a.visitedCount}</strong></div><div><span>거리 일치 여부</span><strong>{battle.d.distance===battle.a.distance?'일치':'검증 필요'}</strong></div></div>}<section className="info-panel"><h3>보고서에 담을 분석 질문</h3><p>두 알고리즘은 왜 같은 최단 거리를 얻었는가? A*가 탐색을 덜 했다면 목표점까지의 추정값이 어떤 도움을 주었는가? 장애물의 위치를 바꾸면 탐색 수가 어떻게 달라지는가?</p><p>사이트의 단일 실험 결과와 일반적인 시간복잡도는 서로 다른 개념입니다. 속도에 관한 결론은 반복 측정한 뒤 내릴 수 있어요.</p></section></>}
    <footer className="page-footer"><button disabled={page===0} onClick={previous}>← 이전 페이지</button><div>{PAGES.map((_,i)=><span key={i} className={i===page?'current':''}/>)}</div><button className="next-page" disabled={page===PAGES.length-1} onClick={next}>{page===PAGES.length-1?'마지막 페이지':'다음 페이지 →'}</button></footer>
   </main>
  </div>
 </div>;
}
