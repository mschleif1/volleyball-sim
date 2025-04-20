// GameStats.ts

import { PlayerStats } from './PlayerStats';

export type Ball = {
	speed: number;
	inPlay: boolean;
	type: string; // 'serve', 'pass', 'set', 'spike', etc.
	playerId: number;
};

export class GameStats {
	public playerStats: Record<string, PlayerStats> = {};
	public setScores: { [key: number]: number }[] = [];
	public winningTeamId: number | null = null;
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
        return stats;
    }

    private initializePlayer(playerId: number): void {
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
			id: this.id,
		};
	}
}
