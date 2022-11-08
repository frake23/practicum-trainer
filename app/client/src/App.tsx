import { Header } from "./components/Header";
import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/Home";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.min.css";

const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<div className='flex flex-col'>
				<Header />
				<Routes>
					<Route path='/' element={<Navigate to='/python' />} />
					<Route path='/problems' element={<div />} />
					<Route path='/:entity/*' element={<HomePage />} />
				</Routes>
			</div>
			<ToastContainer
				position='bottom-right'
				autoClose={3000}
				hideProgressBar
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme='light'
			/>
		</QueryClientProvider>
	);
}

export default App;
