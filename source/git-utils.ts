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

class CommandError extends Error {
	commandResult: CommandResult;

	constructor(message: string, commandResult: CommandResult) {
		super(message);
		this.commandResult = commandResult;
	}
}

const ensureSuccess = (commandResult: CommandResult) => {
	if (isNotSuccess(commandResult)) {
		throw new CommandError(
			commandResult.message,
			R.set(
				R.lensProp('message'),
				buildErrorMessage(commandResult),
				commandResult,
			),
		);
	}
};

const getErrorMessage = (error: unknown) => {
	if (error instanceof Error) return error.message;
	return String(error);
};

const isNotSuccess = R.complement(R.propEq('success', 'status'));
const messageProp = R.lensProp<CommandResult>('message');
const buildErrorMessage = (commandResult: CommandResult) =>
	`There is some error occured while retrieving data:\n${commandResult.message}`;
const transformErrorResult = (commandResult: CommandResult) =>
	R.set(messageProp, buildErrorMessage(commandResult), commandResult);
const buildInfo = (header: string, commandResult: CommandResult) => `
## ${header}:

${commandResult.message}`;

const getInfo = async () => {
	const result = [];
	let infoResult = await runGitCommand(['remote', '-v']);

	try {
		ensureSuccess(infoResult);
		result.push(buildInfo('Remote URLs', infoResult));
		infoResult = await runGitCommand(['branch', '-r']);
		ensureSuccess(infoResult);
		result.push(buildInfo('Remote branches', infoResult));
		infoResult = await runGitCommand(['branch']);
		ensureSuccess(infoResult);
		result.push(buildInfo('Local branches', infoResult));
		infoResult = await runGitCommand(['log', '--max-count', '1']);
		ensureSuccess(infoResult);
		result.push(buildInfo('Most recent commit', infoResult));
	} catch (error: any) {
		if (error instanceof CommandError) {
			return error.commandResult;
		}

		throw new Error(getErrorMessage(error));
	}

	if (isNotSuccess(infoResult)) return transformErrorResult(infoResult);

	return R.set(messageProp, R.join('\n\n', result), infoResult);
};

const getConflictedFiles = async () => {
	const result = await runGitCommand(['ls-files', '-u']);
	if (result.status === 'success') {
		const files = R.uniq(
			R.map(
				R.compose(R.last, R.split('\t')),
				result.message.trim().split('\n'),
			),
		);
		return R.set(
			R.lensProp('message'),
			R.ifElse(
				R.isEmpty,
				R.always('There is no conflicted files'),
				R.join('\n'),
			)(files),
			result,
		);
	}

	return R.set(R.lensProp('message'), 'Unable to get conflicted files', result);
};

export {getGitCommand, runGitCommand, getInfo, getConflictedFiles};
