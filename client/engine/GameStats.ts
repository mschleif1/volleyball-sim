// GameStats.ts

export type Ball = {
	speed: number;
	inPlay: boolean;
	type: string; // 'serve', 'pass', 'set', 'spike', etc.
	playerId: number;
};

export type PlayerStats = {
	servesAttempted: number;
	servesMissed: number;
	servesMade: number;
	servesAced: number;
	averageServeSpeed: number;

	passesAttempted: number;
	passesMissed: number;
	perfectPasses: number;

	setsAttempted: number;
	setsMissed: number;
	perfectSets: number;

	spikesAttempted: number;
	spikesMissed: number;
	kills: number;
	averageSpikeSpeed: number;
};

export class GameStats {
	public playerStats: Record<string, PlayerStats> = {};
	public setScores: number[][] = [];
	public winningTeamId: string | null = null;

	constructor() {}

	static rehydrate(data: any): GameStats {
		const stats = new GameStats();
		stats.playerStats = data.playerStats || {};
		stats.setScores = data.setScores || [];
		stats.winningTeamId = data.winningTeamId || null;
		return stats;
	}

	private initializePlayer(playerId: number): void {
		if (!this.playerStats[playerId]) {
			this.playerStats[playerId] = {
				servesAttempted: 0,
				servesMissed: 0,
				servesMade: 0,
				servesAced: 0,
				averageServeSpeed: 0,

				passesAttempted: 0,
				passesMissed: 0,
				perfectPasses: 0,

				setsAttempted: 0,
				setsMissed: 0,
				perfectSets: 0,

				spikesAttempted: 0,
				spikesMissed: 0,
				kills: 0,
				averageSpikeSpeed: 0,
			};
		}
	}

	private _updateAverage(currentAvg: number, newValue: number, count: number): number {
		if (count === 0) return 0;
		return (currentAvg * (count - 1) + newValue) / count;
	}

	public recordBallHistory(balls: Ball[]): void {
		for (let i = 0; i < balls.length; i++) {
			const ball = balls[i];
			const nextBall = balls[i + 1];
			this.initializePlayer(ball.playerId);
			const stats = this.playerStats[ball.playerId];

			switch (ball.type) {
				case 'serve':
					stats.servesAttempted++;
					if (!ball.inPlay) {
						stats.servesMissed++;
					} else {
						stats.servesMade++;
						stats.averageServeSpeed = this._updateAverage(
							stats.averageServeSpeed,
							ball.speed,
							stats.servesMade
						);
						if (
							nextBall &&
							nextBall.type === 'pass' &&
							!nextBall.inPlay
						) {
							stats.servesAced++;
						}
					}
					break;

				case 'pass':
					stats.passesAttempted++;
					if (!ball.inPlay) {
						stats.passesMissed++;
					} else if (ball.speed == 3) {
						stats.perfectPasses++;
					}
					break;

				case 'set':
					stats.setsAttempted++;
					if (!ball.inPlay) {
						stats.setsMissed++;
					} else if (ball.speed == 3) {
						stats.perfectSets++;
					}
					break;

				case 'spike':
					stats.spikesAttempted++;
					if (!ball.inPlay) {
						stats.spikesMissed++;
					} else {
						const successfulSpikes = stats.spikesAttempted - stats.spikesMissed;
						stats.averageSpikeSpeed = this._updateAverage(
							stats.averageSpikeSpeed,
							ball.speed,
							successfulSpikes
						);
						if (
							nextBall &&
							nextBall.type === 'pass' &&
							!nextBall.inPlay
						) {
							stats.kills++;
						}
					}
					break;
			}
		}
	}

	public toJSON(): object {
		return {
			playerStats: this.playerStats,
			setScores: this.setScores,
			winningTeamId: this.winningTeamId,
		};
	}
}
