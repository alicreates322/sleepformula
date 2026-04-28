import { useState, useEffect, useRef } from “react”;

const TOOLS = [“Sleep Calculator”, “Sleep Debt”, “Chronotype Quiz”, “Sleep Score”, “Caffeine Cutoff”];

// ── palette ──────────────────────────────────────────────────────────────────
const C = {
bg: “#000000”,
surface: “#111111”,
surfaceHigh: “#1a1a1a”,
border: “#333300”,
accent: “#FFD700”,
accentDim: “#996600”,
accentSoft: “rgba(255,215,0,0.12)”,
text: “#FFD700”,
muted: “#CCAA00”,
danger: “#f27d6a”,
warn: “#f5a623”,
good: “#a8e063”,
};

const css = `@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap'); *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } html { scroll-behavior: smooth; } body { background: ${C.bg}; color: ${C.text}; font-family: 'DM Sans', sans-serif; font-size: 15px; line-height: 1.6; } ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: ${C.bg}; } ::-webkit-scrollbar-thumb { background: ${C.accentDim}; border-radius: 3px; } @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } } @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,215,0,0.3); } 50% { box-shadow: 0 0 0 10px rgba(255,215,0,0); } } @keyframes starTwinkle { 0%,100%{opacity:0.3} 50%{opacity:1} } .fade-up { animation: fadeUp 0.5s ease forwards; } input[type=range] { -webkit-appearance:none; width:100%; height:4px; background: ${C.border}; border-radius:2px; outline:none; } input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:${C.accent}; cursor:pointer; box-shadow:0 0 8px rgba(255,215,0,0.5); } input[type=time], input[type=number] { background:${C.surface}; border:1px solid ${C.border}; color:#FFD700; padding:10px 14px; border-radius:8px; font-size:15px; font-family:'DM Sans',sans-serif; outline:none; width:100%; } input[type=time]:focus, input[type=number]:focus { border-color:${C.accent}; } select { background:${C.surface}; border:1px solid ${C.border}; color:#FFD700; padding:10px 14px; border-radius:8px; font-size:15px; font-family:'DM Sans',sans-serif; outline:none; width:100%; cursor:pointer; } select:focus { border-color:${C.accent}; }`;

// ── tiny components ───────────────────────────────────────────────────────────
function Stars() {
const stars = Array.from({length:40},(_,i)=>({
x: Math.random()*100, y: Math.random()*100,
s: Math.random()*2+0.5, d: Math.random()*4+2
}));
return (
<div style={{position:“fixed”,inset:0,pointerEvents:“none”,zIndex:0}}>
{stars.map((s,i)=>(
<div key={i} style={{
position:“absolute”, left:`${s.x}%`, top:`${s.y}%`,
width:s.s, height:s.s, borderRadius:“50%”,
background:C.accent, opacity:0.4,
animation:`starTwinkle ${s.d}s ease-in-out infinite`,
animationDelay:`${Math.random()*4}s`
}}/>
))}
</div>
);
}

function Btn({children, onClick, style={}, variant=“primary”}) {
const base = {
padding:“11px 24px”, borderRadius:“8px”, border:“none”,
fontFamily:”‘DM Sans’,sans-serif”, fontSize:“14px”, fontWeight:500,
cursor:“pointer”, transition:“all 0.2s”, display:“inline-flex”,
alignItems:“center”, gap:“8px”, …style
};
const variants = {
primary: { background:C.accent, color:C.bg },
ghost: { background:“transparent”, color:C.accent, border:`1px solid ${C.accentDim}` },
danger: { background:“transparent”, color:C.danger, border:`1px solid rgba(242,125,106,0.3)` },
};
return <button onClick={onClick} style={{...base,...variants[variant]}}>{children}</button>;
}

function Card({children, style={}, className=””}) {
return (
<div className={className} style={{
background:C.surface, border:`1px solid ${C.border}`,
borderRadius:“16px”, padding:“28px”, …style
}}>
{children}
</div>
);
}

function Label({children}) {
return <div style={{fontSize:“12px”,fontWeight:600,letterSpacing:“0.08em”,color:C.muted,textTransform:“uppercase”,marginBottom:“8px”}}>{children}</div>;
}

