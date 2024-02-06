import {toBoolean} from './helpers.js';
import {type BlockItem} from './types.js';

const plainCommands: BlockItem[] = [
	{
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
				defaultValue: 'Add ',
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
				defaultValue: 'Add ',
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
		name: 'addCommitTagPush',
		displayName: 'add-commit-tag-push',
		desc: 'Performs \ngit add -A\ngit commit -m <message>\ngit tag <tag>\ngit push --atomic <remote> <branch> <tag>',
		tags: ['commit', 'push', 'compound', 'composite'],
		namespaced: true,
		requestedArgs: [
			{
				name: 'message',
				required: true,
				path: ['commit', 'message'],
				paramName: '-m',
				defaultValue: 'Add ',
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
			{
				name: 'tag',
				path: ['push', 'tag'],
				paramName: '',
				required: true,
				excludeFromCommand: true,
				mapToSelf: true,
			},
		],
	},
	{
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
		name: 'addInteractive',
		displayName: 'add-interactive',
		tags: ['add', 'interactive'],
		requestedArgs: [],
	},
	{
		name: 'checkUpdates',
		displayName: 'check-updates',
		tags: ['remote', 'check', 'uptodate'],
		requestedArgs: [],
	},
	{
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
				defaultValue: 'Add ',
			},
		],
	},
	{
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
		name: 'info',
		displayName: 'info',
		tags: ['info', 'misc'],
		requestedArgs: [],
	},
	{
		name: 'conflicts',
		displayName: 'files-with-conflicts',
		tags: ['files', 'ls', 'conflicts'],
		requestedArgs: [],
	},
	{
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
	{
		name: 'show-tree',
		displayName: 'show-tree',
		tags: ['log', 'show-tree', 'showtree', 'simplifybydecoration'],
		requestedArgs: [
			{
				name: 'count',
				path: ['show', 'count'],
				paramName: '',
				excludeFromCommand: true,
			},
		],
	},
	{
		name: 'git-recent',
		displayName: 'git-recent',
		tags: ['log', 'foreachref', 'contrib', 'activity'],
		requestedArgs: [
			{
				name: 'count',
				path: ['reset', 'count'],
				paramName: '',
				excludeFromCommand: true,
			},
		],
	},
];

export {plainCommands};
