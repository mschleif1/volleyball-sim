import React, { useState, useEffect } from 'react';
import { useAppData } from '../AppDataContext';
import { saveTeams } from "@engine/DataManager";
import { Team } from "../../engine/Team";
import '../styling/LineupPage.css';

const LineupPage = () => {
	const appData = useAppData();

	if (!appData || !appData.league) {
		return <div className="pixelated full-page">Loading...</div>;
	}

	const { league, seasons, teams, players, gameStats, setTeams } = appData;
	const currentSeason = Object.values(seasons).at(-1);
	const userTeam = Object.values(teams).find(t => t.userTeam);

	if (!userTeam) {
		return <div className="pixelated full-page">No user team found.</div>;
	}

	// Attach player objects to the team (if not already done)
	userTeam.setPlayersAndLineUp(players);

	const groupedByPosition: Record<string, typeof userTeam.players> = {};
	userTeam.players.forEach(player => {
		if (!groupedByPosition[player.position]) {
			groupedByPosition[player.position] = [];
		}
		groupedByPosition[player.position].push(player);
	});

	const [preferences, setPreferences] = useState<{ [position: string]: string[] }>(() => {
		const initial: { [position: string]: string[] } = {};
		for (const pos in groupedByPosition) {
			if (userTeam.lineupPreferences && userTeam.lineupPreferences[pos]) {
				initial[pos] = [...userTeam.lineupPreferences[pos]];
			} else {
				initial[pos] = [...groupedByPosition[pos]]
					.sort((a, b) => b.overall - a.overall)
					.map(p => p.id);
			}
		}
		return initial;
	});

	// New: queue a save
	const [pendingSave, setPendingSave] = useState<{ [position: string]: string[] } | null>(null);

	useEffect(() => {
		if (pendingSave) {
			userTeam.lineupPreferences = pendingSave;
			const updatedTeams = { ...teams, [userTeam.id]: userTeam };
			saveTeams(updatedTeams, setTeams);
			setPendingSave(null);
		}
	}, [pendingSave]);

	const move = (position: string, fromIndex: number, toIndex: number) => {
		setPreferences(prev => {
			const updated = [...prev[position]];
			const [moved] = updated.splice(fromIndex, 1);
			updated.splice(toIndex, 0, moved);
			const newPrefs = { ...prev, [position]: updated };
			setPendingSave(newPrefs); // schedule save for later
			return newPrefs;
		});
	};

	return (
		<div className='LineupPage'>
			{Object.keys(groupedByPosition).map(pos => (
				<div key={pos} className="mb-6">
                    
					<h2>{pos[0].toUpperCase() + pos.substring(1)}</h2>
					<div>
						{preferences[pos].map((playerId, index) => {
							const player = userTeam.players.find(p => p.id === playerId)!;
							return (
								<div key={playerId} className='player-control'>
                                    <div className='control-panel'>
                                        <button
                                            disabled={index === preferences[pos].length - 1}
                                            onClick={() => move(pos, index, index + 1)}
                                            title="Move Down"
                                            className={index !== preferences[pos].length - 1 ? "enabled-button" : "disabled-button"}
                                        >↓</button>
                                        <button
                                            disabled={index === 0}
                                            onClick={() => move(pos, index, index - 1)}
                                            title="Move Up"
                                            className={index !== 0 ? "enabled-button" : "disabled-button"}
                                        >↑</button>
                                    </div>
                                    <div className='player-name'>
                                        <span>{index + 1}.</span>
                                        <span>{player.name} ({player.overall.toFixed(0)})</span>
                                    </div>
                                </div>
							);
						})}
					</div>
				</div>
			))}
		</div>
	);
};

export default LineupPage;