function SectionTitle({icon, title, sub}) {
return (
<div style={{marginBottom:“28px”}}>
<div style={{fontSize:“28px”,marginBottom:“8px”}}>{icon}</div>
<h2 style={{fontFamily:”‘DM Serif Display’,serif”,fontSize:“clamp(22px,4vw,32px)”,color:C.text,marginBottom:“6px”}}>{title}</h2>
<p style={{color:C.muted,fontSize:“14px”,maxWidth:“480px”}}>{sub}</p>
</div>
);
}

function ResultPill({color, label}) {
const colors = { green:C.good, yellow:C.warn, red:C.danger, cyan:C.accent };
const c = colors[color]||C.accent;
return (
<span style={{
display:“inline-block”, padding:“4px 14px”, borderRadius:“20px”,
background:`${c}18`, color:c, fontSize:“13px”, fontWeight:600,
border:`1px solid ${c}40`
}}>{label}</span>
);
}

// ══ TOOL 1: Sleep Calculator ══════════════════════════════════════════════════
function SleepCalculator() {
const [mode, setMode] = useState(“wakeup”); // wakeup | bedtime
const [time, setTime] = useState(“07:00”);
const [results, setResults] = useState(null);

const CYCLE = 90; // minutes

function calcWakeup() {
const [h,m] = time.split(”:”).map(Number);
const wake = h*60+m;
const times = [];
for(let cycles=6;cycles>=3;cycles–) {
let bed = wake - cycles*CYCLE - 15;
if(bed<0) bed+=1440;
const bh = Math.floor(bed/60)%24, bm = bed%60;
times.push({
label:`${String(bh).padStart(2,"0")}:${String(bm).padStart(2,"0")}`,
cycles, hours:(cycles*CYCLE/60).toFixed(1),
quality: cycles>=5?“Excellent”:cycles===4?“Good”:“Minimum”
});
}
setResults({mode:“wakeup”, times, target:time});
}

function calcBedtime() {
const [h,m] = time.split(”:”).map(Number);
const bed = h*60+m;
const times = [];
for(let cycles=6;cycles>=3;cycles–) {
let wake = bed + cycles*CYCLE + 15;
if(wake>=1440) wake-=1440;
const wh = Math.floor(wake/60)%24, wm = wake%60;
times.push({
label:`${String(wh).padStart(2,"0")}:${String(wm).padStart(2,"0")}`,
cycles, hours:(cycles*CYCLE/60).toFixed(1),
quality: cycles>=5?“Excellent”:cycles===4?“Good”:“Minimum”
});
}
setResults({mode:“bedtime”, times, target:time});
}

const qColor = {Excellent:“green”, Good:“cyan”, Minimum:“yellow”};

return (
<div className="fade-up">
<SectionTitle icon="🌙" title="Sleep Cycle Calculator"
sub="Based on 90-minute sleep cycles. Wake up refreshed by timing your alarm to the end of a cycle." />

```
  <div style={{display:"flex",gap:"8px",marginBottom:"24px"}}>
    {["wakeup","bedtime"].map(m=>(
      <button key={m} onClick={()=>{setMode(m);setResults(null);}} style={{
        padding:"9px 20px", borderRadius:"8px", border:`1px solid ${mode===m?C.accent:C.border}`,
        background:mode===m?C.accentSoft:"transparent", color:mode===m?C.accent:C.muted,
        fontFamily:"'DM Sans',sans-serif", fontSize:"14px", cursor:"pointer", fontWeight:500
      }}>
        {m==="wakeup"?"I want to wake up at…":"I want to go to bed at…"}
      </button>
    ))}
  </div>

  <Card style={{marginBottom:"20px",maxWidth:"400px"}}>
    <Label>{mode==="wakeup"?"Wake-up Time":"Bedtime"}</Label>
    <input type="time" value={time} onChange={e=>setTime(e.target.value)} />
    <Btn onClick={mode==="wakeup"?calcWakeup:calcBedtime} style={{marginTop:"16px",width:"100%",justifyContent:"center"}}>
      Calculate Sleep Times
    </Btn>
  </Card>

  {results && (
    <div className="fade-up">
      <p style={{color:C.muted,fontSize:"13px",marginBottom:"16px"}}>
        {results.mode==="wakeup"
          ? `To wake up at ${results.target}, go to bed at:`
          : `If you go to bed at ${results.target}, wake up at:`}
      </p>
      <div style={{display:"grid",gap:"10px"}}>
        {results.times.map((t,i)=>(
          <Card key={i} style={{padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"8px"}}>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"26px",color:C.accent}}>{t.label}</div>
            <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
              <span style={{color:C.muted,fontSize:"13px"}}>{t.cycles} cycles · {t.hours}h</span>
              <ResultPill color={qColor[t.quality]} label={t.quality} />
            </div>
          </Card>
        ))}
      </div>
      <Card style={{marginTop:"16px",background:C.accentSoft,borderColor:C.accentDim}}>
        <p style={{fontSize:"13px",color:C.muted}}>
          💡 <strong style={{color:C.text}}>Pro tip:</strong> Add 15 minutes to your bedtime for the time it takes to fall asleep. Most adults complete a full sleep cycle every 90 minutes.
        </p>
      </Card>
    </div>
  )}
</div>
```

);
}

