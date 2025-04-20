import { Team } from "./Team"
import { League } from "./League"
import { Player } from "./Player"
import { Season } from "./Season"
import { GameStats } from "./GameStats"
import { PlayerStats } from "./PlayerStats"
import { maxBy } from "lodash"
import { useAppData } from "../src/AppDataContext"

const TEAMS = 'teams'
const LEAGUE = 'league'
const PLAYERS = 'players'
const SEASONS = 'seasons'
const GAME_STATS = 'gameStats'
const PLAYER_STATS = 'playerStats'





// after it is loaded, return it back.
// Saves the entire league as is to local storage
export function saveLeague(league: League, setLeague: (league: League) => void): void {
	localStorage.setItem(LEAGUE, JSON.stringify(league));

    // League
    const rawLeague = localStorage.getItem('league') || '{}';
    console.log(rawLeague)

    setLeague(league);
}
// pass in the function used to trigger a state update
export function saveTeams(teams: Record<number, Team>, setTeams: (teams: Record<number, Team>) => void): void {
	const dehydratedTeams: Record<string, string> = {};

	Object.keys(teams).forEach(teamId => {
		const id = Number(teamId);
		dehydratedTeams[teamId] = JSON.stringify(teams[id]); // or teams[id].toJSON() if applicable
	});

	localStorage.setItem(TEAMS, JSON.stringify(dehydratedTeams));
	setTeams(teams);
}


export function savePlayers(players: Record<number, Player>, setPlayers: (players: Record<number, Player>) => void): void {	// save
    let dehydratedPlayers: Record<number, string> = {};

	Object.keys(players).forEach(playerId => {
		const id = Number(playerId);
		dehydratedPlayers[id] = JSON.stringify(players[id]); // or teams[id].toJSON() if applicable
	});

	localStorage.setItem(PLAYERS, JSON.stringify(dehydratedPlayers));
	setPlayers(players);
}

export function saveSeasons(seasons: Record<number, Season>, setSeasons: (gameStats: Record<number,Season> )=>void): void {
	let dehydrated: Record<string, string> = {} 

    Object.keys(seasons).forEach(year=>{
        dehydrated[Number(year)] = JSON.stringify(seasons[Number(year)])
    })

	localStorage.setItem(SEASONS, JSON.stringify(dehydrated));

    setSeasons(seasons)
}

export function saveGameStats(gameStats: Record<string,GameStats>, setGameStats: ( gameStats: Record<string,GameStats> )=>void): void {
	
    let dehydrated: Record<string, string> = {} 

    Object.keys(gameStats).forEach(gameStatId=>{
        dehydrated[gameStatId] = JSON.stringify(gameStats[gameStatId])
    })

	localStorage.setItem(GAME_STATS, JSON.stringify(dehydrated));

    setGameStats(gameStats)
}

export function savePlayerStats(playerStats: Record<string, PlayerStats>, setPlayerStats: (playerStats: Record<string, PlayerStats>) => void): void {
	const dehydrated: Record<string, object> = {};

	Object.keys(playerStats).forEach(gameStatId => {
		dehydrated[gameStatId] = playerStats[gameStatId].toJSON();
	});

	localStorage.setItem(PLAYER_STATS, JSON.stringify(dehydrated));

	setPlayerStats(playerStats);
}


// --- Main Save Function ---

export function saveGame({
        league, setLeague,
        teams, setTeams,
        players, setPlayers,
        seasons, setSeasons,
        gameStats, setGameStats,
        playerStats, setPlayerStats
    }: {
        league?: League, setLeague?: (l: League) => void,
        teams?: Record<number, Team>, setTeams?: (t: Record<number, Team>) => void,
        players?: Record<number, Player>, setPlayers?: (p: Record<number, Player>) => void,
        seasons?: Record<number, Season>, setSeasons?: (s: Record<number, Season> ) => void,
        gameStats?: Record<string, GameStats>, setGameStats?: (g: Record<string, GameStats>) => void,
        playerStats?: Record<string, PlayerStats>, setPlayerStats?: (p: Record<string, PlayerStats>) => void
    } = {}) {
	
    
    if (league) saveLeague(league, setLeague ?? (() => {}));
	if (teams) saveTeams(teams, setTeams ?? (() => {}));
	if (players) savePlayers(players, setPlayers ?? (() => {}));
	if (seasons) saveSeasons(seasons, setSeasons ?? (() => {}));
	if (gameStats) saveGameStats(gameStats, setGameStats ?? (() => {}));
	if (playerStats) savePlayerStats(playerStats, setPlayerStats ?? (() => {}));
}

/*
    This function will:
    1. Update gameStats by adding the new game stats to the list
    2. Update player stats by combining with old game stats
    3. Increment season week counter
    4. Save data to local storage
    5. Update context
*/

export function handleGameWeekSim(
	seasons: Record<string, Season>,
	oldGameStats: Record<string, GameStats>,
	oldPlayerStats: Record<string, PlayerStats>,
	newGameStats: GameStats[],
	setGameStats: (g: Record<string, GameStats>) => void,
	setPlayerStats: (g: Record<string, PlayerStats>) => void,
	setSeasons: (g: Record<string, Season>) => void
) {
	const latestSeason = maxBy(Object.values(seasons), 'year');
	if (!latestSeason) throw new Error("No season found");

	// Clone to ensure new object references (avoid direct mutation)
	let gameStats = { ...oldGameStats };
	let playerStats = { ...oldPlayerStats };
	let updatedSeasons = { ...seasons };
	updatedSeasons[latestSeason.year] = latestSeason;

	newGameStats.forEach(gameStat => {
		if (gameStats[gameStat.id]) {
			throw new Error("GAME ALREADY EXISTED???");
		}

		// Add game stat
		gameStats[gameStat.id] = gameStat;

		// Update player stats
		Object.keys(gameStat.playerStats).forEach(playerId => {
			const playerStatForGame = gameStat.playerStats[playerId];
			const seasonPlayerStatsId = PlayerStats.createPlayerStatId(playerId, latestSeason.year);

			if (!playerStats[seasonPlayerStatsId]) {
				playerStats[seasonPlayerStatsId] = playerStatForGame;
			} else {
                playerStats[seasonPlayerStatsId].mergeFrom(playerStatForGame);
			}
		});

	});
    // Advance the week
    latestSeason.currentWeek++;

	// Save once with new references
	setGameStats(gameStats);
	setPlayerStats(playerStats);
	setSeasons(updatedSeasons);

	saveGame({ seasons: updatedSeasons, setSeasons, playerStats, setPlayerStats, gameStats, setGameStats });
}
