import { Team } from './Team';
import { IncomingBall } from "./IncomingBall"
import { GameStats } from "./GameStats"
import { Player } from "./Player"
import { filter, random, shuffle } from "lodash"
const SETS_PER_GAME = 3
const POINTS_PER_SET = 25
const SUBS_PER_SET = 5

export class Game {
    team1: Team;
    team2: Team;
    currentSet: number;
    setScores: { [key: number]: number }[];  // Array of objects to store the scores for each set
    gameStats: GameStats
    id: string;
    subsLeft: Record<string, number> 

    // need to pass in the id because it is dependent on the schedule...
    constructor(team1: Team, team2: Team, id: string) {
        this.team1 = team1;
        this.team2 = team2;


        this.currentSet = 0;
        this.setScores = [];
        this.gameStats = new GameStats(id)

        this.id = id
        this.subsLeft = {[team1.id]: SUBS_PER_SET, [team2.id]: SUBS_PER_SET}
    }

    getTeam(teamId: string): Team {
        if (this.team1.id == teamId) {
            return this.team1
        } else {

        }
        return this.team1
    }

    playPoint(winningTeamId: string, verbose?: boolean | null): string {
        // Starting with the serving team
        // serve the ball
        // start the point as normal
        // one of the back row of the offenseTeam
        // based on 1. passing ability 2. hit strength hit the ball


        let teamWithBall = winningTeamId == this.team1.id ? this.team1 : this.team2
        let teamWithoutBall = winningTeamId == this.team1.id ? this.team2 : this.team1

        let server = teamWithBall.currentServer()
        let incomingBall = server.simulateServe()


        let temp = teamWithBall
        teamWithBall = teamWithoutBall
        teamWithoutBall = temp

        if (verbose) {
            console.log(teamWithBall)
            console.log("======NEW POINT=====")
            console.log("SERVING")
            if (incomingBall.inPlay) {
                console.log("served by:", server.name)
            } else {
                console.log("Missed by:", server.name)
            }
            console.log(incomingBall.speed)
        }

        while (true) {
            if (verbose) {
                console.log("++ Ball Crossed Net ++")
                console.log("team with ball:")
                console.log(teamWithBall.name)
            }
            this.returnBall(teamWithBall, incomingBall, false)
            if (!incomingBall.inPlay) { break; } // if the ball was hit out, end the point

            // Swap the teams, so now the other team has a chance to get it back
            let temp = teamWithBall
            teamWithBall = teamWithoutBall
            teamWithoutBall = temp
        }


        if (verbose) {
            console.log("WINNING TEAM", teamWithoutBall.id)
        }

        this.gameStats.recordBallHistory(incomingBall.history)
        
        this.team1.applyFatigue()
        this.team2.applyFatigue()
        
        return teamWithoutBall.id
    }

    // Simulate a single set and return the winning team
    playSet(verbose?: boolean): string {

        let currentSetScores = {
            [this.team1.id]: 0,
            [this.team2.id]: 0
        }

        let winningTeam = (this.currentSet % 2 === 1) ? this.team2.id : this.team1.id;
        let scoreDifference = Math.abs(currentSetScores[this.team1.id] - currentSetScores[this.team2.id])
        while ((currentSetScores[this.team1.id] < POINTS_PER_SET && currentSetScores[this.team2.id] < POINTS_PER_SET) || scoreDifference < 2) {
            let newWinningTeam = this.playPoint(winningTeam, verbose)
            if (verbose){

                console.log("Winning Team:", winningTeam, currentSetScores)
            }
            currentSetScores[winningTeam] += 1

            // if the recieving team won the point again, rotate them.
            if (newWinningTeam != winningTeam) {
                if (this.team1.id == newWinningTeam) {
                    const subMade = this.team1.rotateTeam(this.subsLeft[this.team1.id])
                    if (subMade) {
                        this.subsLeft[this.team1.id] = this.subsLeft[this.team1.id] - 1
                    }
                } else {
                    const subMade = this.team2.rotateTeam(this.subsLeft[this.team2.id])
                    if (subMade) {
                        this.subsLeft[this.team2.id] = this.subsLeft[this.team2.id] - 1
                    }
                }
            }
            winningTeam = newWinningTeam

            scoreDifference = Math.abs(currentSetScores[this.team1.id] - currentSetScores[this.team2.id])
        }


        this.setScores.push(currentSetScores)
        this.subsLeft = {[this.team1.id]: SUBS_PER_SET, [this.team2.id]: SUBS_PER_SET}
        this.currentSet += 1


        // rest after current set
        this.team1.applyRest()
        this.team2.applyRest()

        return currentSetScores[this.team1.id] >= currentSetScores[this.team2.id] ? this.team1.id : this.team2.id
    }



