import {test} from 'uvu';
import * as assert from 'uvu/assert';
import {havingKey} from '../source/ramda-utils.js';

test('havingKey() returns true when key is present', () => {
	const withBarKey = {
		id: 1,
		foo: '#1 foo',
		bar: '#1 bar',
	};

	assert.ok(havingKey('bar', withBarKey));
});

test('havingKey() returns false when key is not present', () => {
	const withoutBarKey = {
		id: 2,
		foo: '#2 foo',
	};

	assert.not.ok(havingKey('bar', withoutBarKey));
});

test.run();