// ══ TOOL 2: Sleep Debt Tracker ════════════════════════════════════════════════
function SleepDebtTracker() {
const days = [“Mon”,“Tue”,“Wed”,“Thu”,“Fri”,“Sat”,“Sun”];
const [hours, setHours] = useState({Mon:7,Tue:6,Wed:6.5,Thu:7,Fri:5.5,Sat:8,Sun:7.5});
const [target, setTarget] = useState(8);
const [result, setResult] = useState(null);

function calculate() {
const totalSlept = Object.values(hours).reduce((a,b)=>a+parseFloat(b),0);
const totalNeeded = target * 7;
const debt = totalNeeded - totalSlept;
setResult({debt, totalSlept, totalNeeded, avg:(totalSlept/7).toFixed(1)});
}

const debtColor = result ? (result.debt<=0?“green”:result.debt<=5?“yellow”:“red”) : “cyan”;

return (
<div className="fade-up">
<SectionTitle icon="📊" title="Sleep Debt Tracker"
sub="Track how much sleep you've accumulated or lost this week. Sleep debt has real health consequences." />

```
  <div style={{display:"grid",gap:"16px",marginBottom:"20px"}}>
    <Card>
      <Label>Your Sleep Goal (hours per night)</Label>
      <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
        <input type="range" min="6" max="10" step="0.5" value={target}
          onChange={e=>setTarget(parseFloat(e.target.value))} style={{flex:1}} />
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"28px",color:C.accent,minWidth:"50px",textAlign:"center"}}>
          {target}h
        </div>
      </div>
    </Card>

    <Card>
      <Label>Hours Slept Each Night This Week</Label>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"8px",marginTop:"8px"}}>
        {days.map(d=>(
          <div key={d} style={{textAlign:"center"}}>
            <div style={{fontSize:"11px",color:C.muted,marginBottom:"4px",fontWeight:600}}>{d}</div>
            <input type="number" min="0" max="12" step="0.5" value={hours[d]}
              onChange={e=>setHours(h=>({...h,[d]:parseFloat(e.target.value)||0}))}
              style={{textAlign:"center",padding:"8px 4px",width:"100%"}} />
          </div>
        ))}
      </div>
      <Btn onClick={calculate} style={{marginTop:"20px",width:"100%",justifyContent:"center"}}>
        Calculate My Sleep Debt
      </Btn>
    </Card>
  </div>

  {result && (
    <div className="fade-up" style={{display:"grid",gap:"12px",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))"}}>
      <Card style={{textAlign:"center",background:C.accentSoft,borderColor:C.accentDim}}>
        <div style={{fontSize:"12px",color:C.muted,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"8px"}}>Avg per night</div>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"40px",color:C.accent}}>{result.avg}h</div>
      </Card>
      <Card style={{textAlign:"center"}}>
        <div style={{fontSize:"12px",color:C.muted,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"8px"}}>Total slept</div>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"40px",color:C.text}}>{result.totalSlept.toFixed(1)}h</div>
      </Card>
      <Card style={{textAlign:"center",gridColumn:"span 1"}}>
        <div style={{fontSize:"12px",color:C.muted,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"8px"}}>Sleep {result.debt>0?"Debt":"Surplus"}</div>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"40px",color:result.debt>0?C.danger:C.good}}>
          {Math.abs(result.debt).toFixed(1)}h
        </div>
        <ResultPill color={debtColor} label={result.debt<=0?"On Track":result.debt<=5?"Moderate Debt":"High Debt"} />
      </Card>
      <Card style={{gridColumn:"1/-1"}}>
        <p style={{fontSize:"13px",color:C.muted,lineHeight:"1.7"}}>
          {result.debt<=0
            ? "✅ Great work! You're meeting your sleep goal this week. Keep it up — consistent sleep is one of the strongest predictors of long-term health."
            : result.debt<=5
            ? "⚠️ You have a moderate sleep debt. Try going to bed 30–45 minutes earlier for the next few nights to recover gradually."
            : "🚨 High sleep debt detected. Chronic sleep deprivation impacts memory, immunity, mood, and metabolism. Prioritize sleep this weekend and aim for consistency next week."}
        </p>
      </Card>
    </div>
  )}
</div>
```

);
}