    // Simulate a full game with 5 sets max
    playGame(verbose?: boolean): GameStats {

        let t1SetsWon = 0
        let t2SetsWon = 0

        // loop for playing sets
        while (t1SetsWon < SETS_PER_GAME && t2SetsWon < SETS_PER_GAME) {
            const setWinner = this.playSet(verbose)
            if (setWinner == this.team1.id) {
                t1SetsWon += 1
            } else {
                t2SetsWon += 1
            }

        }
        if (verbose){
            console.log(t1SetsWon, t2SetsWon)
            console.log(this.setScores)
    
            console.log("GAME STATS YEAH")
            console.log("GAME STATS YEAH")
            console.log("GAME STATS YEAH")
            console.log("GAME STATS YEAH")
            console.log(this.gameStats)
        }

        this.gameStats.setScores = this.setScores

        if (t1SetsWon > t2SetsWon) {
            this.gameStats.winningTeamId = this.team1.id
            this.gameStats.losingTeamId = this.team2.id

        } else {
            this.gameStats.winningTeamId = this.team2.id
            this.gameStats.losingTeamId = this.team1.id
        }

        return this.gameStats

    }

    returnBall(team: Team, incomingBall: IncomingBall, verbose?: boolean): void {
        // if incoming ball .type is a spike, add a blocking mechanism
        // if serve or freeball, pass by
        const backrowOptions = [1, 5, 6];
        const receivingPos = backrowOptions[Math.floor(Math.random() * backrowOptions.length)];

        let receivingPlayer = team.lineup[receivingPos]
        receivingPlayer.passBall(incomingBall)

        if (verbose) {
            console.log(`${receivingPlayer.name} passed with: ${incomingBall.speed} quality`)
        }

        // if the first hit missed, don't do anything else
        if (!incomingBall.inPlay) { return }

        let setter: Player | null = null;
        if (incomingBall.speed == 1) {
            // random person
            let setterOptions = filter([1, 2, 3, 4, 5, 6], pos => team.lineup[pos].id !== receivingPlayer.id);

            // Randomly select one of those positions
            let randomIndex = random(0, setterOptions.length - 1);

            // Get the player from the lineup using that position
            setter = team.lineup[setterOptions[randomIndex]];

        } else {
            // find setter
            let highestSetting = -1;
            for (const pos in team.lineup) {
                const player = team.lineup[pos];
                if (player.setting > highestSetting && player.id != receivingPlayer.id) {
                    highestSetting = player.setting;
                    setter = player;
                }
            }
        }


        setter!.setBall(incomingBall)

        if (verbose) {
            console.log(`${setter!.name} set with: ${incomingBall.speed} quality`)
        }
        if (!incomingBall.inPlay) { return }


        // take someone random from the first row that is not the setter.
        const frontRowNumbers = shuffle([2, 3, 4])
        let hitter: Player | null = null
        frontRowNumbers.forEach(number => {
            if (team.lineup[number].id != setter!.id) {
                hitter = team.lineup[number]
            }
        })

        hitter!.spikeBall(incomingBall)
        if (verbose) {
            console.log(`${hitter!.name} hit with: ${incomingBall.speed} quality`)
        }
    }


    static createGameId(team1: string, team2: string, weekNumber: number): string {
        return `${team1}-${team2}-${weekNumber}`
    }

    static getTeamIdsFromGameId(id: string): number[] {
        let ids = id.split("-")
        if (ids.length != 3) {
            throw new Error("ID NOT FORMATTED RIGHT")
        }
        return [parseInt(ids[0]), parseInt(ids[1])]
    }
}
