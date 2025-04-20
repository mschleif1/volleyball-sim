import { Team } from './Team';
//import { IncomingBall } from "./IncomingBall"
import { GameStats } from "./GameStats"
import { Player } from "./Player"
const SETS_PER_GAME = 3
const POINTS_PER_SET = 25

export class Game {
	team1: Team;
	team2: Team;
    currentSet: number;
    setScores: { [key: number]: number }[];  // Array of objects to store the scores for each set
    gameStats: GameStats
    id: string

    // need to pass in the id because it is dependent on the schedule...
	constructor(team1: Team, team2: Team, id: string) {
		this.team1 = team1;
		this.team2 = team2;
		
        
        this.currentSet = 0;
        this.setScores = [];
        this.gameStats = new GameStats(id)
        
        this.id = id
	}

    getTeam(teamId: number): Team {
        if (this.team1.id == teamId){
            return this.team1
        } else {

        }
        return this.team1
    }

    playPoint(winningTeamId: number, verbose?: boolean | null): number{
        // Starting with the serving team
        // serve the ball
        // start the point as normal
        // one of the back row of the offenseTeam
        // based on 1. passing ability 2. hit strength hit the ball


        let teamWithBall = winningTeamId == this.team1.id ? this.team1: this.team2
        let teamWithoutBall = winningTeamId == this.team1.id ? this.team2: this.team1

        let server = teamWithBall.currentServer()
        let incomingBall = server.simulateServe()

        
        let temp = teamWithBall
        teamWithBall = teamWithoutBall
        teamWithoutBall = temp

        if (verbose){
            console.log(teamWithBall)
            console.log("======NEW POINT=====")
            console.log("SERVING")
            if (incomingBall.inPlay){
                console.log("served by:", server.name)
            } else {
                console.log("Missed by:", server.name)
            }
            console.log(incomingBall.speed)
        }
        
        while (true) {
            console.log(teamWithBall.id)
            console.log(teamWithoutBall.id)
            if (verbose){
                console.log("++ Ball Crossed Net ++")
                console.log("team with ball:")
                console.log(teamWithBall.name)
            }
            teamWithBall.returnBall(incomingBall, true)
            if (!incomingBall.inPlay){ break; } // if the ball was hit out, end the point
            
            // Swap the teams, so now the other team has a chance to get it back
            let temp = teamWithBall
            teamWithBall = teamWithoutBall
            teamWithoutBall = temp
        }


        if (verbose){
            console.log("WINNING TEAM", teamWithoutBall.id)
        }

        this.gameStats.recordBallHistory(incomingBall.history)
        return teamWithoutBall.id
    }

    recordStats(pointHistory: Object[]){
        // create some kind of record of the points

        // Player stats ==>
        /*
        create new stats for the player, and for the season
        */
    }


    // Simulate a single set and return the winning team
	playSet(): number {
        
        let currentSetScores = {
            [this.team1.id]: 0,
            [this.team2.id]: 0
        }
        
        let winningTeam = (this.currentSet % 2 === 1) ? this.team2.id : this.team1.id;
        let scoreDifference = Math.abs(currentSetScores[this.team1.id] - currentSetScores[this.team2.id])
        while ((currentSetScores[this.team1.id] < POINTS_PER_SET && currentSetScores[this.team2.id] < POINTS_PER_SET) || scoreDifference < 2) {
            let newWinningTeam = this.playPoint(winningTeam, true)
            console.log("Winning Team:", winningTeam, currentSetScores)
            currentSetScores[winningTeam] += 1
            
            // if the recieving team won the point again, rotate them.
            if (newWinningTeam != winningTeam){
                if (this.team1.id == newWinningTeam){
                    this.team1.rotateTeam()
                } else {
                    this.team2.rotateTeam()
                }
            }
            winningTeam = newWinningTeam

            scoreDifference = Math.abs(currentSetScores[this.team1.id] - currentSetScores[this.team2.id])
        }


        this.setScores.push( currentSetScores )

        this.currentSet += 1
        

        return currentSetScores[this.team1.id] >= currentSetScores[this.team2.id] ? this.team1.id : this.team2.id
	}

    

	// Simulate a full game with 5 sets max
	playGame(): GameStats {
		
        let t1SetsWon = 0
        let t2SetsWon = 0

        // loop for playing sets
        while (t1SetsWon < SETS_PER_GAME && t2SetsWon < SETS_PER_GAME){
            const setWinner = this.playSet()
            if (setWinner == this.team1.id){
                t1SetsWon += 1
            } else {
                t2SetsWon += 1
            }
            
        }
        console.log(t1SetsWon, t2SetsWon)
        console.log(this.setScores)

        console.log("GAME STATS YEAH")
        console.log("GAME STATS YEAH")
        console.log("GAME STATS YEAH")
        console.log("GAME STATS YEAH")
        console.log(this.gameStats)
        
        this.gameStats.setScores = this.setScores
        
        if (t1SetsWon > t2SetsWon){
            this.gameStats.winningTeamId = this.team1.id
            
        } else {
            this.gameStats.winningTeamId = this.team2.id
        }

        return this.gameStats

	}

    static createGameId(team1: number, team2: number, weekNumber: number): string {
        return `${team1}-${team2}-${weekNumber}`
    }

    static getTeamIdsFromGameId(id: string): number[]{
        let ids = id.split("-")
        if (ids.length != 3){
            throw new Error("ID NOT FORMATTED RIGHT")
        }
        return [parseInt(ids[0]), parseInt(ids[1])]
    }
}
