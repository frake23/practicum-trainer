import { ApiError, postLogin, PostLoginRequest } from "../api";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useTokenStore } from "../stores/useTokenStore";
import { Input } from "../components/Controls";
import { Link } from "react-router-dom";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useEffect } from "react";

const schema = yup
	.object({
		username: yup.string().required("Необходимо ввести имя пользователя"),
		password: yup.string().required("Необходимо ввести пароль"),
	})
	.required();

export const LoginPage = () => {
	const {
		register,
		formState: { errors },
		handleSubmit,
		setError,
	} = useForm<PostLoginRequest>({
		mode: "onChange",
		resolver: yupResolver(schema),
	});

	const { setToken } = useTokenStore();

	const { error, mutate } = useMutation(postLogin, {
		onSuccess: (data) => {
			setToken({
				accessToken: data.access_token,
				tokenType: data.token_type,
			});
		},
	});

	useEffect(() => {
		if ((error as ApiError | undefined)?.status === 401) {
			(["username", "password"] as const).forEach((field) => {
				setError(field, {
					message: "Неверное имя пользователя или пароль",
				});
			});
		}
	}, [error]);

	useRequireAuth(false);

	return (
		<div className='flex flex-col flex-1 p-4 justify-center items-center'>
			<form
				className='flex flex-col rounded-xl border border-gray-300 p-4 w-80'
				onSubmit={handleSubmit((data) => mutate(data))}
			>
				<h1 className='text-2xl font-bold mb-2'>Вход</h1>
				<Input
					register={register}
					label='username'
					title='Имя пользователя'
					placeholder='Введите имя пользователя'
					className='mb-6'
					error={errors?.username?.message}
				/>
				<Input
					register={register}
					label='password'
					title='Пароль'
					placeholder='Введите имя пользователя'
					className='mb-6'
					type='password'
					error={errors?.password?.message}
				/>
				<button
					type='submit'
					className='text-white bg-blue-400 hover:bg-blue-500 transition-colors rounded-md p-2 mb-2'
				>
					Войти
				</button>
				<Link
					to='/register'
					className='text-xs text-center text-gray-500'
				>
					Зарегистрироваться
				</Link>
			</form>
		</div>
	);
};
