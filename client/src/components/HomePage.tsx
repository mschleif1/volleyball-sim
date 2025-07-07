import React from 'react';
import { useAppData } from '../AppDataContext';
import PixelTable from './PixelTable';
import '../styling/HomePage.css';
import GamePanel  from "./GamePanel"
import LineupPage from "./LineupPage"
import { GameStats } from '@engine/GameStats';
const HomePage = () => {
	const appData = useAppData();

	if (!appData || !appData.league) {
		return <div className="pixelated full-page">Loading...</div>;
	}

	const { league, seasons, teams, players, gameStats } = appData;
	
	
	const currentSeason = Object.values(seasons).at(-1);
	const userTeam = Object.values(teams).find(t => t.userTeam);
	const currentWeek = currentSeason!.currentWeek
	
	if (!currentSeason){
		return <h1> No season </h1>
	}
	function playGame(){
		currentSeason!.simWeek(appData)
	}

	function renderCurrentMatchup(){
		if (!userTeam || !currentSeason){ return }

		const currentMatchup = currentSeason.schedule[currentWeek].find((matchup)=> matchup[0] == userTeam.id || matchup[1] == userTeam.id)

		const homeTeam = teams[currentMatchup![0]]
		const awayTeam = teams[currentMatchup![1]]

		return (
			<> 
				Next Matchup: {homeTeam.name} (home) vs. {awayTeam.name} (away)
			</>
		)
	}

	function renderPlayGamePanel(){
		return (
			<section>
				{<GamePanel/>}
			</section>
		)
	}



	const teamPlayers = userTeam
		? userTeam.playerIds.map(id => players[id])
		: [];

	const columns = ['Name', 'Position','Power', 'Consistency', 'Set', 'Pass', 'Block', "Jumping", "Stamina", "Energy"];
	const data = (teamPlayers as any[]).map(p => [
		p.name,
		p.position.toString(),
		p.power.toString(),
		p.consistency.toString(),
		p.setting.toString(),
		p.passing.toString(),
		p.blocking.toString(),
		p.jumping.toString(),
		p.stamina.toString(),
		Math.round(p.currentEnergy).toString()
	]);



	return (
		<div className="full-page pixelated">
			<header className="page-header">
				<h1>🏐 Volleyball Sim</h1>
			</header>

            <section className='team-section'> 
                <h2> {userTeam && userTeam.name} {userTeam && GameStats.getRecord(userTeam.id, gameStats)}</h2>
            </section>
            
			{renderPlayGamePanel()}

			<section className="players-section">
				<h2>Roster</h2>
				{teamPlayers.length > 0 ? (
					<PixelTable columns={columns} data={data} />
				) : (
					<p>No players found for your team.</p>
				)}
			</section>
			<section className="players-section">
				<h2>Select Lineup</h2>
				<LineupPage/>
			</section>
		</div>
	);
};

export default HomePage;