// ══ TOOL 3: Chronotype Quiz ═══════════════════════════════════════════════════
function ChronotypeQuiz() {
const questions = [
{q:“What time would you naturally wake up if you had no alarm?”,
options:[“Before 6am”,“6–7am”,“7–8:30am”,“8:30–10am”,“After 10am”],
scores:[0,1,2,3,4]},
{q:“When do you feel most alert and focused?”,
options:[“5–9am”,“9am–12pm”,“12–3pm”,“3–7pm”,“After 7pm”],
scores:[0,1,2,3,4]},
{q:“If you had to take an important exam, when would you perform best?”,
options:[“7–8am”,“9am”,“11am”,“3pm”,“7pm”],
scores:[0,0,1,2,4]},
{q:“When do you typically start feeling tired in the evening?”,
options:[“Before 9pm”,“9–10pm”,“10–11pm”,“11pm–1am”,“After 1am”],
scores:[0,1,2,3,4]},
{q:“How easy is it for you to wake up early?”,
options:[“Very easy”,“Easy”,“Moderate”,“Hard”,“Very hard”],
scores:[0,1,2,3,4]},
];

const [answers, setAnswers] = useState(Array(questions.length).fill(null));
const [result, setResult] = useState(null);

function calculate() {
if(answers.some(a=>a===null)) return;
const total = answers.reduce((sum,a,i)=>sum+questions[i].scores[a],0);
let type;
if(total<=4) type=“lion”;
else if(total<=9) type=“bear”;
else if(total<=13) type=“wolf”;
else type=“dolphin”;
setResult({total, type});
}

const types = {
lion: {emoji:“🦁”,name:“Lion (Early Bird)”,color:C.warn,
desc:“You wake naturally before the sun and feel most productive in the morning. Leaders and high achievers often fall into this type.”,
peak:“6am–12pm”,tips:[“Schedule deep work in the morning”,“Wind down by 9pm”,“Avoid late social events on weekdays”]},
bear: {emoji:“🐻”,name:“Bear (Middle Ground)”,color:C.accent,
desc:“Your rhythm follows the solar cycle — up with the sun, tired after dark. The most common type, around 55% of people are bears.”,
peak:“9am–2pm”,tips:[“Best meetings: mid-morning”,“Use post-lunch dip for admin tasks”,“Aim for 10:30–11pm bedtime”]},
wolf: {emoji:“🐺”,name:“Wolf (Night Owl)”,color:”#a78bfa”,
desc:“You come alive at night. Creative work flows late. Society’s 9–5 schedule is your nemesis, but your creative output at midnight is unmatched.”,
peak:“5pm–12am”,tips:[“Protect your mornings (don’t schedule calls)”,“Use afternoons for collaboration”,“Consider a later work schedule if possible”]},
dolphin: {emoji:“🐬”,name:“Dolphin (Light Sleeper)”,color:C.danger,
desc:“Irregular sleep patterns, light sleeping, often anxious about sleep itself. Dolphins are intelligent, driven perfectionists.”,
peak:“Variable”,tips:[“Strict consistent sleep/wake times”,“Avoid checking the clock at night”,“Limit screen time 1 hour before bed”]},
};

return (
<div className="fade-up">
<SectionTitle icon="🦁" title="Chronotype Quiz"
sub="Discover your biological clock type. Your chronotype affects when you should sleep, work, exercise, and eat." />

```
  <div style={{display:"grid",gap:"16px",marginBottom:"20px"}}>
    {questions.map((q,qi)=>(
      <Card key={qi}>
        <Label>Question {qi+1} of {questions.length}</Label>
        <p style={{marginBottom:"14px",fontWeight:500,color:C.text}}>{q.q}</p>
        <div style={{display:"grid",gap:"8px"}}>
          {q.options.map((opt,oi)=>(
            <button key={oi} onClick={()=>{const a=[...answers];a[qi]=oi;setAnswers(a);}} style={{
              padding:"10px 16px", borderRadius:"8px", textAlign:"left",
              border:`1px solid ${answers[qi]===oi?C.accent:C.border}`,
              background:answers[qi]===oi?C.accentSoft:"transparent",
              color:answers[qi]===oi?C.accent:C.muted,
              fontFamily:"'DM Sans',sans-serif", fontSize:"14px", cursor:"pointer",
              transition:"all 0.15s"
            }}>{opt}</button>
          ))}
        </div>
      </Card>
    ))}
  </div>

  <Btn onClick={calculate}
    style={{width:"100%",justifyContent:"center",opacity:answers.some(a=>a===null)?0.5:1}}
    disabled={answers.some(a=>a===null)}>
    Reveal My Chronotype
  </Btn>

  {result && (
    <div className="fade-up" style={{marginTop:"20px"}}>
      <Card style={{borderColor:types[result.type].color,background:`${types[result.type].color}10`}}>
        <div style={{fontSize:"48px",marginBottom:"8px"}}>{types[result.type].emoji}</div>
        <h3 style={{fontFamily:"'DM Serif Display',serif",fontSize:"24px",color:types[result.type].color,marginBottom:"8px"}}>
          {types[result.type].name}
        </h3>
        <p style={{color:C.muted,fontSize:"14px",lineHeight:"1.7",marginBottom:"16px"}}>{types[result.type].desc}</p>
        <div style={{display:"grid",gap:"8px"}}>
          <div style={{display:"flex",gap:"12px",alignItems:"center"}}>
            <span style={{fontSize:"12px",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:C.muted}}>Peak Hours</span>
            <ResultPill color="cyan" label={types[result.type].peak} />
          </div>
          <div>
            <Label>Personalised Tips</Label>
            {types[result.type].tips.map((tip,i)=>(
              <div key={i} style={{display:"flex",gap:"8px",marginBottom:"6px",color:C.muted,fontSize:"14px"}}>
                <span style={{color:types[result.type].color}}>→</span>{tip}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )}
</div>
```

);
}

