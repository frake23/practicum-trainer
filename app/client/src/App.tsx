import { Header } from "./components/Header";
import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/Home";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";

import "react-toastify/dist/ReactToastify.min.css";
import { ProblemsPage } from "./pages/Problems";
import { ProblemPage } from "./pages/Problem";

const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<div className='flex flex-col h-screen'>
				<Header />
				<Routes>
					<Route path='/' element={<Navigate to='/python' />} />
					<Route path='/login' element={<LoginPage />} />
					<Route path='/register' element={<RegisterPage />} />
					<Route path='/problems' element={<ProblemsPage />} />
					<Route
						path='/problems/:problemId'
						element={<ProblemPage />}
					/>
					<Route path='/:entity' element={<HomePage />} />
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
