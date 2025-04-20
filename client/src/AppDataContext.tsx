// AppDataContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

import { Player } from "../engine/Player";
import { Team } from "../engine/Team";
import { League } from "../engine/League";
import { Season } from "../engine/Season";
import { GameStats } from '../engine/GameStats';
import { PlayerStats } from "../engine/PlayerStats"

export interface AppData {
	players: Record<string, Player>;
	setPlayers: React.Dispatch<React.SetStateAction<Record<string, Player>>>;

	teams: Record<string, Team>;
	setTeams: React.Dispatch<React.SetStateAction<Record<string, Team>>>;

	seasons: Record<string, Season>;
	setSeasons: React.Dispatch<React.SetStateAction<Record<string, Season>>>;

	league: League | null;
	setLeague: React.Dispatch<React.SetStateAction<League | null>>;

	gameStats: Record<string, GameStats>;
	setGameStats: React.Dispatch<React.SetStateAction<Record<string, GameStats>>>;

	playerStats: Record<string, PlayerStats>;
	setPlayerStats: React.Dispatch<React.SetStateAction<Record<string, PlayerStats>>>;
}

const AppDataContext = createContext<AppData | null>(null);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [players, setPlayers] = useState<Record<string, Player>>({});
	const [teams, setTeams] = useState<Record<string, Team>>({});
	const [seasons, setSeasons] = useState<Record<string, Season>>({});
	const [league, setLeague] = useState<League | null>(null);
	const [gameStats, setGameStats] = useState<Record<string, GameStats>>({});
	const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({});

	function loadRehydratedMap<T>(
		key: string,
		rehydrateFn: (data: any) => T
	): Record<string, T> {
		
		const raw = JSON.parse(localStorage.getItem(key) || '{}');
		const rehydrated: Record<string, T> = {};
		Object.keys(raw).forEach((id: string) => {
			rehydrated[id] = rehydrateFn(raw[id]);
		});
		return rehydrated;
	}
	

	useEffect(() => {

		setPlayers(loadRehydratedMap<Player>('players', Player.rehydrate));
		setTeams(loadRehydratedMap<Team>('teams', Team.rehydrate));
		setSeasons(loadRehydratedMap<Season>('seasons', Season.rehydrate));
		
		setPlayerStats(loadRehydratedMap<PlayerStats>('playerStats', PlayerStats.rehydrate));
		setGameStats(loadRehydratedMap<GameStats>('gameStats', GameStats.rehydrate));
		

		// Loading the player and game stats is a little more complicated
		const gameStats = localStorage.getItem('')
		
		const rawLeague = localStorage.getItem('league') || '{}';
		setLeague(League.rehydrate(rawLeague));
	}, []);

	return (
		<AppDataContext.Provider value={{
			players, setPlayers,
			teams, setTeams,
			seasons, setSeasons,
			league, setLeague,
			gameStats, setGameStats,
			playerStats, setPlayerStats,
		}}>
			{children}
		</AppDataContext.Provider>
	);
};

export const useAppData = () => {
	const context = useContext(AppDataContext);
	if (!context) throw new Error('useAppData must be used within AppDataProvider');
	return context;
};
