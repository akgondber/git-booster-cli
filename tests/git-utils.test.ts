import {test} from 'uvu';
import * as assert from 'uvu/assert';
import {getGitCommand} from '../source/git-utils.js';

test('returns git commands', () => {
	assert.is(
		getGitCommand(['log', ['--count', 2], '--before', '12.09.2023']),
		'git log --count 2 --before 12.09.2023',
	);
});

test.run();
