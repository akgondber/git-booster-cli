#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
		$ git-booster-cli

	Options
		--all, -a              Display all available blocks (default behaviour)
		--only, -o             Display only specified block
		--compound, -c         Display only blocks with multiple command sets
		--short-statuses, -s   Use short status notations for change types
		--tag, -t              Display only blocks having specified tags (separated by comma)
		--show-descriptions, -d Display descriptions for blocks (if present)

   Examples
		$ git-booster-cli
		$ git-booster-cli --compound
		$ git-booster-cli --only addCommitPush
		$ git-booster-cli --no-short-statuses
		$ git-booster-cli --tag add,commit,reset,restore
`,
	{
		importMeta: import.meta,
		flags: {
			all: {
				type: 'boolean',
				default: true,
				shortFlag: 'a',
			},
			only: {
				type: 'string',
				shortFlag: 'o',
			},
			compound: {
				type: 'boolean',
				shortFlag: 'c',
			},
			shortStatuses: {
				type: 'boolean',
				default: true,
				shortFlag: 's',
			},
			showDescriptions: {
				type: 'boolean',
				default: false,
				shortFlag: 'd',
			},
			tag: {
				type: 'string',
				shortFlag: 't',
			},
		},
	},
);

const {all, only, compound, shortStatuses, showDescriptions, tag} = cli.flags;

render(
	<App
		isOnlyMain={!all}
		isOnlyBlock={only}
		isOnlyCompound={compound}
		isShortStatuses={shortStatuses}
		isShowDescriptions={showDescriptions}
		tags={tag}
	/>,
);
