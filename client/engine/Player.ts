import { IncomingBall } from "./IncomingBall";

const MAX_SPEED = 80
export class Player {
	name: string;
	position: string;
	id: number;
  
	jumping: number;
	power: number;
	consistency: number;
	setting: number;
	blocking: number;
	bumping: number;
	passing: number;
	teamId: string | null;
  
	constructor(
	  name: string, position: string, id: number, jumping: number, passing: number,
	  power: number, consistency: number,setting: number, blocking: number, bumping: number, teamId: string | null
	) {
		this.name = name;
		this.id = id;
		this.position = position;
		
		this.jumping = jumping;
		this.power = power;
		this.consistency = consistency;
		this.setting = setting;
		this.blocking = blocking;
		this.bumping = bumping;
		this.passing = passing
		this.teamId = teamId
	}
  
	get overall(): number {
	  return (
		this.jumping +
		this.power +
		this.consistency +
		this.setting +
		this.blocking +
		this.bumping
	  ) / 6;
	}
  
	static fromJSON(data: any): Player {
		return new Player(
		data.name,
		data.position,
		data.id,
		data.jumping,
		data.power,
		data.consistency,
		data.setting,
		data.blocking,
		data.bumping,
		data.passing,
		data.teamId
	  );
	}

	simulateServe(): IncomingBall {
		const faultChance = Math.max(0.1, 1 - (this.consistency / 100)); // more power = riskier
		const rand = Math.random();
		
		
		if (rand < faultChance) {
			return new IncomingBall(0, false,"serve", this.id)
		}
	
		// Serve is successful, calculate speed
		const maxSpeed = MAX_SPEED;
		const speed = Math.round((this.power / 100) * maxSpeed + Math.random() * 5); // small randomness
		let incomingBall = new IncomingBall(speed, true, "serve", this.id)

		incomingBall.updateHistory()
		return incomingBall
	}

	passBall(incomingBall: IncomingBall): void{
		const normalizedSpeed = incomingBall.speed / MAX_SPEED;
		const normalizedPassing = this.passing / 100;
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

	setBall(incomingBall: IncomingBall): void{
		const passQuality = incomingBall.speed // value that should be 1,2,3. 3 is best, 1 is worse
		const setSkill = this.setting
		
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
		const consistency = this.consistency;
		const power = this.power;            
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
	static rehydrate(jsonData: string): Player{
		const playerAttributes = JSON.parse(jsonData)
		return new Player(
			playerAttributes.name, playerAttributes.position, playerAttributes.id, playerAttributes.jumping, playerAttributes.passing,
	  		playerAttributes.power, playerAttributes.consistency, playerAttributes.setting, playerAttributes.blocking, playerAttributes.bumping, 
			playerAttributes.teamId
		)
	}
}