import { IncomingBall } from "./IncomingBall";

const MAX_SPEED = 80
const MIDDLE = "middle"
const HITTER = "hitter"
const SETTER = "setter"
const LIBERO = "libero"

export class Player {
	name: string;
	position: string;
	id: string;
  
	jumping: number;
	power: number;
	consistency: number;
	setting: number;
	blocking: number;
	passing: number;
	stamina: number;
	currentEnergy: number;
	teamId: string | null;
  
	constructor(
		name: string, position: string, id: string, jumping: number, passing: number,
		power: number, consistency: number, setting: number, blocking: number, stamina: number, 
		currentEnergy: number | null, teamId: string | null
	) {
		this.name = name;
		this.id = id;
		this.position = position;
		
		this.jumping = jumping;
		this.power = power;
		this.consistency = consistency;
		this.setting = setting;
		this.blocking = blocking;
		this.passing = passing
		this.stamina = stamina
		this.teamId = teamId
		
		if (!currentEnergy){
			this.currentEnergy = 100
		} else {
			this.currentEnergy = currentEnergy
		}
	}
  
	get overall(): number {
	  return (
		this.jumping +
		this.power +
		this.consistency +
		this.setting +
		this.blocking +
		this.stamina
	  ) / 6;
	}

	// At 100 energy, player plays at full strength.
	// At 0 energy, ratings are reduced by 20%.
	getEnergyMultiplier(): number {
		const fatiguePenalty = 0.2; // 20% drop at 0 energy
		const multiplier = 1 - ((1 - this.currentEnergy / 100) * fatiguePenalty);
		return this.round2(multiplier);
	}

	// Returns energy-scaled value of a numeric stat
	getEffective(attr: keyof Player): number {
		const raw = this[attr];
		if (typeof raw === "number") {
			return this.round2(raw * this.getEnergyMultiplier());
		}
		return 0;
	}

	simulateServe(): IncomingBall {
		const consistency = this.getEffective("consistency");
		const power = this.getEffective("power");

		const faultChance = Math.max(0.1, 1 - (consistency / 100)); // more power = riskier
		const rand = Math.random();
		
		if (rand < faultChance) {
			return new IncomingBall(0, false, "serve", this.id)
		}
	
		// Serve is successful, calculate speed
		const speed = Math.round((power / 100) * MAX_SPEED + Math.random() * 5); // small randomness
		let incomingBall = new IncomingBall(speed, true, "serve", this.id)

		incomingBall.updateHistory()
		return incomingBall
	}

	passBall(incomingBall: IncomingBall): void {
		const normalizedSpeed = incomingBall.speed / MAX_SPEED;
		const normalizedPassing = this.getEffective("passing") / 100;
		
		// Base pass quality is affected by how well passing handles the speed
		const effectiveness = normalizedPassing - normalizedSpeed;
		
		// Add a little randomness
		const randomFactor = (Math.random() - 0.5) * 0.4; // between -0.2 and +0.2
		const score = effectiveness + randomFactor;

		// Convert score into pass quality
		if (score < -0.2) {
			incomingBall.speed = 0
			incomingBall.inPlay = false
		} else if (score < 0.1) {
			incomingBall.speed = 1
		} else if (score < 0.3){
			incomingBall.speed = 2
		} else {
			incomingBall.speed = 3
		}
		incomingBall.type = "pass"
		incomingBall.playerId = this.id
		incomingBall.updateHistory()
	}

	setBall(incomingBall: IncomingBall): void {
		const passQuality = incomingBall.speed // value that should be 1,2,3. 3 is best, 1 is worse
		const setSkill = this.getEffective("setting")
		
		// Determine a base multiplier for how much skill can compensate for bad passes
		const passMultiplier = {
			1: 0.5,
			2: 0.75,
			3: 1
		}[passQuality] ?? 0.5;

		// Calculate raw set quality using pass quality and setting skill
		const randomNum = Math.floor(Math.random() * 31) - 15;
		
		let rawScore = passMultiplier * setSkill;
		rawScore += randomNum

		// Normalize to 0-3 range
		let setQuality = Math.floor((rawScore / 100) * 4); // Gives 0 to 3

		// Clamp to range just in case
		setQuality = Math.max(0, Math.min(3, setQuality));
		incomingBall.speed = setQuality // this speed variable should be set to 0,1,2 or 3. 3 is the perfect set, and 0 is the worst.
		incomingBall.type = 'set'
		if (setQuality == 0){
			incomingBall.inPlay = false 
		}
		incomingBall.playerId = this.id
		incomingBall.updateHistory()
	}

