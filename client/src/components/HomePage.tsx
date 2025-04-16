import React from 'react';
import { useAppData } from '../AppDataContext';
import PixelTable from './PixelTable';
import '../styling/HomePage.css';

const HomePage = () => {
	const appData = useAppData();

	if (!appData) {
		return <div className="pixelated full-page">Loading...</div>;
	}

	const { league, seasons, teams, players } = appData;
	const currentSeason = seasons[seasons.length - 1];
	const userTeam = teams.find(t => t.userTeam);
	const teamPlayers = userTeam
		? userTeam.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean)
		: [];

	const columns = ['Name', 'Position', 'Power', 'Speed', 'Stamina'];
	const data = (teamPlayers as any[]).map(p => [
		p.name,
		p.position?.toString() ?? '',
		p.power?.toString() ?? '',
		p.speed?.toString() ?? '',
		p.stamina?.toString() ?? '',
	]);

	return (
		<div className="full-page pixelated">
			<header className="page-header">
				<h1>🏐 Volleyball Sim</h1>
			</header>

            <section className='team-section'> 
                <h2> {userTeam && userTeam.name}</h2>
            </section>
            
			<section className="summary">
				<p><b>Season:</b> {currentSeason?.year ?? 'Unknown'}</p>
				<p><b>Next Matchup:</b> TBD vs. TBD</p>
			</section>

			<section className="players-section">
				<h2>Your Players</h2>
				{teamPlayers.length > 0 ? (
					<PixelTable columns={columns} data={data} />
				) : (
					<p>No players found for your team.</p>
				)}
			</section>
		</div>
	);
};

export default HomePage;
