import React from 'react';
import chalk from 'chalk';
import test from 'ava';
import {render} from 'ink-testing-library';
import App from './source/app.js';

test(`displays reset titled card with parameters`, t => {
	const {lastFrame} = render(<App />);

	t.true(lastFrame()!.includes('hard'));
	t.true(lastFrame()!.includes('treeIsh'));
});

test('does not renders not main items', t => {
	const {lastFrame} = render(<App />);

	t.notRegex(lastFrame()!, /check-updates/);
});

test('renders all items when isOnlyMain is set to false', t => {
	const {lastFrame} = render(<App isOnlyMain={false} />);

	t.regex(lastFrame()!, /check-updates/);
	t.regex(lastFrame()!, /restore/);
	t.true(typeof chalk.hex === 'function');
});
