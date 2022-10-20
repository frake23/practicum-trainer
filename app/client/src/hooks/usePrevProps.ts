import { useEffect, useRef } from "react";

type PropsRef<T> = {
	curr: T;
	prev: T | null;
};

export const usePrevProp = <T = any>(prop: T): T | null => {
	const props = useRef<PropsRef<T>>({ curr: prop, prev: null });

	useEffect(() => {
		console.log({prop, props: props.current})
		props.current.prev = props.current.curr;
		props.current.curr = prop;
	}, [prop]);

	return props.current.prev;
};


 