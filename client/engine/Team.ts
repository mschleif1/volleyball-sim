import { Player } from './Player';
import { IncomingBall } from "./IncomingBall"
import _ from 'lodash';
import assert from 'assert';

export class Team {
	name: string;
	playerIds: string[] ;
    id: string;
    lineup: { [key: number]: Player };  
    userTeam: boolean;
    players: Player[];

	constructor(name: string, playerIds: string[], id: string, userTeam: boolean) {
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


    rotateTeam(rotationsLeft: number): boolean {
        const rotationOrder = [1, 6, 5, 4, 3, 2];
        let subMade = false;
    
        // Perform rotation
        for (let r = 0; r < rotationsLeft; r++) {
            const newLineup: { [key: number]: Player } = {};
            for (let i = 0; i < rotationOrder.length; i++) {
                const currentPos = rotationOrder[i];
                const fromPos = rotationOrder[(i + rotationOrder.length - 1) % rotationOrder.length];
                newLineup[currentPos] = this.lineup[fromPos];
            }
            this.lineup = newLineup;
        }
    
        const backRow = [1, 6, 5];
        const frontRow = [2, 3, 4];
        const lineupPlayers = Object.values(this.lineup);
        const currentLineupIds = new Set(lineupPlayers.map(p => p.id));
        const libero = this.players.find(p => p.position === "libero");
        const isLiberoInLineup = libero && lineupPlayers.some(p => p.id === libero.id);
    
        // Libero substitution logic (does NOT count as real sub)
        for (const pos of rotationOrder) {
            const player = this.lineup[pos];
    
            // Libero IN for middle in back row
            if (backRow.includes(pos) && player?.position === "middle" && libero && !isLiberoInLineup) {
                this.lineup[pos] = libero;
                break; // libero sub doesn't end function
            }
    
            // Libero OUT in front row
            if (frontRow.includes(pos) && player?.id === libero?.id) {
                const availableMiddles = this.players
                    .filter(p => p.position === "middle" && !currentLineupIds.has(p.id))
                    .sort((a, b) => b.overall - a.overall);
    
                const replacement = availableMiddles[0];
                if (replacement) {
                    this.lineup[pos] = replacement;
                    break; // libero sub doesn't end function
                }
            }
        }
    
        // Fatigue-based substitution logic (counts as sub)
        const bench = this.players.filter(
            p => !currentLineupIds.has(p.id) && p.position !== "libero"
        );
    
        for (const pos of rotationOrder) {
            const current = this.lineup[pos];
            if (!current || current.position === "libero") continue;
    
            const fatigue = 100 - current.currentEnergy;
            const fatigueScore = fatigue * (110 - current.overall);
    
            if (fatigueScore > 1500) {
                const possibleSubs = bench
                    .filter(p => p.position === current.position)
                    .sort((a, b) => {
                        const aScore = (100 - a.currentEnergy) * (110 - a.overall);
                        const bScore = (100 - b.currentEnergy) * (110 - b.overall);
                        return aScore - bScore;
                    });
    
                const sub = possibleSubs[0];
                if (sub) {
                    this.lineup[pos] = sub;
                    return true; // Regular sub — return true
                }
            }
        }
    
        return false; // No regular sub was made
    }
    

    currentServer(): Player{
        return this.lineup![1]
    }

    // Before a game, attach the players directly to the team so it's easier to work with
    setPlayersAndLineUp(allPlayers: Record<string, Player>) {
        this.players = [];
        this.lineup = {};
    
        // Load all players
        this.playerIds.forEach((playerId) => {
            const player = allPlayers[playerId];
            if (player) {
                this.players.push(player);
            }
        });
    
        const sortByOverall = (a: Player, b: Player) => b.overall - a.overall;
        console.log(this.players)
        console.log(this.players.filter(p => p.position == "middle"), "MIDDLES")
        const middles = this.players.filter(p => p.position === "middle").sort(sortByOverall);
        const hitters = this.players.filter(p => p.position === "hitter").sort(sortByOverall);
        const setters = this.players.filter(p => p.position === "setter").sort(sortByOverall);
        const selected = new Set<string>();
        const lineup: { [key: number]: Player } = {};
    
        // Assign middles opposite each other — default to positions 2 and 5
        const middle1 = middles[0];
        const middle2 = middles[1];
        if (middle1) {
            lineup[2] = middle1;
            selected.add(middle1.id);
        }
        if (middle2) {
            lineup[5] = middle2;
            selected.add(middle2.id);
        }
    
        // Assign best setter
        const setter = setters.find(p => !selected.has(p.id));
        if (setter) {
            const preferredSetterPos = [1, 3, 6];
            const pos = preferredSetterPos.find(p => !lineup[p]);
            if (pos) {
                lineup[pos] = setter;
                selected.add(setter.id);
            }
        }
    
        // Assign up to 3 hitters
        let hitterCount = 0;
        for (const hitter of hitters) {
            if (selected.has(hitter.id)) continue;
            const pos = [1, 3, 4, 6].find(p => !lineup[p]); // skip middle spots
            if (!pos) break;
            lineup[pos] = hitter;
            selected.add(hitter.id);
            hitterCount++;
            if (hitterCount >= 3) break;
        }
    
        // Fill remaining lineup spots with best available players
        const bench = this.players
            .filter(p => !selected.has(p.id))
            .sort(sortByOverall);
    
        for (let pos = 1; pos <= 6; pos++) {
            if (!lineup[pos] && bench.length > 0) {
                const player = bench.shift();
                if (player) {
                    lineup[pos] = player;
                    selected.add(player.id);
                }
            }
        }
        console.log("+++++++")
        console.log(lineup)
        console.log(this.players)
        this.lineup = lineup;
    }

    applyFatigue(){
        Object.values(this.lineup).forEach(player=> player.fatigue())
    }

    applyRest(){
        console.log("APPLYING DA REST")
        console.log(this.players)
        this.players.forEach(player=> player.rest())
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
