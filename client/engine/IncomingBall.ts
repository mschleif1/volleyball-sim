import { Team } from './Team';


export class IncomingBall {
	speed: number;
	inPlay: boolean;
    type: string;
    history: object[];
    playerId: number;


	constructor(speed: number, inPlay: boolean, type: string, playerId: number) {
		this.speed = speed
        this.inPlay = true
        this.type = "serve"
        this.history = []
        this.playerId = playerId
	}

    updateHistory(): void{
        this.history.push({
            "speed": this.speed,
            "inPlay": this.inPlay,
            "type": this.type,
            "playerId": this.playerId
        })
    }
    
}
