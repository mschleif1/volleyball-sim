import { Player } from './Player';
import { Team } from "./Team"
import { League } from "./League"
import { Season } from "./Season"
import { saveLeague } from './DataManager';

import _ from "lodash"

const teamNames = [
	"Spike Syndicate",
	"Net Ninjas",
	"Block Party",
	"Ace Assassins",
	"Kill Shot",
	"Smash Titans",
	"The Dig Force",
	"Vertical Threat",
	"Powerline",
	"Cross Court Kings",
	"Set to Stun",
	"Net Results",
	"Bumpin' Uglies",
	"Hit Me Baby One More Time",
	"Notorious D.I.G.",
	"New Kids on the Block",
	"I'd Hit That",
	"Served Cold",
	"Spikological Warfare",
	"Dig-a-saurus Rex",
	"Sunset Spikers",
	"Coastal Chaos",
	"Northern Netters",
	"Midtown Smash",
	"Downtown Diggers",
	"Pacific Power",
	"Urban Elevation",
	"Highland Heat",
	"Lakeside Killers",
	"Metro Volley Club"
]

const firstNames = [
    "Matt",
    "Ozzmatazz",
    "Contessa",
    "Brynn",
    "Reilly",
    "Terrence",
    "Cornstock",
    "Billy Joe",
    "Marissa",
    "Kayleigh",
    "Botswana",
    "Karminissa",
    "Jazz",
    "Beatrice",
    "Grace",
    "Sara",
    "Clarrisa",
    "Rodney",
	"Cara",
	"Darth",
	"Garth",
	"Saxon",
	"John",
	"Jacob",
	"Crysanthemum",
	"Coraline",
	"Beau",
	"Terrence",
	"Nick",
	"Asher",
	"Tomás",
	"Quentin",
	"Philip",
	"Draco",
	"Dumbledore",
	"Hubert",
	"Juan",
	"Josefina",
	"David",
	"Corinne",
	"Marcos",
	"Maria", 
	"Marty",
	"Alicia",
	"Julia",
	"Olivia",
	"Teresa",
	"Daniel",
	"Quentin",
	"Seamus",
	"Lebron"
];

const lastNames = [
	"O'Malley",
    "Johnson",
    "Cellars",
    "Matthews",
	"Gingleheimer-Smith",
	"Dinklestein",
    "Williams",
    "McTabernathy",
    "Doorfenshmith",
    "Goldstein",
    "Hoovensmitch",
    "Briddleby",
    "Borker",
    "Haverford",
    "Flagg",
    "Jordan",
    "Lively",
    "Reynolds",
	"Mungo",
	"Congolius",
	"Giggums",
	"Pinklewerry",
	"Persifermus",
	"John",
	"Lichtenstein",
	"Townley",
	"Tuttle",
	"Raytheon",
	"Erasmus",
	"Hollander",
	"Adams",
	"Maloise",
	"Concão",
	"Felicitão",
	"Jones",
	"Ng",
	"Chen",
	"Huang"
]
const PLAYERS_PER_TEAM = 6
const PLAYER_LEAGUE_COUNT = 70
const TEAM_LEAGUE_COUNT = 10
const generateRating = () =>{
    return Math.floor(Math.random() * (100 - 50 + 1)) + 50;

}

const generateId = (min= 0, max= 100) =>{
    return Math.floor(Math.random() * 1000000) + 1;

}

const generatePlayer = (playerIndex: number)=>{
    
    const firstName = _.sample(firstNames)
    const lastName = _.sample(lastNames)
    return new Player(`${firstName} ${lastName}`, "OH", playerIndex, generateRating(), generateRating(), generateRating(), generateRating(), generateRating(), generateRating(), generateRating(), null)
}

export const generateTeam = (teamName: string, teamIndex: number): Team => {
	
	const players: Player[] = [];
	
	
	const name = teamName ? teamName : _.sample(teamNames)!;
	const isUserTeam = teamName ? true : false 
	
	return new Team(name, [], teamIndex, isUserTeam);
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
	teams: Team[];
	players: Player[];
	season: Season;
};

export const generateLeague = (playerTeamName: string): LeagueBundle => {	
	let playerIdCounter = 0;
	let teamIdCounter = 0;

	let players = []
	while (playerIdCounter < PLAYER_LEAGUE_COUNT){
		players.push(generatePlayer(playerIdCounter ++))
		
	}
	
	let teams = []
	while (teamIdCounter < TEAM_LEAGUE_COUNT - 1){
		teams.push(generateTeam("", teamIdCounter ++))
	}
	teams.push(generateTeam(playerTeamName, teamIdCounter))
	
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

	let season = new Season(teams.map(team=> team.id), 2025)
	
	// save the league to local storage
	saveLeague(league, teams, players, [season])

	return {
		league,
		teams,
		players,
		season,
	}
}