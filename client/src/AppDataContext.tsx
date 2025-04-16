// AppDataContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

import { Player } from "../engine/Player"
import { Team } from "../engine/Team"
import { League } from "../engine/League"
import { Season } from "../engine/Season"

interface AppData {
	players: Player[];
	teams: Team[];
	seasons: Season[];
	league: League | null;
}

const AppDataContext = createContext<AppData | null>(null);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [players, setPlayers] = useState<Player[]>([]);
	const [teams, setTeams] = useState<Team[]>([]);
	const [seasons, setSeasons] = useState<Season[]>([]);
	const [league, setLeague] = useState<League | null> (null);

	useEffect(() => {
        console.log("LOADING DATA!!!!")
		// Load from localStorage and rehydrate here
		const rawPlayers = JSON.parse(localStorage.getItem('players') || '[]');
		setPlayers(rawPlayers.map(Player.rehydrate));

        const rawTeams = JSON.parse(localStorage.getItem('teams') || '[]');
        setTeams(rawTeams.map(Team.rehydrate));
		
        const rawSeasons = JSON.parse(localStorage.getItem('seasons') || '[]');
        setSeasons(rawSeasons.map(Season.rehydrate));
        
        const rawLeague = localStorage.getItem('league') || "{}"
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
