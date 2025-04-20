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
		<section className="summary">
			<h2>Current Week</h2>
			<p><b>Season:</b> {currentSeason?.year ?? 'Unknown'}, week: {currentWeek + 1}</p>
			<p>{renderCurrentMatchup()}</p>
			<button className='pixelated small centered' onClick={playGame}>Play</button>
			{renderGameStats()}
		</section>
	);
};

export default GamePanel;
