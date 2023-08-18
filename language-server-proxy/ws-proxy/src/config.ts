import 'dotenv/config';

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            LANGUAGE: string | undefined;
            PROC_COMMAND: string | undefined;
            LANGUAGE_CLIENTS_NUMBER: string | undefined;
        }
    }
}

interface GetConfigVariableParams<T> {
    value: any;
    cast?: (value: any) => T;
    defaultValue?: T;
}

const createConfigVariable = <T = string>(params: GetConfigVariableParams<T>) => {
    const { value, cast = () => value, defaultValue } = params;

    if (value === undefined && defaultValue === undefined) {
        throw Error(`Env variable or default value is not provided`);
    }

    return (value === undefined ? defaultValue : cast(value)) as T;
};

const LANGUAGE = createConfigVariable({ value: process.env.LANGUAGE });
const PROC_COMMAND = createConfigVariable({ value: process.env.PROC_COMMAND });
const LANGUAGE_CLIENTS_NUMBER = createConfigVariable({
    value: process.env.LANGUAGE_CLIENTS_NUMBER,
    cast: Number,
    defaultValue: 5,
});

export const Config = Object.freeze({
    LANGUAGE,
    PROC_COMMAND,
    LANGUAGE_CLIENTS_NUMBER,
});
