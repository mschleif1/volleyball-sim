import React, { useState } from 'react';
import { useAppData } from '../AppDataContext'; // adjust path as needed
import { Game } from "@engine/Game"
import { Team } from "@engine/Team"
import { handleGameWeekSim } from "@engine/DataManager"
import { saveGame } from '@engine/DataManager';
import '../styling/GamePanel.css';
import PixelTable from './PixelTable';
import { GameStats } from '@engine/GameStats';

const statColumns = [
	'Name',
	'Pos',
	'Kills',
	'Spikes Att',
	'Spikes Missed',
	'Avg Spike Spd',
	'Serves Att',
	'Serves Missed',
	'Aces',
	'Avg Serve Spd',
	'Passes Att',
	'Passes Missed',
	'Perfect Passes',
	'Sets Att',
	'Sets Missed',
	'Perfect Sets'
];

const GamePanel: React.FC = () => {
	const appData = useAppData();
	const [gameStatsList, setGameStatsList] = useState<any[]>([]);
	const [showPlayerStats, setShowPlayerStats] = useState<{ [key: number]: boolean }>({});

	if (!appData || !appData.league) {
		return <div className="pixelated full-page">Loading...</div>;
	}

	const { league, seasons, teams, players, gameStats, playerStats } = appData;
	const currentSeason = Object.values(seasons).at(-1);
	const currentWeek = currentSeason!.currentWeek;
	const userTeam = Team.getUserTeam(teams)
	

	const playGame = () => {
		const newGameStats = currentSeason!.simWeek(appData);
        handleGameWeekSim(seasons, gameStats, playerStats, newGameStats, appData.setGameStats, appData.setPlayerStats, appData.setSeasons)
	};

	const togglePlayerStats = (index: number) => {
		setShowPlayerStats(prev => ({
			...prev,
			[index]: !prev[index],
		}));
	};

	const renderCurrentMatchup = () => {
		return `Week ${currentWeek + 1} matchups are ready to play!`;
	};

	// --- Helpers ---
	const renderSetScores = (game: any, teamA: any, teamB: any) => {
		const columns = ['Set', teamA.name, teamB.name];
		const data = game.setScores.map((score: Record<number, number>, index: number) => [
			String(index + 1),
			String(score[teamA.id]),
			String(score[teamB.id]),
		]);
		return <PixelTable columns={columns} data={data} />;
	};

	const formatPlayerStats = (playerIds: string[], game: any) => {
		return playerIds.map(playerId => {
            const player = players[playerId]
			const stat = game.playerStats[playerId];
			return [
				player.name,
				player.position,
				stat.kills,
				stat.spikesAttempted,
				stat.spikesMissed,
				stat.averageSpikeSpeed.toFixed(1),
				stat.servesAttempted,
				stat.servesMissed,
				stat.servesAced,
				stat.averageServeSpeed.toFixed(1),
				stat.passesAttempted,
				stat.passesMissed,
				stat.perfectPasses,
				stat.setsAttempted,
				stat.setsMissed,
				stat.perfectSets
			]
		});
	};

	const renderPlayerStatsTable = (teamName: string, playerIds: string[], game: any) => {
		const data = formatPlayerStats(playerIds, game);
		return (
			<>
				<h4>{teamName} Players</h4>
				<PixelTable columns={statColumns} data={data} />
			</>
		);
	};

	const renderSingleGameResult = (game: any, index: number) => {
		const teamIds = Game.getTeamIdsFromGameId(game.id);
		const teamA = teams[teamIds[0]];
		const teamB = teams[teamIds[1]];
		const setScores = renderSetScores(game, teamA, teamB);

		return (
			<div key={index} className="game-result pixelated bordered padded">
				<p><b>{teamA.name}</b> vs <b>{teamB.name}</b></p>
				<div>{setScores}</div>
				<button
					className="pixelated small"
					onClick={() => togglePlayerStats(index)}
				>
					{showPlayerStats[index] ? 'Hide' : 'Show'} Player Stats
				</button>

				{showPlayerStats[index] && (
					<div className="player-stats-table">
						{renderPlayerStatsTable(teamA.name, teamA.playerIds, game)}
						{renderPlayerStatsTable(teamB.name, teamB.playerIds, game)}
					</div>
				)}
			</div>
		);
	};

	const renderGameStats = () => {
		if (gameStatsList.length === 0) return null;

		return (
			<section className="game-results">
				<h3>Game Results</h3>
				{gameStatsList.map(renderSingleGameResult)}
			</section>
		);
	};

	// --- Render ---
	function getLastWeekResultText(){
		const lastWeekResult = GameStats.getResultForTeam(gameStats, currentWeek - 1, userTeam.id)
		
		let lastWeekResultText = <span> No games played yet.</span>
		
		if (lastWeekResult){
			
			const id1 = lastWeekResult.losingTeamId!
			const id2 = lastWeekResult.winningTeamId!
			
			let team1Sets = 0
			let team2Sets = 0
	
			lastWeekResult.setScores.forEach(set=>{
				if (set[id1] > set[id2] ){
					team1Sets += 1
				} else {
					team2Sets += 1
				}
			})
			let gameStatus = "L"
			if (userTeam.id == lastWeekResult.winningTeamId){ gameStatus = "W" } 
			lastWeekResultText = <span> {teams[id1].name} ({team1Sets}) - {teams[id2].name} ({team2Sets}) | {gameStatus}  </span>
		}
		return lastWeekResultText
	}

	const renderStandingsTable = () => {
		const records = GameStats.getRecordsForTeams(gameStats); // { [teamId]: { wins: number, losses: number } }
	
		// Map records to include team name, default to 0-0 if no record found
		const teamRows = Object.values(teams).map(team => {
			const record = records[team.id] || { wins: 0, losses: 0 };
			return {
				name: team.name,
				wins: record.wins,
				losses: record.losses,
			};
		});
	
		// Sort by wins descending, then by losses ascending (as a tiebreaker)
		teamRows.sort((a, b) => {
			if (b.wins === a.wins) {
				return a.losses - b.losses;
			}
			return b.wins - a.wins;
		});
	
		// PixelTable expects columns and 2D array of string data
		const columns = ['Team', 'Wins', 'Losses'];
		const data = teamRows.map(team => [
			team.name,
			String(team.wins),
			String(team.losses),
		]);
	
		return <PixelTable columns={columns} data={data} />;
	};

	function getThisWeeksOpponent(){
		if (!currentSeason){ return <span> No matchup this week </span>}
		const currentWeekGames = currentSeason.schedule[currentWeek]
		let teamName = ""
		for (let i = 0; i < currentWeekGames.length; i++){
			const matchup = currentWeekGames[i]
			if (matchup[0] == userTeam.id){
				teamName = teams[matchup[1]].name
				break;
			} else if (matchup[1] == userTeam.id){
				teamName = teams[matchup[0]].name
				break;
			}
		}

		return (
			<div> 
				{ teamName }
				<button className='pixelated small centered margin-left' onClick={playGame}>Play</button>
			</div>
		)
	}
	
	return (
		<div className="game-panel-wrapper pixelated">
			<header className="game-header">
				<h3 className="season-subtitle">Season: {currentSeason?.year ?? 'Unknown'}, Week: {currentWeek + 1}</h3>
			</header>
	
			<div className="info-panels">
				<section className="past-results summary">
					<h3> Week {currentWeek + 1} Opponent: </h3>
					{getThisWeeksOpponent()}
					<h3>Past Results</h3>
					{getLastWeekResultText()}
					
				</section>
	
				<section className="standings summary">
					<h3>Standings</h3>
					{renderStandingsTable()}
				</section>
			</div>
	
			{renderGameStats()}
		</div>
	);
	
};

export default GamePanel;
