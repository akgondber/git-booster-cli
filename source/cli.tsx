#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ git-blocks-cli

	Options
		--all            Display all available blocks
		--short-statuses Use short status notations for change types
		--tag            Display only blocks having specified tags (separated by comma)

	Examples
	  $ git-blocks-cli --all
	  $ git-blocks-cli --no-short-statuses
	  $ git-booster-cli --tag add,commit,reset,restore
`,
	{
		importMeta: import.meta,
		flags: {
			all: {
				type: 'boolean',
				default: false,
			},
			shortStatuses: {
				type: 'boolean',
				default: true,
			},
			tag: {
				type: 'string',
			},
		},
	},
);

const {all, shortStatuses, tag} = cli.flags;

render(<App isOnlyMain={!all} isShortStatuses={shortStatuses} tags={tag} />);
