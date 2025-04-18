// AppDataContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

import { Player } from "../engine/Player";
import { Team } from "../engine/Team";
import { League } from "../engine/League";
import { Season } from "../engine/Season";

export interface AppData {
	players: Record<string, Player>;
	teams: Record<string, Team>;
	seasons: Record<string, Season>;
	league: League | null;
}

const AppDataContext = createContext<AppData | null>(null);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [players, setPlayers] = useState<Record<string, Player>>({});
	const [teams, setTeams] = useState<Record<string, Team>>({});
	const [seasons, setSeasons] = useState<Record<string, Season>>({});
	const [league, setLeague] = useState<League | null>(null);

	useEffect(() => {
		console.log("LOADING DATA!!!!");

		// Players
		const rawPlayers = JSON.parse(localStorage.getItem('players') || '[]');
		const rehydratedPlayers: Record<string, Player> = {};
		rawPlayers.forEach((player: any) => {
			const rehydrated = Player.rehydrate(player);
			rehydratedPlayers[rehydrated.id] = rehydrated;
		});
		setPlayers(rehydratedPlayers);

		// Teams
		const rawTeams = JSON.parse(localStorage.getItem('teams') || '[]');
		const rehydratedTeams: Record<string, Team> = {};
		rawTeams.forEach((team: any) => {
			const rehydrated = Team.rehydrate(team);
			rehydratedTeams[rehydrated.id] = rehydrated;
		});
		setTeams(rehydratedTeams);

		// Seasons
		const rawSeasons = JSON.parse(localStorage.getItem('seasons') || '[]');
		const rehydratedSeasons: Record<string, Season> = {};
		rawSeasons.forEach((season: any) => {
			const rehydrated = Season.rehydrate(season);
			rehydratedSeasons[rehydrated.year] = rehydrated;
		});
		setSeasons(rehydratedSeasons);

		// League
		const rawLeague = localStorage.getItem('league') || '{}';
		console.log(rawLeague)
		
		setLeague(League.rehydrate(rawLeague));
	}, []);

	return (
		<AppDataContext.Provider value={{ players, teams, seasons, league }}>
			{children}
		</AppDataContext.Provider>
	);
};

export const useAppData = () => {
	const context = useContext(AppDataContext);
	if (!context) throw new Error('useAppData must be used within AppDataProvider');
	return context;
};
