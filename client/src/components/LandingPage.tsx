import React, { useState } from 'react';
import '../styling/LandingPage.css'; // Import the CSS file for styles
import { generateLeague } from "../../engine/DataGenerator"
import { Team } from "../../engine/Team"
import { useAppData } from '../AppDataContext';

import { saveGame } from "@engine/DataManager"

const LandingPage = () => {
	const [teamName, setTeamName] = useState<string>('');

	const appData = useAppData()
	const handleSubmit = () => {
		if (teamName) {

			const { setSeasons, setLeague, setPlayers, setTeams } = appData
			const {seasons, league, players, teams} = generateLeague(teamName)

			saveGame({league, setLeague, teams, setTeams, players, setPlayers, seasons, setSeasons})
            console.log(seasons, league, players, teams)
		}
	};

	return (
		<div className="container">
			<div className="landing-box">
				<h1 className="pixelated">Welcome to the Volleyball Simulator!</h1>
				<p className="pixelated">Please enter your team name to start:</p>
				<input
					type="text"
					value={teamName}
					onChange={(e) => setTeamName(e.target.value)}
					placeholder="Team Name"
					className="pixelated"
				/>
				<button onClick={handleSubmit} className="pixelated">
			  	Submit
				</button>
			</div>
		</div>
	);
};

export default LandingPage;
