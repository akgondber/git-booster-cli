import test from 'ava';
import {getGitCommand} from '../source/git-utils.js';

test('returns git commands', t => {
	t.is(
		getGitCommand(['log', ['--count', 2], '--before', '12.09.2023']),
		'git log --count 2 --before 12.09.2023',
	);
});
