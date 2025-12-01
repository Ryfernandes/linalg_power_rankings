import './App.css';
import { useState } from "react";
import Plot from "./components/Plot";

function App() {
  const BACKEND_URI = import.meta.env.VITE_BACKEND_URI as string || window.location.origin;
  
  const [p, setP] = useState<number>(0.15);
  const [bMode, setBMode] = useState<number>(0);
  const [adjacencyMode, setAdjacencyMode] = useState<number>(0);
  const [bWinsPower, setBWinsPower] = useState<number>(1);
  const [adjacencyWinPoints, setAdjacencyWinPoints] = useState<number>(1);
  const [adjacencyTiePoints, setAdjacencyTiePoints] = useState<number>(0.5);
  const [adjacencyMarginPower, setAdjacencyMarginPower] = useState<number>(1);
  const [adjacencyNumTier, setAdjacencyNumTier] = useState<number>(2);
  const [adjacencyMarginTiers, setAdjacencyMarginTiers] = useState<number[]>([]);
  const [adjacencyMarginTiersDisplay, setAdjacencyMarginTiersDisplay] = useState<string[]>([]);
  const [adjacencyMarginValues, setAdjacencyMarginValues] = useState<number[]>(Array(2).fill(0));
  const [adjacencyMarginValuesDisplay, setAdjacencyMarginValuesDisplay] = useState<string[]>(Array(2).fill("0"));

  const [teams, setTeams] = useState<string[]>([]);
  const [wins, setWins] = useState<number[]>([]);
  const [losses, setLosses] = useState<number[]>([]);
  const [ties, setTies] = useState<number[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [pointsFor, setPointsFor] = useState<number[]>([]);
  const [pointsAgainst, setPointsAgainst] = useState<number[]>([]);
  const [netPoints, setNetPoints] = useState<number[]>([]);
  const [pointsForFit, setPointsForFit] = useState<number[]>([]);
  const [pointsAgainstFit, setPointsAgainstFit] = useState<number[]>([]);
  const [netPointsFit, setNetPointsFit] = useState<number[]>([]);

  const resetBValues = () => {
    setBWinsPower(1);
  }

  const resetAdjacencyValues = () => {
    setAdjacencyWinPoints(1);
    setAdjacencyTiePoints(0.5);
    setAdjacencyMarginPower(1);
    setAdjacencyNumTier(2);
    setAdjacencyMarginTiers([]);
    setAdjacencyMarginTiersDisplay([]);
    setAdjacencyMarginValues(Array(2).fill(0));
    setAdjacencyMarginValuesDisplay(Array(2).fill("0"));
  }

  const updateNumTier = (num: number) => {
    setAdjacencyNumTier(num);

    if (num > 2) {
      setAdjacencyMarginTiers(Array(num - 2).fill(0));
      setAdjacencyMarginTiersDisplay(Array(num - 2).fill("0"));
      setAdjacencyMarginValues(Array(num).fill(0));
      setAdjacencyMarginValuesDisplay(Array(num).fill("0"));
    } else {
      setAdjacencyMarginTiers([]);
      setAdjacencyMarginTiersDisplay([]);
      setAdjacencyMarginValues(Array(2).fill(0));
      setAdjacencyMarginValuesDisplay(Array(2).fill("0"));
    }
  }

  const updateTier = (index: number, value: string) => {
    setAdjacencyMarginTiersDisplay((prev) => {
      let next = [...prev];
      next[index] = value;
      return next;
    })
    setAdjacencyMarginTiers((prev) => {
      let next = [...prev];
      next[index] = Number(value);
      return next;
    })
  }

  const updateValue = (index: number, value: string) => {
    setAdjacencyMarginValuesDisplay((prev) => {
      let next = [...prev];
      next[index] = value;
      return next;
    })
    setAdjacencyMarginValues((prev) => {
      let next = [...prev];
      next[index] = Number(value);
      return next;
    })
  }

  const handleSubmit = async () => {
    // Validate p
    if (p <= 0 || p >= 1) {
      alert("Invalid input: p must be a value between 0 and 1");
      return;
    }
    // Validate adjacencyWinPoints
    if (adjacencyWinPoints < 0) {
      alert("Invalid input: adjacencyWinPoints must be non-negative");
      return;
    }
    // Validate adjacencyTiePoints
    if (adjacencyTiePoints < 0) {
      alert("Invalid input: adjacencyTiePoints must be non-negative");
      return;
    }
    // Validate adjacencyMarginTiers
    let maxTier = 0;

    for (let i = 0; i < adjacencyNumTier - 2; i ++) {
      if (adjacencyMarginTiers[i] < maxTier) {
        alert("Invalid input: adjacencyMarginTiers must be non-decreasing");
        return;
      }
      maxTier = adjacencyMarginTiers[i];
    }
    // Validate adjacencyMarginValues
    for (let i = 0; i < adjacencyNumTier; i ++) {
      if (adjacencyMarginValues[i] < 0) {
        alert("Invalid input: adjacencyMarginTiers must be non-negative");
        return;
      }
    }

    // All validations passed, calculate power rankings
    const response = await fetch(`${BACKEND_URI}/rankings/power_rankings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        p: p,
        b_mode: bMode,
        adjacency_mode: adjacencyMode,
        b_wins_power: bWinsPower,
        adjacency_win_points: adjacencyWinPoints,
        adjacency_tie_points: adjacencyTiePoints,
        adjacency_margin_power: adjacencyMarginPower,
        adjacency_margin_tiers: adjacencyMarginTiers,
        adjacency_margin_values: adjacencyMarginValues,
      }),
    });

    const data = await response.json();

    setTeams(data.teams);
    setWins(data.wins);
    setLosses(data.losses);
    setTies(data.ties);
    setScores(data.scores);
    setPointsFor(data.points_for);
    setPointsAgainst(data.points_against);
    setNetPoints(data.net_points);
    setPointsForFit(data.points_for_fit);
    setPointsAgainstFit(data.points_against_fit);
    setNetPointsFit(data.net_points_fit);
  }

  const reloadPage = () => {
    window.location.reload();
  }

  return (
    <div className="page">
      <div className="navbar">
        <div className="logo" onClick={reloadPage}>
          <img
            src="/football_bulldog.png"
            height="50px"
          />
          <span className="navbar-title">
            Power Rankings Playground
          </span>
        </div>
        <span className="navbar-subtitle">
          MATH 2220 – Nico Christofferson, Ryan Fernandes, Daniel Landry
        </span>
      </div>

      <div className="parameters">
        <span className="section-title">
          Step 1. Choose Parameters
        </span>
        <span className="section-description">
          First, you must choose the parameters and type of algorithm that you would like to apply to generate power rankings. Please see our paper for further information about these parameters. If you would like to compare two different ranking algorithms,  click the eye icon on the second window.
        </span>
        <div className="parameters-panel">
          <span className="algorithm-title">
            Algorithm 1
          </span>
          <div className="option">
            <span className="option-text">
              p-value: 
            </span>
            <input type="number" min={0} max={1} step={0.05} defaultValue={p} onChange={(e) => {setP(Number(e.target.value))}}/>
          </div>
          <div className="option">
            <span className="option-text">
              Adjacency matrix mode: 
            </span>
            <select name="adjacency-matrix-mode" onChange={(e) => {setAdjacencyMode(Number(e.target.value)); resetAdjacencyValues();}}>
              <option value={0}>Simple win-loss</option>
              <option value={1}>Raw margin of victory</option>
              <option value={2}>Margin of victory tiers</option>
            </select>
          </div>
          {adjacencyMode == 0 && (
            <>
              <div className="option">
                <span className="option-text">
                  (Adjacency) Win points: 
                </span>
                <input type="number" min={0} defaultValue={adjacencyWinPoints} onChange={(e) => {setAdjacencyWinPoints(Number(e.target.value))}}/>
              </div>
              <div className="option">
                <span className="option-text">
                  (Adjacency) Tie points: 
                </span>
                <input type="number" min={0} defaultValue={adjacencyTiePoints} onChange={(e) => {setAdjacencyTiePoints(Number(e.target.value))}}/>
              </div>
            </>
          )}
          {adjacencyMode == 1 && (
            <div className="option">
              <span className="option-text">
                (Adjacency) Margin power: 
              </span>
              <input type="number" defaultValue={adjacencyMarginPower} onChange={(e) => {setAdjacencyMarginPower(Number(e.target.value))}}/>
            </div>
          )}
          {adjacencyMode == 2 && (
            <div className="option">
              <span className="option-text">
                (Adjacency) Margin of victory intervals: 
              </span>
              <input type="number" defaultValue={adjacencyNumTier} onChange={(e) => {updateNumTier(Number(e.target.value))}}/>
            </div>
          )}
          {adjacencyMode == 2 && adjacencyMarginValuesDisplay.map((value, index) => (
            <div key={index}>
              {index == 0 ? (
                <div className="option">
                  <span className="option-text">
                    0 points (tie): 
                  </span>
                  <input type="number" value={value} onChange={(e) => {updateValue(index, e.target.value)}}/>
                </div>
              ) : index - 1 == adjacencyMarginTiersDisplay.length ? (
                <div className="option">
                  <span className="option-text">
                    {adjacencyMarginTiersDisplay[index - 2] == null ? 0 : adjacencyMarginTiersDisplay[index - 2]} — ∞ points:
                  </span>
                  <input type="number" value={value} onChange={(e) => {updateValue(index, e.target.value)}}/>
                </div>
              ) : index == 1 ? (
                <div className="option">
                  <span className="option-text">
                    0 —
                  </span>
                  <input type="number" value={adjacencyMarginTiersDisplay[index - 1]} onChange={(e) => {updateTier(index - 1, e.target.value)}}/>
                  <span className="option-text">
                    points:
                  </span>
                  <input type="number" value={value} onChange={(e) => {updateValue(index, e.target.value)}}/>
                </div>
              ) : (
                <div className="option">
                  <span className="option-text">
                    {adjacencyMarginTiersDisplay[index - 2]} —
                  </span>
                  <input type="number" value={adjacencyMarginTiersDisplay[index - 1]} onChange={(e) => {updateTier(index - 1, e.target.value)}}/>
                  <span className="option-text">
                    points:
                  </span>
                  <input type="number" value={value} onChange={(e) => {updateValue(index, e.target.value)}}/>
                </div>
              )}
            </div>
          ))}
          <div className="option">
            <span className="option-text">
              B matrix mode: 
            </span>
            <select name="b-matrix-mode" onChange={(e) => {setBMode(Number(e.target.value)); resetBValues();}}>
              <option value={0}>Uniform</option>
              <option value={1}>Scaled by wins</option>
            </select>
          </div>
          {bMode == 1 && (
            <div className="option">
              <span className="option-text">
                (B) Wins power: 
              </span>
              <input type="number" defaultValue={bWinsPower} onChange={(e) => {setBWinsPower(Number(e.target.value))}}/>
            </div>
          )}
          <span>
            <button onClick={handleSubmit}>
              Run Algorithm
            </button>
          </span>
        </div>
      </div>

      <div className="results">
        <span className="section-title">
          Step 2. View Power Rankings
        </span>
        <span className="section-description">
          Once you have run the algorithm, you will see the calculated power rankings and scores for each team below.
        </span>
        <div className="power-rankings">
          {teams.map((team, index) => (
            <span key={team} className="ranking">{String(index + 1).padStart(2)}. {team} ({wins[index]}-{losses[index]}{ties[index] > 0 ? `-${ties[index]}` : ""}) ({scores[index].toFixed(4)})</span>
          ))}
        </div>
      </div>

      <div className="results">
        <span className="section-title">
          Step 3. Check Ranking Correlations
        </span>
        <span className="section-description">
          Once you have run the algorithm, you can also check how the power ranking scores are correlated to season-long metrics like points for, points against, and net point differential. Explore the plots, best fit lines (from the least squares method) and R-squared values below
        </span>
        {pointsFor.length > 0 ? (
          <>
            <Plot title='"Points For" Correlation' subtitle={`R ² = ${pointsForFit[2]}`} x_label="Points For" y_label="Ranking Score" x_axis={pointsFor} y_axis={scores} teams={teams} fit_slope={pointsForFit[1]} fit_intercept={pointsForFit[0]}></Plot>
            <Plot title='"Points Against" Correlation' subtitle={`R ² = ${pointsAgainstFit[2]}`} x_label="Points Against" y_label="Ranking Score" x_axis={pointsAgainst} y_axis={scores} teams={teams} fit_slope={pointsAgainstFit[1]} fit_intercept={pointsAgainstFit[0]}></Plot>
            <Plot title='"Net Points" Correlation' subtitle={`R ² = ${netPointsFit[2]}`} x_label="Net Points" y_label="Ranking Score" x_axis={netPoints} y_axis={scores} teams={teams} fit_slope={netPointsFit[1]} fit_intercept={netPointsFit[0]}></Plot>
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  )
}

export default App;
