import { Team } from "./Team"
import { League } from "./League"
import { Player } from "./Player"
import { Season } from "./Season"

const TEAMS = 'teams'
const LEAGUE = 'league'
const PLAYERS = 'players'
const SEASONS = 'seasons'

function serialize<T>(instance: T): object {
    const serializedObject: any = { ...instance };
    return serializedObject;
}

function rehydrate<T extends object>(data: object, ClassConstructor: { new (): T }): T {
    const instance = new ClassConstructor();
    Object.assign(instance, data); // Copy properties to the instance
    return instance;
}

// export function getLeague(): League | undefined | {} {
//     // try to load the league from the localStorage
//     const leagueJSON = localStorage.getItem(LEAGUE)
//     if (!leagueJSON){ return }

//     return rehydrate( JSON.parse(leagueJSON), League )
// }


// Saves the entire league as is to local storage
export function saveLeague(league: League, teams: Team[], players: Player[], seasons: Season[]): void {
    
    // Leagues
    const dehydratedLeague = JSON.stringify(league)
    localStorage.setItem(LEAGUE, dehydratedLeague)

    // Teams
    const dehydratedTeams = teams.map(team=> JSON.stringify(team))
    localStorage.setItem(TEAMS, JSON.stringify(dehydratedTeams))

    // Players
    const dehydratedPlayers = players.map(player=> JSON.stringify(player))
    localStorage.setItem(PLAYERS, JSON.stringify(dehydratedPlayers))

    // Seasons
    const dehydratedSeasons = seasons.map(season=> JSON.stringify(season))
    localStorage.setItem(SEASONS, JSON.stringify(dehydratedSeasons))
}

// Saves the entire league as is to local storage
export function loadLeague(league: League, teams: Team[], players: Player[], seasons: Season[]): void {
    
    // Leagues
    const dehydratedLeague = JSON.stringify(league)
    localStorage.setItem(LEAGUE, dehydratedLeague)

    // Teams
    const dehydratedTeams = teams.map(team=> JSON.stringify(team))
    localStorage.setItem(TEAMS, JSON.stringify(dehydratedTeams))

    // Players
    const dehydratedPlayers = players.map(player=> JSON.stringify(player))
    localStorage.setItem(PLAYERS, JSON.stringify(dehydratedPlayers))

    // Seasons
    const dehydratedSeasons = seasons.map(season=> JSON.stringify(season))
    localStorage.setItem(SEASONS, JSON.stringify(dehydratedSeasons))
}