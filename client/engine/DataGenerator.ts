import { Player } from './Player';
import { Team } from "./Team"
import { League } from "./League"
import { Season } from "./Season"
import { saveGame } from './DataManager';
import { firstNames, lastNames, teamNames, statRangeByPosition} from "./DataConfig"

import _ from "lodash"

const PLAYERS_PER_TEAM = 11
const PLAYER_LEAGUE_COUNT = 70
const TEAM_LEAGUE_COUNT = 10

const generateRating = () =>{
    return Math.floor(Math.random() * (100 - 50 + 1)) + 50;

}

const generateId = (min= 0, max= 100) =>{
    return Math.floor(Math.random() * 1000000) + 1;

}

const generatePlayer = (playerIndex: number, position: string): Player => {
	const firstName = _.sample(firstNames)!;
	const lastName = _.sample(lastNames)!;
	const stats = statRangeByPosition[position];

	const rand = (range: [number, number]) => 
		Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];

	return new Player(
		`${firstName} ${lastName}`, position, playerIndex.toString(),
		rand(stats.jumping),
		rand(stats.passing),
		rand(stats.power),
		rand(stats.consistency),
		rand(stats.setting),
		rand(stats.blocking),
		rand(stats.stamina),
		null,
		null
	);
};

export const generateTeam = (teamName: string, teamIndex: number): Team => {
	
	const players: Player[] = [];
	
	
	const name = teamName ? teamName : _.sample(teamNames)!;
	const isUserTeam = teamName ? true : false 
	
	return new Team(name, [], teamIndex.toString(), isUserTeam);
};

export const generateLeagueTeams = (userTeamName: string): Team[] => {
	const teams: Team[] = [];
	
	let teamIndex = 0
	while (teams.length < 9) {
		teams.push(generateTeam("", teamIndex++));
	}

	teams.push(generateTeam(userTeamName, teamIndex++))
	return teams;
};

type LeagueBundle = {
	league: League;
	teams: Record<string, Team>;
	players: Record<string, Player>;
	seasons: Record<string, Season>;
};

export const generateLeague = (playerTeamName: string): LeagueBundle => {	
	let playerIdCounter = 0;
	let teamIdCounter = 0;

	let players: Record<string, Player> = {}
	
	for (let teamIdx = 0; teamIdx < TEAM_LEAGUE_COUNT; teamIdx++) {
		const roles = [
			...Array(2).fill("setter"),
			...Array(5).fill("hitter"),
			...Array(3).fill("middle"),
			"libero"
		];

		for (const role of roles) {
			players[playerIdCounter.toString()] = generatePlayer(playerIdCounter, role);
			playerIdCounter++;
		}
	}

	
	let teams: Record<string, Team> = {}
	while (teamIdCounter < TEAM_LEAGUE_COUNT - 1){
		teams[teamIdCounter.toString()] = generateTeam("", teamIdCounter ++)
	}
	teams[teamIdCounter.toString()] = generateTeam(playerTeamName, teamIdCounter)
	
	// Connect the teams and players
	let teamsFilled = 0
	while (teamsFilled < TEAM_LEAGUE_COUNT){
		let team = teams[teamsFilled]
		let playerIndex = 0
		while (playerIndex < PLAYERS_PER_TEAM){
			let player = players[PLAYERS_PER_TEAM * teamsFilled + playerIndex]
			team.addPlayer(player)
			playerIndex += 1
		}
		teamsFilled += 1
	}
	
	
	let league = new League(2025)

	let season = new Season(Object.keys(teams).map((k)=>Number(k)), 2025)
	const seasons = {'2025': season}


	return {
		league,
		teams,
		players,
		seasons,
	}
}