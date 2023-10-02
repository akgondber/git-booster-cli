import test from 'ava';
import {havingKey} from '../source/ramda-utils.js';

test('havingKey() returns true when key is present', t => {
	const withBarKey = {
		id: 1,
		foo: '#1 foo',
		bar: '#1 bar',
	};

	t.true(havingKey('bar', withBarKey));
});

test('havingKey() returns false when key is not present', t => {
	const withoutBarKey = {
		id: 2,
		foo: '#2 foo',
	};

	t.false(havingKey('bar', withoutBarKey));
});
