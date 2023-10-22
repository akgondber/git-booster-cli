import React from 'react';
import chalk from 'chalk';
import test from 'ava';
import {render} from 'ink-testing-library';
import App from './source/app.js';

test(`displays push titled card with parameters`, t => {
	const {lastFrame} = render(<App />);

	t.true(lastFrame()!.includes('branch'));
	t.true(lastFrame()!.includes('remote'));
});

test('does not renders not main items', t => {
	const {lastFrame} = render(<App />);

	t.notRegex(lastFrame()!, /check-updates/);
});

test('renders all items when isOnlyMain is set to false', t => {
	const {lastFrame} = render(<App isOnlyMain={false} />);

	t.true(lastFrame()!.includes('add-commit'));
	t.true(lastFrame()!.includes('push'));
	t.true(lastFrame()!.includes('add-commit-push'));
	t.true(typeof chalk.hex === 'function');
});
