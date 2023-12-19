import {toBoolean} from './helpers.js';
import {type BlockItem} from './types.js';

const plainCommands: BlockItem[] = [
	{
		id: 1,
		name: 'addCommit',
		displayName: 'add-commit',
		desc: 'Performs\ngit add -A\ngit commit -m <message>\n',
		tags: ['commit', 'composed', 'compound', 'composite'],
		namespaced: true,
		requestedArgs: [
			{
				name: 'message',
				paramName: '-m',
				path: ['commit', 'message'],
				required: true,
				defaultValue: 'Added ',
			},
			{
				name: 'quiet',
				paramName: '',
				path: ['commit', 'quiet'],
				mapToParam: true,
				excludeFromCommand: true,
				defaultValue: 'false',
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
				required: true,
				defaultValue: 'main',
			},
			{
				name: 'force',
				paramName: 'force',
				mapToParam: true,
				excludeFromCommand: true,
				defaultValue: 'false',
			},
			{
				name: 'remote',
				paramName: '',
				mapToSelf: true,
				excludeFromCommand: true,
				defaultValue: 'origin',
			},
		],
	},
	{
		id: 3,
		name: 'addCommitPush',
		displayName: 'add-commit-push',
		desc: 'Performs \ngit add -A\ngit commit -m <message>\ngit push origin <branch>',
		tags: ['commit', 'push', 'compound', 'composite'],
		namespaced: true,
		requestedArgs: [
			{
				name: 'message',
				required: true,
				path: ['commit', 'message'],
				paramName: '-m',
				defaultValue: 'Added ',
			},
			{
				name: 'remote',
				path: ['push', 'remote'],
				paramName: '',
				required: true,
				excludeFromCommand: true,
				mapToSelf: true,
				defaultValue: 'origin',
			},
			{
				name: 'branch',
				path: ['push', 'branch'],
				excludeFromCommand: true,
				mapToSelf: true,
				paramName: '',
				defaultValue: 'main',
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
				defaultValue: '2',
			},
			{
				name: 'grep',
				paramName: '--grep',
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
				mapToParam: true,
				excludeFromCommand: true,
				defaultValue: 'false',
			},
			{
				name: 'oneline',
				paramName: '',
				mapToRule(value) {
					return toBoolean(value) ? '--oneline' : undefined;
				},
				excludeFromCommand: true,
				defaultValue: 'false',
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
				defaultValue: '.',
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
				defaultValue: 'false',
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
				mapToParam: true,
				excludeFromCommand: true,
				defaultValue: 'false',
			},
			{
				name: 'treeIsh',
				paramName: '',
				mapToSelf: true,
				excludeFromCommand: true,
				required: true,
				defaultValue: 'HEAD~2',
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
				defaultValue: '.',
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
				name: 'root',
				paramName: '',
				mapToParam: true,
				excludeFromCommand: true,
				defaultValue: 'false',
			},
			{
				name: 'source',
				paramName: '',
				mapToSelf: true,
				excludeFromCommand: true,
				skipIfAnyPropIsSet: ['root'],
				defaultValue: 'HEAD~2',
			},
			{
				name: 'interactive',
				paramName: '',
				mapToRule(value) {
					return toBoolean(value) ? '-i' : undefined;
				},
				excludeFromCommand: true,
				defaultValue: 'false',
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
				defaultValue: 'false',
			},
			{
				name: 'message',
				paramName: '-m',
				defaultValue: 'Added ',
			},
		],
	},
	{
		id: 13,
		name: 'cloneCheckout',
		displayName: 'clone-checkout',
		tags: ['clone', 'checkout', 'compound', 'composite'],
		namespaced: true,
		requestedArgs: [
			{
				name: 'remote',
				path: ['clone', 'remote'],
				paramName: '',
				required: true,
				mapToSelf: true,
				defaultValue: 'git@github.com:akgondber/micro-starter.git',
			},
			{
				name: 'newBranch',
				path: ['checkout', 'branch'],
				paramName: '-b',
				required: true,
			},
		],
	},
	{
		id: 14,
		name: 'info',
		displayName: 'info',
		tags: ['info', 'misc'],
		requestedArgs: [],
	},
	{
		id: 15,
		name: 'conflicts',
		displayName: 'files-with-conflicts',
		tags: ['files', 'ls', 'conflicts'],
		requestedArgs: [],
	},
	{
		id: 16,
		name: 'stash',
		displayName: 'stash',
		tags: ['stash'],
		requestedArgs: [
			{
				name: 'subcommand',
				paramName: '',
				mapToSelf: true,
				defaultValue: 'push',
			},
			{
				name: 'keep-index',
				paramName: '',
				mapToParam: true,
				excludeFromCommand: true,
				hideWhenOtherPropertyValueNotIn: ['subcommand', ['', 'push', 'save']],
			},
		],
	},
	{
		id: 17,
		name: 'shortlog',
		displayName: 'contrib',
		tags: ['log', 'shortlog', 'author', 'contrib', 'contribution'],
		requestedArgs: [
			{
				name: 'author',
				paramName: '--author',
			},
			{
				name: 'format',
				paramName: '',
				required: true,
				excludeFromCommand: true,
				mapToRule(value) {
					return `--format=${value}`;
				},
				defaultValue: '%h %s',
			},
		],
	},
	{
		id: 18,
		name: 'tag',
		displayName: 'tag',
		tags: ['tag'],
		requestedArgs: [
			{
				name: 'tagName',
				paramName: '',
				mapToSelf: true,
			},
			{
				name: 'delete',
				paramName: '',
				excludeFromCommand: true,
				mapToRule(value) {
					return toBoolean(value) ? '-d' : undefined;
				},
				defaultValue: 'no',
			},
			{
				name: 'annotated',
				paramName: '-a',
				excludeFromCommand: true,
				mapToRule(value) {
					return toBoolean(value) ? '-a' : undefined;
				},
				defaultValue: 'no',
			},
			{
				name: 'message',
				paramName: '-m',
				hideWhenOtherPropertyValueIsFalsey: ['annotated'],
			},
		],
	},
];

export {plainCommands};