// ══ TOOL 4: Sleep Quality Score ═══════════════════════════════════════════════
function SleepScoreTool() {
const questions = [
{q:“How long does it usually take you to fall asleep?”,
options:[“Less than 10 min”,“10–20 min”,“20–30 min”,“30–60 min”,“Over 60 min”],
scores:[10,8,5,2,0]},
{q:“How often do you wake up during the night?”,
options:[“Never”,“Once”,“2–3 times”,“4–5 times”,“More than 5 times”],
scores:[10,8,5,2,0]},
{q:“How refreshed do you feel when you wake up?”,
options:[“Very refreshed”,“Fairly refreshed”,“Neutral”,“Tired”,“Exhausted”],
scores:[10,7,5,2,0]},
{q:“How consistent is your sleep schedule?”,
options:[“Same time every day”,“Mostly consistent”,“Varies by 1–2 hours”,“Varies by 2–4 hours”,“No pattern”],
scores:[10,8,5,2,0]},
{q:“Do you use screens in the hour before bed?”,
options:[“Never”,“Rarely”,“Sometimes”,“Often”,“Always”],
scores:[10,8,5,2,0]},
{q:“How often do you consume caffeine after 2pm?”,
options:[“Never”,“Rarely”,“Sometimes (1–2x/week)”,“Often (3–5x/week)”,“Daily”],
scores:[10,8,5,2,0]},
{q:“How dark and quiet is your sleep environment?”,
options:[“Completely dark & silent”,“Mostly dark & quiet”,“Some light or noise”,“Light and noisy”,“Very bright or loud”],
scores:[10,8,5,2,0]},
];

const [answers, setAnswers] = useState(Array(questions.length).fill(null));
const [result, setResult] = useState(null);

function calculate() {
if(answers.some(a=>a===null)) return;
const score = answers.reduce((sum,a,i)=>sum+questions[i].scores[a],0);
const pct = Math.round((score/70)*100);
setResult({score,pct});
}

const scoreInfo = result ? (
result.pct>=80 ? {label:“Excellent”,color:“green”,desc:“Your sleep hygiene is outstanding. Keep maintaining these healthy habits.”} :
result.pct>=60 ? {label:“Good”,color:“cyan”,desc:“Your sleep is decent with room to improve. Focus on the areas where you lost points.”} :
result.pct>=40 ? {label:“Fair”,color:“yellow”,desc:“Several factors are undermining your sleep quality. Small changes can make a big difference.”} :
{label:“Poor”,color:“red”,desc:“Your sleep needs serious attention. Consider speaking with a sleep specialist.”}
) : null;

return (
<div className="fade-up">
<SectionTitle icon="⭐" title="Sleep Quality Score"
sub="Answer 7 questions about your sleep habits and get a personalised score with actionable recommendations." />

```
  <div style={{display:"grid",gap:"14px",marginBottom:"20px"}}>
    {questions.map((q,qi)=>(
      <Card key={qi} style={{padding:"20px 24px"}}>
        <p style={{fontWeight:500,marginBottom:"12px",color:C.text,fontSize:"14px"}}>
          <span style={{color:C.accent,fontWeight:700}}>Q{qi+1}.</span> {q.q}
        </p>
        <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
          {q.options.map((opt,oi)=>(
            <button key={oi} onClick={()=>{const a=[...answers];a[qi]=oi;setAnswers(a);}} style={{
              padding:"7px 14px", borderRadius:"20px",
              border:`1px solid ${answers[qi]===oi?C.accent:C.border}`,
              background:answers[qi]===oi?C.accentSoft:"transparent",
              color:answers[qi]===oi?C.accent:C.muted,
              fontFamily:"'DM Sans',sans-serif", fontSize:"13px", cursor:"pointer",
              transition:"all 0.15s", whiteSpace:"nowrap"
            }}>{opt}</button>
          ))}
        </div>
      </Card>
    ))}
  </div>

  <Btn onClick={calculate} style={{width:"100%",justifyContent:"center",opacity:answers.some(a=>a===null)?0.5:1}}>
    Calculate My Sleep Score
  </Btn>

  {result && scoreInfo && (
    <div className="fade-up" style={{marginTop:"20px"}}>
      <Card style={{textAlign:"center",borderColor:C.accentDim,background:C.accentSoft}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"72px",color:C.accent,lineHeight:1}}>{result.pct}</div>
        <div style={{fontSize:"14px",color:C.muted,marginBottom:"12px"}}>out of 100</div>
        <ResultPill color={scoreInfo.color} label={scoreInfo.label} />
        <p style={{marginTop:"16px",color:C.muted,fontSize:"14px",lineHeight:"1.7"}}>{scoreInfo.desc}</p>
      </Card>
      <div style={{marginTop:"12px",display:"grid",gap:"8px"}}>
        {answers.map((a,i)=>questions[i].scores[a]<8&&(
          <Card key={i} style={{padding:"14px 18px",borderLeft:`3px solid ${C.warn}`,background:"transparent"}}>
            <p style={{fontSize:"13px",color:C.muted}}>
              <strong style={{color:C.warn}}>Improvement area:</strong> {questions[i].q}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )}
</div>
```

);
}

