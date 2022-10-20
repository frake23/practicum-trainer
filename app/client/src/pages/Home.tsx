import { useState } from "react";
import Select from "react-select";
import { Editor } from "../components/Editor";

const options = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'Javascript' },
  ];
  
export const HomePage = () => {
	const [option, setOption] = useState<typeof options[number] | null>(options[0]);

	return (
		<div>
			<div className='container mx-auto py-32 flex flex-col'>
				<div className="flex items-center gap-6 mb-2">
					<span className="">Язык программирования</span>
					<Select
						defaultValue={option}
						onChange={setOption}
						options={options}
					/>
				</div>
				<Editor languageId={option?.value} documentUri={`user/${option?.value}`} />
			</div>
		</div>
	);
};
