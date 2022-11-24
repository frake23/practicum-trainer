import { AcademicCapIcon, UserIcon } from "@heroicons/react/24/solid";
import { NavLink, Link } from "react-router-dom";
import { useMe } from "../hooks/useMe";
import { useTokenStore } from "../stores/useTokenStore";
import { LoadingSpinner } from "./LoadingSpinner";

export const Header = () => {
	const { isFetching, data } = useMe();

	const { clearToken } = useTokenStore();

	return (
		<div className='bg-blue-100 shadow-md'>
			<div className='container mx-auto px-4 py-2 flex items-center gap-8 w-full justify-between'>
				<div className='flex gap-8 items-center'>
					<Link to='/'>
						<div className='flex gap-2'>
							<AcademicCapIcon className='h-8' />
							<h1 className='font-mono text-2xl font-bold'>
								Code Trainer
							</h1>
						</div>
					</Link>
					<NavLink
						to='problems'
						className={({ isActive }) => {
							return isActive
								? "text-sm text-blue-500 p-1"
								: "text-sm text-gray-700 p-1";
						}}
					>
						Задачи
					</NavLink>
				</div>

				{isFetching ? (
					<LoadingSpinner />
				) : data?.username ? (
					<div className='flex gap-6'>
						<div className='font-mono text-xs font-semibold flex items-center text-blue-600 gap-1'>
							<UserIcon className='w-4' />
							{data.username}
						</div>
						<button
							onClick={clearToken}
							className='text-xs py-2 px-3 bg-red-600 hover:bg-red-700 transition-colors text-white rounded-md'
						>
							Выйти
						</button>
					</div>
				) : (
					<NavLink
						to='/login'
						className='text-xs py-2 px-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded-md'
					>
						Войти
					</NavLink>
				)}
			</div>
		</div>
	);
};
