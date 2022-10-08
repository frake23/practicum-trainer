import * as fs from 'fs';
import { CreateProcessArgs, LanguageServerConfig } from './types.js';
import * as path from 'path';


class ParseConfigError extends Error {
    message: string = 'Cannot parse the config file';
}

class OpenConfigError extends Error {
    message: string = 'Cannot find or open the config file';
}

export const getLanguageServers = (
    defaultPath: string,
): CreateProcessArgs[] => {
    const configPath = getConfigPathFromArgs() ?? defaultPath;

    let obj;
    try {
        obj = JSON.parse(fs.readFileSync(path.resolve(configPath), 'utf8'));
    } catch (error) {
        throw new OpenConfigError();
    }

    const config = validateConfig(obj);

    return Object.keys(config).map((key) => [
        key,
        config[key].command,
        config[key].args,
    ]);
};

const getConfigPathFromArgs = () => {
    const args = process.argv.slice(2);
    const optionIndex = args.findIndex((value) => value === '-cf');

    if (optionIndex === -1 || args.length === optionIndex + 1) return undefined;

    return args[optionIndex + 1];
};

const validateConfig = (obj: any): LanguageServerConfig => {
    if (Array.isArray(obj)) {
        throw new ParseConfigError();
    }

    for (const key of Object.keys(obj)) {
        if (typeof obj[key] !== 'object' || Array.isArray(obj[key])) {
            throw new ParseConfigError();
        }

        if (!obj[key].command) {
            throw new ParseConfigError();
        }
    }

    return obj as LanguageServerConfig;
};
