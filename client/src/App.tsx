import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';

import { Team } from "@engine/Team";
import HomePage from "./components/HomePage";
import LandingPage from "./components/LandingPage";

import { AppDataProvider } from "./AppDataContext";

import './App.css';

function App() {
	function hasData() {
		return localStorage && localStorage.getItem("league");
	}

	const content = hasData() ? <HomePage /> : <LandingPage />;

	return (
		<AppDataProvider>
			<div>
				{content}
			</div>
		</AppDataProvider>
	);
}

export default App;
