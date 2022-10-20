import { AcademicCapIcon } from "@heroicons/react/24/solid";

export const Header = () => {
	return (
		<div className='bg-gray-300 shadow-sm'>
			<div className='container mx-auto py-2 flex items-center gap-8'>
				<div className='flex gap-2'>
					<AcademicCapIcon className='h-8' />
					<h1 className='font-mono text-2xl font-bold'>
						Code Trainer
					</h1>
				</div>
				<div className='text-sm text-gray-700'>Задачи</div>
			</div>
		</div>
	);
};
