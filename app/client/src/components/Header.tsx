import { AcademicCapIcon } from "@heroicons/react/24/solid";
import { NavLink, Link } from "react-router-dom";

export const Header = () => {
	return (
		<div className='bg-blue-100 shadow-md'>
			<div className='container mx-auto py-2 flex items-center gap-8'>
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
		</div>
	);
};
