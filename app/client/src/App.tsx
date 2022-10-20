import { Header } from "./components/Header";
import { Routes, Route } from "react-router-dom";
import { HomePage } from "./pages/Home";

function App() {
	return (
		<div className='flex flex-col'>
			<Header />
			<HomePage />
		</div>
	);
}

export default App;
