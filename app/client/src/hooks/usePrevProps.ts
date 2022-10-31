import { useEffect, useRef } from "react";

type PropsRef<T> = {
	curr: T;
	prev: T | null;
};

export const usePrevProp = <T = any>(prop: T): T | null => {
	const ref = useRef(prop);

	useEffect(() => {
		ref.current = prop;
	}, [prop]);

	return ref.current;
};
