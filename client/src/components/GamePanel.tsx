import React, { useState } from 'react';
import { useAppData } from '../AppDataContext'; // adjust path as needed
import { Game } from "@engine/Game"
import { handleGameWeekSim } from "@engine/DataManager"
import { saveGame } from '@engine/DataManager';
import '../styling/GamePanel.css';
import PixelTable from './PixelTable';

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

	if (!appData || !appData.league) {
		return <div className="pixelated full-page">Loading...</div>;
	}

	const { league, seasons, teams, players, gameStats, playerStats } = appData;
	const currentSeason = Object.values(seasons).at(-1);
	const currentWeek = currentSeason!.currentWeek;

	const [gameStatsList, setGameStatsList] = useState<any[]>([]);
	const [showPlayerStats, setShowPlayerStats] = useState<{ [key: number]: boolean }>({});

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

	const formatPlayerStats = (playerIds: number[], game: any) => {
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

	const renderPlayerStatsTable = (teamName: string, playerIds: number[], game: any) => {
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
	return (
		<div className="game-panel-wrapper pixelated">
			<header className="game-header">
				<h3 className="season-subtitle">Season: {currentSeason?.year ?? 'Unknown'}, Week: {currentWeek + 1}</h3>
			</header>
	
			<div className="info-panels">
				<section className="past-results summary">
					<h3>Past Results</h3>
					<ul>
						<li>Week 1: Jackopepes 2 - 1 Ballers</li>
						<li>Week 1: Smash Bros 0 - 2 Diggers</li>
					</ul>
				</section>
	
				<section className="standings summary">
					<h3>Standings</h3>
					<table className="pixelated-table">
						<thead>
							<tr>
								<th>Team</th>
								<th>W</th>
								<th>L</th>
							</tr>
						</thead>
						<tbody>
							<tr><td>Jackopepes</td><td>1</td><td>0</td></tr>
							<tr><td>Diggers</td><td>1</td><td>0</td></tr>
							<tr><td>Ballers</td><td>0</td><td>1</td></tr>
							<tr><td>Smash Bros</td><td>0</td><td>1</td></tr>
						</tbody>
					</table>
				</section>
			</div>
	
			<div className="play-button-container">
				<button className='pixelated small centered' onClick={playGame}>Play</button>
			</div>
	
			{renderGameStats()}
		</div>
	);
	
};

export default GamePanel;