// ══ TOOL 5: Caffeine Cutoff ═══════════════════════════════════════════════════
function CaffeineCutoff() {
const [bedtime, setBedtime] = useState(“23:00”);
const [sensitivity, setSensitivity] = useState(“average”);
const [lastCup, setLastCup] = useState(“14:00”);
const [result, setResult] = useState(null);

const HALF_LIFE = {low:4, average:5.5, high:7}; // hours

function calculate() {
const [bh,bm]=bedtime.split(”:”).map(Number);
const bedMins=bh*60+bm;
const hl=HALF_LIFE[sensitivity];
// Want <12.5mg at bedtime (25% of 50mg typical cup)
// 50 * (0.5)^(t/hl) = 12.5 → t = hl * log2(4) = hl*2
const hoursNeeded=hl*2;
let cutoffMins=bedMins-Math.round(hoursNeeded*60);
if(cutoffMins<0) cutoffMins+=1440;
const ch=Math.floor(cutoffMins/60)%24, cm=cutoffMins%60;
const cutoffStr=`${String(ch).padStart(2,"0")}:${String(cm).padStart(2,"0")}`;

```
// Check last cup
const [lh,lm]=lastCup.split(":").map(Number);
const lastMins=lh*60+lm;
const isOk=lastMins<=cutoffMins||(cutoffMins<360&&lastMins>360);

setResult({cutoffStr, hoursNeeded:hoursNeeded.toFixed(1), isOk, hl});
```

}

return (
<div className="fade-up">
<SectionTitle icon="☕" title="Caffeine Cutoff Calculator"
sub="Caffeine has a 5–7 hour half-life. Find out exactly when to stop drinking coffee to fall asleep on time." />

```
  <div style={{display:"grid",gap:"16px",maxWidth:"480px",marginBottom:"20px"}}>
    <Card>
      <Label>Target Bedtime</Label>
      <input type="time" value={bedtime} onChange={e=>setBedtime(e.target.value)} />
    </Card>
    <Card>
      <Label>Caffeine Sensitivity</Label>
      <select value={sensitivity} onChange={e=>setSensitivity(e.target.value)}>
        <option value="low">Low sensitivity (fast metabolizer)</option>
        <option value="average">Average sensitivity</option>
        <option value="high">High sensitivity (slow metabolizer)</option>
      </select>
      <p style={{fontSize:"12px",color:C.muted,marginTop:"8px"}}>
        Genetics play a major role. If coffee affects you strongly or keeps you up easily, choose high sensitivity.
      </p>
    </Card>
    <Card>
      <Label>When was your last coffee/tea today?</Label>
      <input type="time" value={lastCup} onChange={e=>setLastCup(e.target.value)} />
    </Card>
    <Btn onClick={calculate} style={{width:"100%",justifyContent:"center"}}>
      Calculate My Cutoff
    </Btn>
  </div>

  {result && (
    <div className="fade-up" style={{display:"grid",gap:"12px"}}>
      <Card style={{background:C.accentSoft,borderColor:C.accentDim,textAlign:"center"}}>
        <Label>Your Caffeine Cutoff Time</Label>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"64px",color:C.accent,lineHeight:1}}>{result.cutoffStr}</div>
        <p style={{color:C.muted,fontSize:"13px",marginTop:"8px"}}>
          Stop all caffeine by this time to sleep at {bedtime}
        </p>
      </Card>
      <Card style={{borderLeft:`3px solid ${result.isOk?C.good:C.danger}`}}>
        <p style={{fontSize:"14px",color:C.muted}}>
          {result.isOk
            ? `✅ Good news! Your last cup at ${lastCup} was before your cutoff. You should be able to fall asleep on time.`
            : `⚠️ Your last cup at ${lastCup} was after your cutoff time. You may have trouble falling asleep at ${bedtime}.`}
        </p>
      </Card>
      <Card>
        <Label>How it works</Label>
        <p style={{fontSize:"13px",color:C.muted,lineHeight:"1.7"}}>
          Caffeine has a half-life of approximately <strong style={{color:C.text}}>{result.hl} hours</strong> for your sensitivity level. 
          This means every {result.hl} hours, half the caffeine in your system is eliminated. 
          We calculate when it drops below a level that significantly affects sleep quality ({result.hoursNeeded} hours before your target bedtime).
        </p>
      </Card>
    </div>
  )}
</div>
```

);
}

