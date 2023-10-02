import * as R from 'ramda';

const havingKey = R.curry((key: string, source: any): boolean =>
	R.has(key, source),
);

export {havingKey};
