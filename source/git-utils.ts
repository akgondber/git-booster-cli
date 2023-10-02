import {execa, type Options} from 'execa';
import * as R from 'ramda';
import {type CommandResult} from './types.js';

const getGitCommand = (args: any): string => {
	return R.flatten(['git', args]).join(' ');
};

const safeExecuteCommand = async (
	commandString: string,
	args: string[],
	options?: Options,
): Promise<CommandResult> => {
	const command = getGitCommand(args);
	try {
		const {stdout} = await execa(commandString, args, options);
		return {
			command,
			message: stdout,
			status: 'success',
		};
	} catch (error: any) {
		return {
			command,
			message: error.message!, // eslint-disable-line @typescript-eslint/no-unsafe-assignment
			status: 'error',
		};
	}
};

const runGitCommand = async (
	args: string[],
	options?: Options,
): Promise<CommandResult> => {
	const result = await safeExecuteCommand('git', args, options);
	return result;
};

export {getGitCommand, runGitCommand};
