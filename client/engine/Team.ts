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
    lineupPreferences: { [position: string]: string[] };

	constructor(name: string, playerIds: string[], id: string, userTeam: boolean) {
		this.name = name;
		this.playerIds = playerIds;
        this.id = id
        this.userTeam = userTeam
        this.players = []
        this.lineup =  {}
        this.lineupPreferences = {}
	}

	get averageSkill(): number {
		const total = this.players.reduce((sum, player) => sum + player.overall, 0);
		return total / this.players.length;
	}

    // Helper to get player preference index (lower is more preferred)
    getPreferenceRank(player: Player): number {
        if (!this.userTeam || !this.lineupPreferences[player.position]) return Infinity;
        const index = this.lineupPreferences[player.position].indexOf(player.id);
        return index >= 0 ? index : Infinity;
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
                        const aFatigue = (100 - a.currentEnergy) * (110 - a.overall);
                        const bFatigue = (100 - b.currentEnergy) * (110 - b.overall);
                        const aPref = this.getPreferenceRank(a);
                        const bPref = this.getPreferenceRank(b);
                        const aScore = aFatigue * 0.7 + aPref * 10;
                        const bScore = bFatigue * 0.7 + bPref * 10;
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
        const selected = new Set<string>();
        const lineup: { [key: number]: Player } = {};

        const pickFrom = (players: Player[], position: string, count: number): Player[] => {
            const filtered = players.filter(p => p.position === position);
            if (this.userTeam && this.lineupPreferences[position]) {
                return [...filtered].sort((a, b) => this.getPreferenceRank(a) - this.getPreferenceRank(b)).slice(0, count);
            } else {
                return [...filtered].sort(sortByOverall).slice(0, count);
            }
        }
    
        // Assign middles opposite each other — default to positions 2 and 5
        const middles = pickFrom(this.players, "middle", 2);
        if (middles[0]) {
            lineup[2] = middles[0];
            selected.add(middles[0].id);
        }
        if (middles[1]) {
            lineup[5] = middles[1];
            selected.add(middles[1].id);
        }
    
        // Assign best setter
        const setter = pickFrom(this.players, "setter", 1)[0];
        if (setter) {
            const preferredSetterPos = [1, 3, 6];
            const pos = preferredSetterPos.find(p => !lineup[p]);
            if (pos) {
                lineup[pos] = setter;
                selected.add(setter.id);
            }
        }
    
        // Assign up to 3 hitters
        const hitters = pickFrom(this.players, "hitter", 3);
        for (const hitter of hitters) {
            if (selected.has(hitter.id)) continue;
            const pos = [1, 3, 4, 6].find(p => !lineup[p]); // skip middle spots
            if (!pos) break;
            lineup[pos] = hitter;
            selected.add(hitter.id);
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
        this.lineup = lineup;
    }

    applyFatigue(){
        Object.values(this.lineup).forEach(player=> player.fatigue())
    }

    // for rests between points
    applyRest(){
        this.players.forEach(player=> player.rest())
    }

    applyWeekRest(){
        this.players.forEach(player=> player.restWeek())
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
            userTeam: this.userTeam,
            lineupPreferences: this.lineupPreferences
        }
    }

    static rehydrate(jsonData: string): Team{
        const teamAttributes = JSON.parse(jsonData)
		const team = new Team(
			teamAttributes.name, teamAttributes.playerIds, teamAttributes.id, teamAttributes.userTeam
		)
        if (teamAttributes.lineupPreferences) {
            team.lineupPreferences = teamAttributes.lineupPreferences;
        }
        return team;
    }

    static getUserTeam(teams: Record<string, Team>): Team{
        return Object.values(teams).find(team=> team.userTeam)!
    }
}
