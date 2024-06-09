import * as R from 'ramda';

const havingKey = R.curry((key: string, source: any): boolean =>
	R.has(key, source),
);
const havingTrueKey = R.curry(
	(key: string, source: any): boolean =>
		R.has(key, source) && R.propEq(true, key, source),
);

type CondPred<T> = (x: T) => boolean;

const prependIf = R.curry(
	(value: string, cond: CondPred<string[]>, source: string[]): string[] => {
		if (cond(source)) {
			return R.prepend(value, source);
		}

		return source;
	},
);

type Func<T> = (x: T) => any;

const applyToSourceIf = R.curry(
	(
		func: Func<string[]>,
		condition: CondPred<any>,
		applyTo: string[],
		checkable: any,
	) => {
		if (condition(checkable)) {
			return R.applyTo(applyTo)(func) as string[];
		}

		return applyTo;
	},
);

const prependNameValueIf = R.curry(
	(
		condition: CondPred<any>,
		applyTo: string[],
		checkable: Record<string, any>,
	) => {
		if (condition(checkable)) {
			return R.prepend(R.prop('name', checkable), applyTo) as string[];
		}

		return checkable;
	},
);

const rejectLastEmpty = R.compose(R.isEmpty, R.last);

const isBool = (value: boolean | undefined) => {
	return value !== undefined;
};

const isFalse = (value: boolean | undefined) => {
	return R.equals(false, isBool(value));
};

const notNilOrFalse = R.both(R.isNil, isFalse);
const notIncludes = R.complement(R.includes);
const notEquals = R.complement(R.equals);

export {
	havingKey,
	havingTrueKey,
	prependIf,
	applyToSourceIf,
	prependNameValueIf,
	rejectLastEmpty,
	isFalse,
	notNilOrFalse,
	notIncludes,
	notEquals,
};
