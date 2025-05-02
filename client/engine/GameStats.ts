// GameStats.ts

import { PlayerStats } from './PlayerStats';
import { isEmpty } from 'lodash';
export type Ball = {
	speed: number;
	inPlay: boolean;
	type: string; // 'serve', 'pass', 'set', 'spike', etc.
	playerId: string;
};

export class GameStats {
	public playerStats: Record<string, PlayerStats> = {};
	public setScores: { [key: string]: number }[] = [];
	public winningTeamId: string | null = null;
	public losingTeamId: string | null = null;
	public id: string;


	constructor(id: string) {
		this.id = id;
	}

    static rehydrate(jsonData: string): GameStats {
		
		let data = JSON.parse(jsonData)
        let stats = new GameStats(data.id);
        stats.playerStats = Object.fromEntries(
            Object.entries(data.playerStats || {}).map(
                ([id, ps]) => [id, PlayerStats.rehydrate(ps)]
            )
        );
        stats.setScores = data.setScores || [];
        stats.winningTeamId = data.winningTeamId || null;
		stats.losingTeamId = data.losingTeamId || null;
        return stats;
    }

    private initializePlayer(playerId: string): void {
        if (!this.playerStats[playerId]) {
            this.playerStats[playerId] = new PlayerStats(playerId);
        }
    }

	public recordBallHistory(balls: Ball[]): void {
		for (let i = 0; i < balls.length; i++) {
			const ball = balls[i];
			const nextBall = balls[i + 1];
			this.initializePlayer(ball.playerId);
			const stats = this.playerStats[ball.playerId];

			switch (ball.type) {
				case 'serve':
					stats.recordServe(ball, nextBall);
					break;
				case 'pass':
					stats.recordPass(ball);
					break;
				case 'set':
					stats.recordSet(ball);
					break;
				case 'spike':
					stats.recordSpike(ball, nextBall);
					break;
			}
		}
	}

	public toJSON(): object {
		const serializedPlayerStats = Object.fromEntries(
			Object.entries(this.playerStats).map(([id, ps]) => [id, { ...ps }])
		);

		return {
			playerStats: serializedPlayerStats,
			setScores: this.setScores,
			winningTeamId: this.winningTeamId,
			losingTeamId: this.losingTeamId,
			id: this.id,
		};
	}

	static getRecord(teamId: string, gameStats: Record<string, GameStats>): string  {
		if (!gameStats || isEmpty(gameStats) || !teamId){ return "0-0" }
	

		let wins = 0
		let losses = 0
		Object.keys(gameStats).forEach(id=>{
			const teamIds = id.split("-")
			if (teamIds[0] == teamId || teamIds[1] == teamId){
				if (gameStats[id].winningTeamId == teamId){
					wins ++
				} else {
					losses ++
				}
			}
		})

		if (wins + losses == 0) {
			throw new Error("TEAM NOT IN HERE...")
		}

		return `${wins}-${losses}`
	}

	static getResultForTeam(gameStats: Record<string, GameStats>, weekIndex: number, teamId: string): GameStats | void {
		const gameIds = Object.keys(gameStats)
		for (let i = 0; i < gameIds.length; i++){
			const gameId = gameIds[i]
			const ids = gameId.split("-")
	
			
			if (parseInt(ids[2]) == weekIndex && (teamId == ids[0] || teamId == ids[1])){
				return gameStats[gameId]
			}
		}
	}

	static getRecordsForTeams(gameStats: Record<string, GameStats>): Record<string, { wins: number; losses: number }> {
		let records: Record<string, { wins: number; losses: number }> = {}
		const gameIds = Object.keys(gameStats)
	
		for (let i = 0; i < gameIds.length; i++) {
			const gameStat = gameStats[gameIds[i]]
			const winningTeamId = gameStat.winningTeamId!
			const losingTeamId = gameStat.losingTeamId!
	
			if (!records[winningTeamId]) {
				records[winningTeamId] = { wins: 0, losses: 0 }
			}
			if (!records[losingTeamId]) {
				records[losingTeamId] = { wins: 0, losses: 0 }
			}
	
			records[winningTeamId].wins += 1
			records[losingTeamId].losses += 1
		}
	
		return records
	}
	
}
