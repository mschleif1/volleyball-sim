import { Team } from './Team';
import { IncomingBall } from "./IncomingBall"

const SETS_PER_GAME = 3
const POINTS_PER_SET = 25

export class Game {
	team1: Team;
	team2: Team;
    currentSet: number;
    setScores: { [key: number]: number }[];  // Array of objects to store the scores for each set


	constructor(team1: Team, team2: Team) {
		this.team1 = team1;
		this.team2 = team2;
		
        
        this.currentSet = 0;
        this.setScores = [];
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
        incomingBall.updateHistory()
        
        if (verbose){
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
            incomingBall.updateHistory()
        }


        
        return teamWithoutBall.id
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
            winningTeam = this.playPoint(winningTeam, true)
            console.log(winningTeam)
            currentSetScores[winningTeam] += 1

            if (this.team1.id == winningTeam){
                this.team1.rotateTeam()
            } else {
                this.team2.rotateTeam()
            }

            scoreDifference = Math.abs(currentSetScores[this.team1.id] - currentSetScores[this.team2.id])
        }


        this.setScores.push( currentSetScores )

        this.currentSet += 1
        

        return currentSetScores[this.team1.id] >= currentSetScores[this.team2.id] ? this.team1.id : this.team2.id
	}

    

	// Simulate a full game with 5 sets max
	playGame(): number {
		
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
        if (t1SetsWon > t2SetsWon){
            return this.team1.id
        } else {
            return this.team2.id
        }

	}
}
