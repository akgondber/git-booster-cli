import * as R from 'ramda';
import figures from 'figures';
import {nanoid} from 'nanoid';
import type {CommandResult} from './types.js';

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

const getId = (): string => {
	return nanoid(10);
};

const toBoolean = (value: string): boolean => {
	return R.startsWith('t', value);
};

const notEmpty = (value: any) => !R.isEmpty(value);

const isEven = (value: number) => value % 2 === 0;

export {getStatusBgColor, getFigure, getId, toBoolean, notEmpty, isEven};
