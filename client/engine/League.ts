/*
user_id
currentSeasonId
userTeamId
*/


import { Team } from './Team';
import { Season } from './Season'
import { generateLeagueTeams } from "./DataGenerator"
import { find } from "lodash"

export class League {
	currentSeasonYear: number | null;
    
    constructor(currentSeasonYear: number) {
        this.currentSeasonYear = currentSeasonYear
        
	}

    toJSON(){
        return {
            currentSeasonYear: this.currentSeasonYear
        }
    }

	static rehydrate(jsonData: string): League{
		const leagueAttributes = JSON.parse(jsonData)
		return new League(leagueAttributes.currentSeasonYear)
	
	}
}
