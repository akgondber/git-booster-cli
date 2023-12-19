import * as R from 'ramda';
import {mainCommandNames} from './constants.js';
import type {
	AppState,
	BlockItem,
	BlockItemCard,
	CommandResult,
	CommandState,
	RequestedArgItem,
} from './types.js';
import {quotify, toBoolean} from './helpers.js';
import {notNilOrFalse} from './ramda-utils.js';

type FilterOptions = {
	isOnlyMain: boolean;
	isOnlyBlock?: string;
	isOnlyCompound?: boolean;
	tags?: string;
};

type ParameterizeOptions = {
	states: any;
	currentCommand: BlockItemCard;
};

const applyFilters = (
	commands: BlockItem[],
	{isOnlyCompound, isOnlyBlock, isOnlyMain, tags}: FilterOptions,
) => {
	let result = commands;

	if (!R.isNil(isOnlyBlock)) {
		result = R.filter(
			(value: BlockItem) =>
				R.propEq(isOnlyBlock, 'displayName', value) ||
				R.propEq(isOnlyBlock, 'name', value),
			result,
		);
	} else if (notNilOrFalse(isOnlyCompound)) {
		result = R.filter(
			(command: BlockItem) => R.propEq(true, 'namespaced', command),
			commands,
		);
	} else if (!R.isNil(tags)) {
		result = R.filter(
			a =>
				R.isNotNil(a.tags) &&
				R.intersection(R.split(',', tags), a.tags).length > 0,
			result,
		);
	} else if (isOnlyMain) {
		result = R.filter(
			R.propSatisfies(R.flip(R.includes)(mainCommandNames), 'name'),
			result,
		);
	}

	return result;
};

const collectParameterizedItems = (
	requestedArgs: RequestedArgItem[],
	{states, currentCommand}: ParameterizeOptions,
) =>
	R.map(
		(argItem: RequestedArgItem) => `--${argItem.name}`,
		R.filter(argItem => {
			return (
				R.has('mapToParam', argItem) &&
				R.pathSatisfies(
					toBoolean,
					R.has('namespaced', currentCommand)
						? [
								R.prop('name', currentCommand),
								0,
								R.prop('name', currentCommand),
								...argItem.path!,
						  ]
						: [R.propOr('', 'name', currentCommand), 0, argItem.name],
					states,
				)
			);
		}, requestedArgs),
	);

const argToPath = (arg: RequestedArgItem): string[] => {
	return R.isNil(arg.path) ? [arg.name] : arg.path;
};

const getStateValueByKey = (
	key: string,
	currentCommand: BlockItemCard,
	states: Record<string, any>,
): string => {
	return R.pathOr(
		'',
		[String(R.propOr('', 'name', currentCommand)), 0, key],
		states,
	)!;
};

const getSubState = (
	command: BlockItemCard,
	states: Record<string, any>,
	target: string,
) => {
	let result: Record<string, any> = {};
	const namespace = R.prop('name', command);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const item = R.path([namespace, '0'], states);
	const filtered = R.pick([namespace], item);

	R.forEach((state: any) => {
		result = R.set(
			R.lensProp(target),
			R.path([state, target], filtered),
			result,
		);
	}, R.keys(filtered));
	return result;
};

const getStateValueByKeyNamespaced = (
	command: BlockItemCard,
	states: Record<string, any>,
	path: string[],
) => {
	const subState = getSubState(command, states, R.head(path)!);
	return R.pathOr('', path, subState);
};

const prependNameValueIfNamespaced = R.curry(
	(checkable: Record<string, any>, applyTo: string[]): string[] => {
		if (R.both(R.has('namespaced'), R.propEq(true, 'namespaced'))(checkable)) {
			return R.prepend(R.prop('name', checkable) as string, applyTo);
		}

		return applyTo;
	},
);

const getCurrentParameters = (
	blockItem: BlockItemCard,
	states: Record<string, any>,
) => {
	const mapping = R.mapObjIndexed(
		(statePair: any[], _key, _object): unknown => R.head(statePair),
		R.has('namespaced', blockItem) ? R.identity(states) : R.identity(states),
	);
	return R.propOr('', R.prop('name', blockItem), mapping);
};

const quotifyIfNeeded = R.ifElse(
	R.both(R.complement(R.isEmpty), R.includes(' ')),
	quotify,
	R.identity,
);

const getParameterValue = (
	blockItem: BlockItemCard,
	arg: RequestedArgItem,
	states: Record<string, any>,
): string => {
	const result: string = R.view(
		R.lensPath(prependNameValueIfNamespaced(blockItem, argToPath(arg))),
		getCurrentParameters(blockItem, states),
	);
	return quotifyIfNeeded(result);
};

const collectParametersValuesPipe = (
	blockItem: BlockItemCard,
	states: Record<string, any>,
) =>
	R.pipe(
		R.reject(
			(argItem: RequestedArgItem) =>
				R.propOr(false, 'mapToSelf', argItem) ||
				R.propOr(false, 'excludeFromCommand', argItem),
		),

		R.map((value: RequestedArgItem) => [
			value.paramName,
			getParameterValue(blockItem, value, states),
		]),
	);

const getRepoName = R.compose(R.replace('.git', ''), R.last, R.split('/'));

const getBlockStatus = (
	isActiveBlock: boolean,
	appStatus: AppState,
	commandResults: CommandResult[],
): CommandState => {
	if (
		!isActiveBlock ||
		appStatus !== 'PERFORMED' ||
		R.isEmpty(commandResults)
	) {
		return 'unknown';
	}

	return R.all(R.propEq('success', 'status'), commandResults)
		? 'success'
		: 'error';
};

export {
	applyFilters,
	collectParameterizedItems,
	argToPath,
	prependNameValueIfNamespaced,
	getCurrentParameters,
	getParameterValue,
	collectParametersValuesPipe,
	getSubState,
	getStateValueByKey,
	getStateValueByKeyNamespaced,
	quotifyIfNeeded,
	getRepoName,
	getBlockStatus,
};
