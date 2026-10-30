import { useMemo, useState } from 'react';

const vertices = [
 {id:'A',x:75,y:78},{id:'B',x:260,y:40},{id:'C',x:100,y:230},
 {id:'D',x:302,y:176},{id:'E',x:465,y:66},{id:'F',x:490,y:232},
];
const edges = [
 ['A','B',4],['A','C',2],['B','C',1],['B','D',5],['C','D',8],
 ['B','E',8],['D','E',2],['D','F',3],['E','F',2],['C','F',12],
];
const byId = Object.fromEntries(vertices.map(v=>[v.id,v]));
const h = id => Math.hypot(byId[id].x - byId.F.x,byId[id].y - byId.F.y) / 250;
function solve(useAstar) {
 const distance=Object.fromEntries(vertices.map(v=>[v.id,Infinity]));
 const touch=Object.fromEntries(vertices.map(v=>[v.id,'—']));
 const settled=[];const snapshots=[]; distance.A=0;
 const snap=(kind,focus,detail,edge=null)=>snapshots.push({kind,focus,detail,edge,dist:{...distance},touch:{...touch},settled:[...settled]});
 snap('init',null,'출발점 A의 length[A]를 0으로, 나머지는 ∞로 초기화합니다. touch는 아직 정해지지 않았습니다.');
 while(settled.length<vertices.length){
   const available=vertices.filter(v=>!settled.includes(v.id)&&Number.isFinite(distance[v.id]));
   if(!available.length)break;
   available.sort((a,b)=>(distance[a.id]+(useAstar?h(a.id):0))-(distance[b.id]+(useAstar?h(b.id):0))||a.id.localeCompare(b.id));
   const u=available[0].id;settled.push(u);
   snap('select',u,`${u} 선택: ${useAstar?`g=${distance[u]}, h≈${h(u).toFixed(2)}, f≈${(distance[u]+h(u)).toFixed(2)}`:`length=${distance[u]}`}가 현재 후보 중 최소입니다. ${u}를 확정 집합 Y에 추가합니다.`);
   if(useAstar&&u==='F')break;
   for(const [a,b,w] of edges){
     const v=a===u?b:b===u?a:null;
     if(!v||settled.includes(v))continue;
     const old=distance[v],candidate=distance[u]+w;
     if(candidate<old){distance[v]=candidate;touch[v]=u;
       snap('update',v,`${u} → ${v} (가중치 ${w}): 기존 거리 ${Number.isFinite(old)?old:'∞'}보다 ${distance[u]} + ${w} = ${candidate}이 작으므로 length[${v}]를 갱신하고 touch[${v}]=${u}로 기록합니다.`,[u,v]);
     }
   }
 }
 const path=[];if(Number.isFinite(distance.F)){let p='F';while(p){path.unshift(p);p=touch[p]==='—'?null:touch[p];}}
 snap('done','F',`완료! A에서 F까지 최단 거리는 ${distance.F}이며 경로는 ${path.join(' → ')}입니다.`);
 return {snapshots,path,distance:distance.F,settledCount:settled.length};
}
export default function GraphLesson(){
 const [algo,setAlgo]=useState('dijkstra');const [step,setStep]=useState(0);
 const d=useMemo(()=>solve(false),[]);const a=useMemo(()=>solve(true),[]);
 const data=algo==='dijkstra'?d:a;const current=data.snapshots[Math.min(step,data.snapshots.length-1)];
 const y=new Set(current.settled);const pathPairs=new Set(data.path.slice(1).map((v,i)=>[data.path[i],v].sort().join('-')));
 return <div className="graph-lesson">
  <div className="sim-select"><button className={algo==='dijkstra'?'selected cyan':''} onClick={()=>{setAlgo('dijkstra');setStep(0);}}>◎ Dijkstra {algo==='dijkstra'?'✓':''}</button><button className={algo==='astar'?'selected purple':''} onClick={()=>{setAlgo('astar');setStep(0);}}>✦ A* {algo==='astar'?'✓':''}</button></div>
  <div className="graph-layout">
   <div className="graph-card"><svg viewBox="0 0 560 295" role="img" aria-label="6개 정점과 가중치 간선으로 구성된 그래프">
    {edges.map(([u,v,w])=>{const p=byId[u],q=byId[v],active=current.edge?.includes(u)&&current.edge?.includes(v),final=current.kind==='done'&&pathPairs.has([u,v].sort().join('-'));return <g key={u+v}><line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={active?'#facc15':final?'#34d399':'#52627f'} strokeWidth={active||final?5:2.5}/><rect x={(p.x+q.x)/2-12} y={(p.y+q.y)/2-12} rx="6" width="24" height="22" fill="#16223a"/><text x={(p.x+q.x)/2} y={(p.y+q.y)/2+4} textAnchor="middle" fill="#e2e8f0" fontSize="14">{w}</text></g>})}
    {vertices.map(v=><g key={v.id}><circle cx={v.x} cy={v.y} r="23" fill={current.focus===v.id?'#facc15':y.has(v.id)?'#38bdf8':v.id==='A'?'#10b981':v.id==='F'?'#fb7185':'#283b59'} stroke="#edf4ff" strokeWidth="1.6"/><text x={v.x} y={v.y+5} textAnchor="middle" fill={current.focus===v.id?'#102033':'#ffffff'} fontWeight="700" fontSize="16">{v.id}</text></g>)}
   </svg><div className="graph-legend"><span>🟡 현재 처리</span><span>🔵 확정된 정점 Y</span><span>🟢 출발점 A</span><span>🔴 도착점 F</span></div></div>
   <div className="graph-data"><h3>현재 자료구조</h3><p>Y = {'{'}{current.settled.join(', ') || '∅'}{'}'}</p><div className="table-frame"><table><thead><tr><th>정점</th><th>length / g</th><th>touch</th>{algo==='astar'&&<th>f=g+h</th>}</tr></thead><tbody>{vertices.map(v=><tr key={v.id} className={current.focus===v.id?'focus-row':''}><td>{v.id}</td><td>{Number.isFinite(current.dist[v.id])?current.dist[v.id]:'∞'}</td><td>{current.touch[v.id]}</td>{algo==='astar'&&<td>{Number.isFinite(current.dist[v.id])?(current.dist[v.id]+h(v.id)).toFixed(2):'∞'}</td>}</tr>)}</tbody></table></div><p className="muted-note">length는 출발점부터의 현재 최단 거리 후보, touch는 직전 정점이야. A*에서는 length와 같은 뜻으로 g를 사용해.</p></div>
  </div>
  <div className="playback"><div className="step-heading"><strong>다이어그램 단계 {step+1} / {data.snapshots.length}</strong><span>{current.kind==='select'?'정점 선택':current.kind==='update'?'거리 갱신':current.kind==='done'?'최단 경로 완성':'초기화'}</span></div><input aria-label="그래프 단계" type="range" min="0" max={data.snapshots.length-1} value={step} onChange={e=>setStep(Number(e.target.value))}/><div className="play-buttons"><button onClick={()=>setStep(0)}>처음</button><button disabled={step===0} onClick={()=>setStep(s=>s-1)}>← 이전</button><button className="play-primary" disabled={step>=data.snapshots.length-1} onClick={()=>setStep(s=>s+1)}>다음 단계 →</button><button onClick={()=>setStep(data.snapshots.length-1)}>결과 보기</button></div><div className="step-explanation"><strong>지금 무엇을 했고, 왜?</strong><p>{current.detail}</p></div></div>
 </div>;
}
