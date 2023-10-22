import * as R from 'ramda';
import figures from 'figures';
import {v4 as uuidv4} from 'uuid';
import type {CommandResult, CommandState} from './types.js';

const getStatusBgColor = (commandResult: CommandResult): string => {
	const mapping = {
		success: 'green',
		waiting: 'yellow',
		warning: 'yellow',
		error: 'red',
	};
	return R.defaultTo('', mapping[commandResult.status]);
};

const getFigure = (commandResult: CommandResult): string => {
	const mapping = {
		success: figures.tick,
		waiting: figures.warning,
		error: figures.cross,
	};
	return R.propOr('', commandResult.status, mapping);
};

const getFigureForBlock = (commandState: CommandState): string => {
	const mapping = {
		success: figures.tick,
		error: figures.cross,
	};
	return R.propOr('', commandState, mapping);
};

const getId = (): string => {
	return uuidv4();
};

const toBoolean = (value: string): boolean => {
	return R.startsWith('t', value);
};

const notEmpty = (value: any) => !R.isEmpty(value);
const isFalsey = (value: string): boolean =>
	R.converge(R.or, [R.equals('false'), R.equals('no')])(value);
const isNotFalsey = R.complement(isFalsey);
const quotify = (value: string) => `"${value}"`;

const isEven = (value: number) => value % 2 === 0;

export {
	getStatusBgColor,
	getFigure,
	getFigureForBlock,
	getId,
	toBoolean,
	notEmpty,
	isFalsey,
	isNotFalsey,
	isEven,
	quotify,
};