// ══ MAIN APP ══════════════════════════════════════════════════════════════════
export default function App() {
const [active, setActive] = useState(0);

const toolComponents = [
<SleepCalculator/>,
<SleepDebtTracker/>,
<ChronotypeQuiz/>,
<SleepScoreTool/>,
<CaffeineCutoff/>,
];

const icons = [“🌙”,“📊”,“🦁”,“⭐”,“☕”];

return (
<div style={{background:”#000000”,minHeight:“100vh”}}>
<style>{css}</style>
<Stars />

```
  <div style={{position:"relative",zIndex:1,minHeight:"100vh",background:"#000000",color:"#FFD700"}}>
    {/* Header */}
    <header style={{
      borderBottom:`1px solid ${C.border}`,
      padding:"0 clamp(16px,5vw,60px)",
      position:"sticky",top:0,zIndex:10,
      background:"rgba(0,0,0,0.95)",
      backdropFilter:"blur(16px)"
    }}>
      <div style={{maxWidth:"960px",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:"64px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{
            width:32,height:32,borderRadius:"8px",
            background:`linear-gradient(135deg,${C.accent},${C.accentDim})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:"16px"
          }}>🌙</div>
          <div>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:"18px",color:C.text,lineHeight:1}}>SleepWise</div>
            <div style={{fontSize:"10px",color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>Sleep Health Tools</div>
          </div>
        </div>
        <div style={{fontSize:"12px",color:C.muted,display:"flex",alignItems:"center",gap:"6px"}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:C.good,display:"inline-block",animation:"pulse 2s infinite"}}></span>
          5 Free Tools
        </div>
      </div>
    </header>

    {/* Hero */}
    <div style={{
      padding:"clamp(40px,8vw,80px) clamp(16px,5vw,60px) 40px",
      textAlign:"center",
      background:`radial-gradient(ellipse 70% 40% at 50% 0%, ${C.accentSoft}, transparent)`
    }}>
      <div style={{maxWidth:"600px",margin:"0 auto"}}>
        <p style={{fontSize:"12px",letterSpacing:"0.15em",textTransform:"uppercase",color:C.accent,fontWeight:600,marginBottom:"16px"}}>
          Science-Based Sleep Tools
        </p>
        <h1 style={{
          fontFamily:"'DM Serif Display',serif",
          fontSize:"clamp(32px,6vw,56px)",
          color:C.text,lineHeight:1.15,marginBottom:"16px"
        }}>
          Sleep Better.<br/><em style={{color:C.accent}}>Live Better.</em>
        </h1>
        <p style={{color:C.muted,fontSize:"16px",maxWidth:"440px",margin:"0 auto"}}>
          Free science-backed tools to understand, track, and optimise your sleep — no sign-up required.
        </p>
      </div>
    </div>

    {/* Tool Nav */}
    <div style={{
      padding:"0 clamp(16px,5vw,60px)",
      borderBottom:`1px solid ${C.border}`,
      overflowX:"auto"
    }}>
      <div style={{maxWidth:"960px",margin:"0 auto",display:"flex",gap:"4px",paddingBottom:"1px"}}>
        {TOOLS.map((t,i)=>(
          <button key={i} onClick={()=>setActive(i)} style={{
            padding:"14px 18px",
            border:"none",
            background:"transparent",
            color:active===i?C.accent:C.muted,
            fontFamily:"'DM Sans',sans-serif",fontSize:"13px",fontWeight:500,
            cursor:"pointer",whiteSpace:"nowrap",
            borderBottom:`2px solid ${active===i?C.accent:"transparent"}`,
            transition:"all 0.2s",display:"flex",alignItems:"center",gap:"6px"
          }}>
            <span>{icons[i]}</span>{t}
          </button>
        ))}
      </div>
    </div>

    {/* Tool Content */}
    <main style={{padding:"clamp(24px,5vw,48px) clamp(16px,5vw,60px)"}}>
      <div style={{maxWidth:"760px",margin:"0 auto"}} key={active}>
        {toolComponents[active]}
      </div>
    </main>

    {/* Footer */}
    <footer style={{
      borderTop:`1px solid ${C.border}`,
      padding:"32px clamp(16px,5vw,60px)",
      textAlign:"center",
      color:C.muted,fontSize:"13px"
    }}>
      <p style={{marginBottom:"8px"}}>
        <strong style={{color:C.text,fontFamily:"'DM Serif Display',serif"}}>SleepWise</strong> — Free sleep health tools. Not medical advice.
      </p>
      <p style={{color:"#888800"}}>© 2026 SleepWise · All tools are free to use</p>
    </footer>
  </div>
</div>
```

);
}
