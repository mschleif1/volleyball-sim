import { Player } from './Player';
import { IncomingBall } from "./IncomingBall"
import _ from 'lodash';
import assert from 'assert';

export class Team {
	name: string;
	playerIds: number[] ;
    id: string;
    lineup: { [key: number]: Player };  
    userTeam: boolean;
    players: Player[];

	constructor(name: string, playerIds: number[], id: string, userTeam: boolean) {
		this.name = name;
		this.playerIds = playerIds;
        this.id = id
        this.userTeam = userTeam
        this.players = []
        this.lineup =  {}
	}

	get averageSkill(): number {
		const total = this.players.reduce((sum, player) => sum + player.overall, 0);
		return total / this.players.length;
	}


	// static fromJSON(data: any): Team {
	// 	const players = data.players.map((p: any) => Player.fromJSON(p));
	// 	return new Team(data.name, players, data.id);
	// }

    rotateTeam(): void {
        const rotationOrder = [1, 6, 5, 4, 3, 2];
        const newLineup: { [key: number]: any } = {};
    
        for (let i = 0; i < rotationOrder.length; i++) {
            const currentPos = rotationOrder[i];
            const previousIndex = (i + rotationOrder.length - 1) % rotationOrder.length;
            const fromPos = rotationOrder[previousIndex];
            newLineup[currentPos] = this.lineup[fromPos];
        }
    
        this.lineup = newLineup;
    }

    currentServer(): Player{
        return this.lineup![1]
    }

    returnBall(incomingBall: IncomingBall, verbose?: boolean): void{
        // if incoming ball .type is a spike, add a blocking mechanism
        // if serve or freeball, pass by
        const backrowOptions = [1, 5, 6];
        const receivingPos = backrowOptions[Math.floor(Math.random() * backrowOptions.length)];

        let receivingPlayer = this.lineup[receivingPos]
        receivingPlayer.passBall(incomingBall)

        if (verbose){
            console.log(`${receivingPlayer.name} passed with: ${incomingBall.speed} quality`)
        }
    
        // if the first hit missed, don't do anything else
        if (!incomingBall.inPlay) { return }
        
        let setter: Player | null = null;
        if (incomingBall.speed == 1){
            // random person
            let setterOptions = _.filter([1, 2, 3, 4, 5, 6], pos => this.lineup[pos].id !== receivingPlayer.id);

            // Randomly select one of those positions
            let randomIndex = _.random(0, setterOptions.length - 1);

            // Get the player from the lineup using that position
            setter = this.lineup[setterOptions[randomIndex]];
            
        } else {
            // find setter
            let highestSetting = -1;
            for (const pos in this.lineup) {
                const player = this.lineup[pos];
                if (player.setting > highestSetting && player.id != receivingPlayer.id) {
                    highestSetting = player.setting;
                    setter = player;
                }
            }
        }

        
        setter!.setBall(incomingBall)  
        
        if (verbose){
            console.log(`${setter!.name} set with: ${incomingBall.speed} quality`)
        }
        if (!incomingBall.inPlay) { return }
        
        
        // take someone random from the first row that is not the setter.
        const frontRowNumbers = _.shuffle([2,3,4])
        let hitter: Player | null = null
        frontRowNumbers.forEach(number=>{
            if (this.lineup[number].id != setter!.id ){
                hitter = this.lineup[number]
            }
        })
        
        hitter!.spikeBall(incomingBall)    
        if (verbose){
            console.log(`${hitter!.name} hit with: ${incomingBall.speed} quality`)
        }
    } 

    // Before a game, attach the players directly to the team so it's easier to work with
    setPlayersAndLineUp(allPlayers: Record<number, Player>) {
        this.players = [];
        this.lineup = {};
    
        let lineupPos = 1;
    
        this.playerIds.forEach((playerId) => {
            const player = allPlayers[playerId];
            if (!player) return; // optional: skip if player not found
    
            this.players.push(player);
    
            if (lineupPos < 7) {
                this.lineup[lineupPos] = player;
                lineupPos += 1;
            }
        });
    }

    addPlayer(player: Player): void{
        if (this.playerIds.includes(player.id)){
            throw new Error(`ADDING DUPLICATE PLAYER ${player.id} TO TEAM: ${this.id}`);
        }
        
        this.playerIds.push(player.id)
        player.teamId = this.id
    }

    toJSON(){
        return {
            name: this.name,
            playerIds: this.playerIds,
            id: this.id,
            userTeam: this.userTeam
        }
    }

    static rehydrate(jsonData: string): Team{
        const teamAttributes = JSON.parse(jsonData)
		return new Team(
			teamAttributes.name, teamAttributes.playerIds, teamAttributes.id, teamAttributes.userTeam
		)
    }

    static getUserTeam(teams: Record<string, Team>): Team{
        return Object.values(teams).find(team=> team.userTeam)!
    }
}
