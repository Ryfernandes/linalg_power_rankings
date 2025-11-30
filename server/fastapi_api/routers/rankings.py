from fastapi import APIRouter, HTTPException
import numpy as np
import pandas as pd
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "../data"

router = APIRouter()

# Load data into dataframes
df = pd.read_csv(DATA_DIR / "nfl_2024_manual.csv")

teams = set()

for i, row in df.iterrows():
  teams.add(row["Away"])
  teams.add(row["Home"])

team_names = list(teams)

index = 0
teams_hash = {}

for team in sorted(team_names):
  teams_hash[team] = index
  index += 1

"""
Potential variables:
- p value
- How to construct B (equal proportions, scaled based on wins, scaled based on wins to power)
- How to cosntruct adjacency (one-hot, based on raw margin of victory, raw margin of victory to power, tiered margin of victory)
- Extension: recency bias?
"""

def get_discrete_value(tiers, values, num):
  for i in range(len(tiers)):
    if num <= tiers[i]:
      return values[i + 1]
  
  return values[-1]

class PowerRankingsRequest(BaseModel):
  p: float
  b_mode: int
  adjacency_mode: int
  b_wins_power: Optional[float] = None
  adjacency_win_points: Optional[float] = None
  adjacency_tie_points: Optional[float] = None
  adjacency_margin_power: Optional[float] = None
  adjacency_margin_tiers: Optional[List[float]] = None
  adjacency_margin_values: Optional[List[float]] = None

@router.post("/power_rankings")
def power_rankings(request: PowerRankingsRequest):
  # Compile wins, losses and ties
  team_wins = {}
  team_losses = {}
  team_ties = {}

  for team in team_names:
    team_wins[team] = 0
    team_losses[team] = 0
    team_ties[team] = 0

  for i, row in df.iterrows():
    if row["Away Score"] > row["Home Score"]:
      team_wins[row["Away"]] += 1
      team_losses[row["Home"]] += 1
    elif row["Away Score"] < row["Home Score"]: 
      team_wins[row["Home"]] += 1
      team_losses[row["Away"]] += 1
    else:
      team_ties[row["Away"]] += 1
      team_ties[row["Home"]] += 1

  # Construct adjacency matrix based on options
  adjacency = np.zeros([32, 32])

  if request.adjacency_mode == 0:
    # Standard, one-hot adjacency
    if request.adjacency_win_points is None or request.adjacency_tie_points is None:
      raise HTTPException(
        status_code=400,
        detail="If using adjacency mode 0, both adjacency_win_points and adjacency_tie_points must be provided"
      )
    
    for i, row in df.iterrows():
      if row["Away Score"] > row["Home Score"]:
        adjacency[teams_hash[row["Away"]]][teams_hash[row["Home"]]] += request.adjacency_win_points
      elif row["Away Score"] < row["Home Score"]: 
        adjacency[teams_hash[row["Home"]]][teams_hash[row["Away"]]] += request.adjacency_win_points
      else:
        adjacency[teams_hash[row["Home"]]][teams_hash[row["Away"]]] += request.adjacency_tie_points
        adjacency[teams_hash[row["Away"]]][teams_hash[row["Home"]]] += request.adjacency_tie_points
  elif request.adjacency_mode == 1:
    # Scaled adjacency based on margin of victory
    if request.adjacency_margin_power is None:
      raise HTTPException(
        status_code=400,
        detail="If using adjacency mode 1, adjacency_margin_power must be provided"
      )

    for i, row in df.iterrows():
      if row["Away Score"] > row["Home Score"]:
        adjacency[teams_hash[row["Away"]]][teams_hash[row["Home"]]] += (row["Away Score"] - row["Home Score"]) ** request.adjacency_margin_power
      elif row["Away Score"] < row["Home Score"]: 
        adjacency[teams_hash[row["Home"]]][teams_hash[row["Away"]]] += (row["Home Score"] - row["Away Score"]) ** request.adjacency_margin_power
  else:
    # Scaled adjacency based on tiered margin of victory
    if request.adjacency_margin_tiers is None or request.adjacency_margin_values is None:
      raise HTTPException(
        status_code=400,
        detail="If using adjacency mode 2, both adjacency_margin_tiers and adjacency_margin_values must be provided"
      )
    
    if len(request.adjacency_margin_tiers) != len(request.adjacency_margin_values) - 2:
      raise HTTPException(
        status_code=400,
        detail="If using adjacency mode 2, there should be two more items in adjacency_margin_values than in adjacency_margin_tiers (for the lower bound at zero and the upper bound to infinity)"
      )
    
    for i, row in df.iterrows():
      if row["Away Score"] > row["Home Score"]:
        adjacency[teams_hash[row["Away"]]][teams_hash[row["Home"]]] += get_discrete_value(request.adjacency_margin_tiers, request.adjacency_margin_values, row["Away Score"] - row["Home Score"])
      elif row["Away Score"] < row["Home Score"]: 
        adjacency[teams_hash[row["Home"]]][teams_hash[row["Away"]]] += get_discrete_value(request.adjacency_margin_tiers, request.adjacency_margin_values, row["Home Score"] - row["Away Score"])
      else:
        adjacency[teams_hash[row["Away"]]][teams_hash[row["Home"]]] += request.adjacency_margin_values[0]
        adjacency[teams_hash[row["Home"]]][teams_hash[row["Away"]]] += request.adjacency_margin_values[0]
        
  # Normalize the adjacency matrix
  col_sums = adjacency.sum(axis=0)[np.newaxis, :]

  for i in range(len(col_sums)):
    if col_sums[0][i] == 0:
      adjacency[:, i] = np.ones(32)
      col_sums[:, i] = np.ones(32) * 32
  
  transition = adjacency / col_sums

  # Construct the B matrix based on options
  B = np.zeros([32, 32])

  if request.b_mode == 0:
    # Uniform B, equal proportions for all teams
    B += np.ones([32, 32]) / 32
  else:
    # Scaled B based on wins
    if request.b_wins_power is None:
      raise HTTPException(
        status_code=400,
        detail="If using B mode 1, b_wins_power must be provided"
      )
    
    total = 0

    for team in team_names:
      B[teams_hash[team], :] = team_wins[team] ** request.b_wins_power
      total += team_wins[team] ** request.b_wins_power

    B /= total
  
  # Construct Google matrix and compute
  google = (1 - request.p) * transition + request.p * B
  n = 10
  steady = np.linalg.matrix_power(google, n)
  rankings = steady.mean(axis=1)

  # Compile results
  rankings_hash = {}
  for name in team_names:
    rankings_hash[name] = rankings[teams_hash[name]]

  teams_ranked = sorted(team_names, key = lambda name: rankings_hash[name], reverse = True)
  team_scores = [rankings_hash[name] for name in teams_ranked]
  team_wins = [team_wins[name] for name in teams_ranked]
  team_losses = [team_losses[name] for name in teams_ranked]
  team_ties = [team_ties[name] for name in teams_ranked]

  return {
    "teams": teams_ranked,
    "scores": team_scores,
    "wins": team_wins,
    "losses": team_losses,
    "ties": team_ties,
  }

@router.get("/summary")
def summary():
  arr = np.random.randn(1000)
  df = pd.DataFrame({"value": arr})
  return df.describe().to_dict()

@router.post("/stats")
def stats(values: list[float]):
  arr = np.array(values)
  return {
    "mean": float(arr.mean()),
    "std": float(arr.std()),
    "min": float(arr.min()),
    "max": float(arr.max())
  }