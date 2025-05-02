export class PlayerStats {
	playerId: string;

	servesAttempted = 0;
	servesMissed = 0;
	servesMade = 0;
	servesAced = 0;
	averageServeSpeed = 0;

	passesAttempted = 0;
	passesMissed = 0;
	perfectPasses = 0;

	setsAttempted = 0;
	setsMissed = 0;
	perfectSets = 0;

	spikesAttempted = 0;
	spikesMissed = 0;
	kills = 0;
	averageSpikeSpeed = 0;

	constructor(playerId: string, data?: Partial<PlayerStats>) {
		this.playerId = playerId;
		if (data) Object.assign(this, data);
	}
	
	static rehydrate(data: any): PlayerStats {
		const stats = new PlayerStats(data.playerId);
		Object.assign(stats, data);
		return stats;
	}
	


	private _updateAverage(currentAvg: number, newValue: number, count: number): number {
		if (count === 0) return 0;
		return (currentAvg * (count - 1) + newValue) / count;
	}

	recordServe(ball: { speed: number; inPlay: boolean }, nextBall?: { type: string; inPlay: boolean }) {
		this.servesAttempted++;
		if (!ball.inPlay) {
			this.servesMissed++;
		} else {
			this.servesMade++;
			this.averageServeSpeed = this._updateAverage(this.averageServeSpeed, ball.speed, this.servesMade);
			if (nextBall?.type === 'pass' && !nextBall.inPlay) {
				this.servesAced++;
			}
		}
	}

	recordPass(ball: { speed: number; inPlay: boolean }) {
		this.passesAttempted++;
		if (!ball.inPlay) {
			this.passesMissed++;
		} else if (ball.speed === 3) {
			this.perfectPasses++;
		}
	}

	recordSet(ball: { speed: number; inPlay: boolean }) {
		this.setsAttempted++;
		if (!ball.inPlay) {
			this.setsMissed++;
		} else if (ball.speed === 3) {
			this.perfectSets++;
		}
	}

	recordSpike(ball: { speed: number; inPlay: boolean }, nextBall?: { type: string; inPlay: boolean }) {
		this.spikesAttempted++;
		if (!ball.inPlay) {
			this.spikesMissed++;
		} else {
			const successfulSpikes = this.spikesAttempted - this.spikesMissed;
			this.averageSpikeSpeed = this._updateAverage(this.averageSpikeSpeed, ball.speed, successfulSpikes);
			if (nextBall?.type === 'pass' && !nextBall.inPlay) {
				this.kills++;
			}
		}
	}
    
    mergeFrom(other: PlayerStats) {
		const mergeAvg = (currAvg: number, newAvg: number, currCount: number, newCount: number): number => {
			if (currCount + newCount === 0) return 0;
			return (currAvg * currCount + newAvg * newCount) / (currCount + newCount);
		};

		this.servesAttempted += other.servesAttempted;
		this.servesMissed += other.servesMissed;
		this.servesMade += other.servesMade;
		this.servesAced += other.servesAced;
		this.averageServeSpeed = mergeAvg(
			this.averageServeSpeed,
			other.averageServeSpeed,
			this.servesMade - other.servesMade, // careful subtraction
			other.servesMade
		);

		this.passesAttempted += other.passesAttempted;
		this.passesMissed += other.passesMissed;
		this.perfectPasses += other.perfectPasses;

		this.setsAttempted += other.setsAttempted;
		this.setsMissed += other.setsMissed;
		this.perfectSets += other.perfectSets;

		this.spikesAttempted += other.spikesAttempted;
		this.spikesMissed += other.spikesMissed;
		this.kills += other.kills;
		this.averageSpikeSpeed = mergeAvg(
			this.averageSpikeSpeed,
			other.averageSpikeSpeed,
			this.spikesAttempted - this.spikesMissed - other.spikesAttempted + other.spikesMissed,
			other.spikesAttempted - other.spikesMissed
		);
	}

	static createPlayerStatId(playerId: string, seasonYear: number | string): string{
		return `${playerId}-${seasonYear}`
	}


	public toJSON(): object {
		// Return a plain object with all the fields
		return {
			playerId: this.playerId,

			servesAttempted: this.servesAttempted,
			servesMissed: this.servesMissed,
			servesMade: this.servesMade,
			servesAced: this.servesAced,
			averageServeSpeed: this.averageServeSpeed,

			passesAttempted: this.passesAttempted,
			passesMissed: this.passesMissed,
			perfectPasses: this.perfectPasses,

			setsAttempted: this.setsAttempted,
			setsMissed: this.setsMissed,
			perfectSets: this.perfectSets,

			spikesAttempted: this.spikesAttempted,
			spikesMissed: this.spikesMissed,
			kills: this.kills,
			averageSpikeSpeed: this.averageSpikeSpeed,
		};
	}
}
