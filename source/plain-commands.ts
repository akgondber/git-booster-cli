import {toBoolean} from './helpers.js';
import {type BlockItem} from './types.js';

const plainCommands: BlockItem[] = [
	{
		id: 1,
		name: 'addCommit',
		displayName: 'add-commit',
		desc: 'Performs\ngit add -A\ngit commit -m <message>\n',
		tags: ['commit', 'composed'],
		requestedArgs: [
			{
				name: 'message',
				paramName: '-m',
				required: true,
			},
		],
	},
	{
		id: 2,
		name: 'push',
		displayName: 'push',
		desc: 'Performs\ngit push origin <branch>',
		tags: ['push'],
		requestedArgs: [
			{
				name: 'branch',
				paramName: '',
			},
			{
				name: 'force',
				paramName: 'force',
				excludeFromCommand: true,
			},
		],
	},
	{
		id: 3,
		name: 'addCommitPush',
		displayName: 'add-commit-push',
		desc: 'Performs \ngit add -A\ngit commit -m <message>\ngit push origin <branch>',
		tags: ['commit', 'push'],
		requestedArgs: [
			{
				name: 'message',
				required: true,
				path: ['commit', 'message'],
				paramName: '-m',
			},
			{
				name: 'branch',
				path: ['push', 'branch'],
				excludeFromCommand: true,
				paramName: '',
			},
		],
	},
	{
		id: 4,
		name: 'log',
		displayName: 'log',
		tags: ['log'],
		requestedArgs: [
			{
				name: 'count',
				paramName: '-n',
			},
			{
				name: 'after',
				paramName: '--since',
			},
			{
				name: 'before',
				paramName: '--until',
			},
			{
				name: 'author',
				paramName: '--author',
			},
			{
				name: 'patch',
				paramName: '',
				mapToRule(value) {
					return toBoolean(value) ? '-p' : undefined;
				},
				excludeFromCommand: true,
			},
			{
				name: 'oneline',
				paramName: '',
				mapToRule(value) {
					return toBoolean(value) ? '--oneline' : undefined;
				},
				excludeFromCommand: true,
			},
		],
	},
	{
		id: 5,
		name: 'diff',
		displayName: 'diff',
		tags: ['diff'],
		requestedArgs: [
			{
				name: 'target',
				paramName: '',
			},
		],
	},
	{
		id: 6,
		name: 'status',
		displayName: 'status',
		tags: ['status'],
		requestedArgs: [
			{
				name: 'short',
				paramName: '',
				mapToRule: value => (toBoolean(value) ? '--short' : undefined),
				excludeFromCommand: true,
			},
		],
	},
	{
		id: 7,
		name: 'addInteractive',
		displayName: 'add-interactive',
		tags: ['add', 'interactive'],
		requestedArgs: [],
	},
	{
		id: 8,
		name: 'checkUpdates',
		displayName: 'check-updates',
		tags: ['remote', 'check', 'uptodate'],
		requestedArgs: [],
	},
	{
		id: 9,
		name: 'reset',
		displayName: 'reset',
		tags: ['reset'],
		requestedArgs: [
			{
				name: 'hard',
				paramName: '',
				excludeFromCommand: true,
			},
			{
				name: 'treeIsh',
				paramName: '',
				mapToSelf: true,
				excludeFromCommand: true,
				required: true,
			},
		],
	},
	{
		id: 10,
		name: 'restore',
		displayName: 'restore',
		tags: ['restore'],
		requestedArgs: [
			{
				name: 'path',
				paramName: '',
				mapToSelf: true,
				excludeFromCommand: true,
				required: true,
			},
		],
	},
	{
		id: 11,
		name: 'rebase',
		displayName: 'rebase',
		tags: ['rebase'],
		requestedArgs: [
			{
				name: 'source',
				paramName: '',
				mapToSelf: true,
				excludeFromCommand: true,
			},
			{
				name: 'interactive',
				paramName: '',
				mapToRule(value) {
					return toBoolean(value) ? '-i' : undefined;
				},
				excludeFromCommand: true,
			},
		],
	},
	{
		id: 12,
		name: 'commit',
		displayName: 'commit',
		tags: ['commit'],
		requestedArgs: [
			{
				name: 'amend',
				paramName: '',
				mapToRule: value => (toBoolean(value) ? '--amend' : undefined),
				excludeFromCommand: true,
			},
			{
				name: 'message',
				paramName: '-m',
			},
		],
	},
];

export {plainCommands};
