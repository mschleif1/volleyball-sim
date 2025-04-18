/*

Class that manages seasons

There are 10 teams in a league. 
Season will have 18 weeks

When a season is initialized, we need to create a schedule. 
Schedule should be pairings of teamIds

The season should be the orchestrator of simming a single game week at a time

Handles seeding for the playoffs

attributes:
- teams - list of ids 
- schedule - list of tuples
- year - year of the season
- current-week - number between 0-17
- playoffSchedule - []
*/

type Matchup = [number, number];

import {Game} from "./Game"
import {Team} from "./Team"
import _ from "lodash"
import { AppData } from "src/AppDataContext";

export class Season {
	teamIds: number[];
	schedule: Matchup[][];
	year: number;
	currentWeek: number;
	playoffSchedule: Matchup[][];

	constructor(teamIds: number[], year: number) {
		if (teamIds.length !== 10) {
			throw new Error("Season must be initialized with exactly 10 teams.");
		}

		this.teamIds = teamIds;
		this.year = year;
		this.currentWeek = 0;
		this.schedule = this.generateSchedule(teamIds);
		this.playoffSchedule = [];
	}

	private generateSchedule(teams: number[]): Matchup[][] {
		const numTeams = teams.length;
		const numWeeks = 18;
		const matchupsPerWeek = numTeams / 2; // 5 games per week

		const schedule: Matchup[][] = [];

		const rotation = [...teams];
		for (let week = 0; week < numWeeks; week++) {
			const weekMatchups: Matchup[] = [];

			for (let i = 0; i < matchupsPerWeek; i++) {
				const home = rotation[i];
				const away = rotation[numTeams - 1 - i];
				weekMatchups.push([home, away]);
			}

			schedule.push(weekMatchups);

			// rotate teams for next week (round-robin style)
			rotation.splice(1, 0, rotation.pop()!);
		}

		return schedule;
	}

	simWeek(leagueData: AppData): void {
		if (this.currentWeek >= this.schedule.length) {
			console.log("All regular season weeks have been simulated.");
			return;
		}
		

		const matchups = this.schedule[this.currentWeek];
		console.log(`Simulating Week ${this.currentWeek + 1}`);
		matchups.forEach(([homeId, awayId]) => {
			let home = leagueData.teams[homeId]
			let away = leagueData.teams[awayId]

			home.setPlayersAndLineUp(leagueData.players)
			away.setPlayersAndLineUp(leagueData.players)
            
			let game = new Game(home, away, Game.createGameId(homeId, awayId, this.currentWeek))
            game.playGame()
		});

		// make this a state call
		this.currentWeek += 1;
	}

	isSeasonOver(): boolean {
		return this.currentWeek >= this.schedule.length;
	}

	// Placeholder for seeding logic
	seedPlayoffs(): void {
		// Implement playoff seeding based on standings (not handled here yet)
		console.log("Seeding playoffs...");
		// Set this.playoffSchedule = ...
	}

	static rehydrate(jsonData: string): Season{
		
		const seasonAttributes = JSON.parse(jsonData)
		return new Season(
			seasonAttributes.teamIds, seasonAttributes.year
		)
	
	}
}
