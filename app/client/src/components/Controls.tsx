import React from "react";
import { UseFormRegister } from "react-hook-form";

export interface ControlWrapperProps {
	title?: string;
	className?: string;
	error?: string;
}

export const ControlWrapper: React.FC<
	React.PropsWithChildren<ControlWrapperProps>
> = ({ title, className = "", error, children }) => {
	return (
		<div className={`relative flex flex-col ${className}`}>
			<label className='flex flex-col'>
				{title && <span className='mb-1 text-base'>{title}</span>}
				{children}
			</label>
			{error && (
				<div className='absolute -bottom-5 mt-2 text-xs text-red-500 text-italic'>
					{error}
				</div>
			)}
		</div>
	);
};

const controlClassName = (error?: string, disabled?: boolean) => `
    px-3 py-2
    appearance-none border rounded
    ${error ? "border-red-500" : "border-gray-300"}
    ${disabled ? "bg-gray-200" : "bg-white"}
    text-sm leading-tight
    focus:outline-none focus:ring
`;

interface ControllerProps {
	label: string;
	register: UseFormRegister<any>;
	disabled?: boolean;
}

type BaseControllerProps = ControlWrapperProps & ControllerProps;

type InputProps = BaseControllerProps & {
	placeholder?: string;
	type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
};

export function Input({
	placeholder,
	label,
	register,
	disabled,
	type,
	...props
}: InputProps) {
	return (
		<ControlWrapper {...props}>
			<input
				type={type ?? "text"}
				className={controlClassName(props.error, disabled)}
				{...register(label)}
				placeholder={placeholder || props.title}
				disabled={!!disabled}
			/>
		</ControlWrapper>
	);
}