	spikeBall(incomingBall: IncomingBall): void {
		const consistency = this.getEffective("consistency");
		const power = this.getEffective("power");            
		incomingBall.type = "spike"
		
		if (incomingBall.speed === 1) {
			// 20% chance to miss completely
			if (Math.random() < 0.2) {
				incomingBall.inPlay = false;
				incomingBall.type = "freeball";
				return;
			}

			// Otherwise send it back as a free ball
			incomingBall.speed = 10;
			incomingBall.type = "freeball";
			return;
		}

		// Determine set quality modifier: better sets reduce miss chance
		const setQualityModifier = {
			3: 1.0,  // no penalty
			2: 1.2   // 20% more likely to miss on a slightly worse set
		}[incomingBall.speed] ?? 1.5; // fallback in case of unexpected value

		// Combine consistency and set quality to get miss chance
		const missChance = (1 - (consistency / 100)) * setQualityModifier;

		if (Math.random() < missChance) {
			incomingBall.inPlay = false;
			incomingBall.type = "spike";
			return;
		}

		// Base spike speed
		let baseSpeed = (power / 100) * MAX_SPEED;

		// Add some randomness
		baseSpeed += Math.random() * 5;

		// Slight penalty if set was only a 2
		if (incomingBall.speed === 2) {
			baseSpeed *= 0.9; // 10% reduction for imperfect set
		}

		incomingBall.speed = Math.round(baseSpeed);
		incomingBall.type = "spike";
		incomingBall.playerId = this.id
		incomingBall.updateHistory()
	}

	round2(value: number): number {
		return Math.round(value * 100) / 100;
	}

	// called after a point is played
	fatigue(): void {
		const stamina = this.stamina;
		
		// Fatigue rate scales inversely with stamina
		// 0.4 fatigue per point at 0 stamina (fast drain)
		// 0.16 fatigue per point at 100 stamina (slow drain)
		const baseFatigueRate = 0.7;      // worst-case per point
		const minFatigueRate = 0.3;       // best-case per point
	
		// Linear interpolation between base and min based on stamina
		const fatiguePerPoint = baseFatigueRate - ((baseFatigueRate - minFatigueRate) * (stamina / 100));
		const roundedFatigue = this.round2(fatiguePerPoint);
	
		this.currentEnergy = Math.max(0, this.round2(this.currentEnergy - roundedFatigue));
	}
	 
	rest(): void {
		const staminaFactor = this.stamina / 100;

		// Smaller recovery range: 4 to 15 energy
		const minRecovery = 1;
		const maxRecovery = 7;

		const recovery = minRecovery + (maxRecovery - minRecovery) * staminaFactor;
		const roundedRecovery = this.round2(recovery);

		this.currentEnergy = Math.min(100, this.round2(this.currentEnergy + roundedRecovery));
	}

	restWeek(): void {
		const staminaFactor = this.stamina / 100;

		// Larger recovery range: 10 to 20 energy
		const minRecovery = 10;
		const maxRecovery = 20;

		const recovery = minRecovery + (maxRecovery - minRecovery) * staminaFactor;
		const roundedRecovery = this.round2(recovery);

		this.currentEnergy = Math.min(100, this.round2(this.currentEnergy + roundedRecovery));
	}

	static rehydrate(jsonData: string): Player {
		const playerAttributes = JSON.parse(jsonData)
		return new Player(
			playerAttributes.name, playerAttributes.position, playerAttributes.id, playerAttributes.jumping, playerAttributes.passing,
	  		playerAttributes.power, playerAttributes.consistency, playerAttributes.setting, playerAttributes.blocking, playerAttributes.stamina, 
			playerAttributes.currentEnergy, playerAttributes.teamId
		)
	}
}
